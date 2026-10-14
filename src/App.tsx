import React, { useState, useEffect } from 'react';
import {
  AlumnoData,
  ConfiguracionLegajo,
  CronogramaSemanal,
  EscuelaConfig,
  DocumentosSeleccionados,
  FormatoFinal,
  AdjuntoDoc,
  PresupuestoHistorialItem,
  UserRole,
} from './types';
import {
  DEFAULT_ALUMNO,
  DEFAULT_CONFIG,
  DEFAULT_CRONOGRAMA,
  getAlumnosGuardados,
  saveAlumno,
  saveAlumnosBatch,
  deleteAlumno,
  getEscuelaConfig,
  saveEscuelaConfig,
  getResolucionesNombres,
  saveCustomResoluciones,
  getHistorialPresupuestos,
  saveHistorialPresupuesto,
} from './utils/storage';
import { numeroALetras } from './utils/numberToWords';
import { generarLegajoCompleto, GeneratedDocument } from './utils/pdfGenerator';
import { ResolucionItem } from './utils/excelUtils';
import { Header } from './components/Header';
import { AlumnoForm } from './components/AlumnoForm';
import { ConfiguracionForm } from './components/ConfiguracionForm';
import { OpcionesGeneracion } from './components/OpcionesGeneracion';
import { PdfViewerModal } from './components/PdfViewerModal';
import { AlumnosModal } from './components/AlumnosModal';
import { EscuelaConfigModal } from './components/EscuelaConfigModal';
import { PdfTemplateExplainerModal } from './components/PdfTemplateExplainerModal';
import { AttachmentModal } from './components/AttachmentModal';
import { ExcelManagerModal } from './components/ExcelManagerModal';
import { FormulariosManagerModal } from './components/FormulariosManagerModal';
import { WebVsAppModal } from './components/WebVsAppModal';
import { AdminPinModal } from './components/AdminPinModal';

export default function App() {
  // Main form states
  const [alumno, setAlumno] = useState<AlumnoData>(DEFAULT_ALUMNO);
  const [config, setConfig] = useState<ConfiguracionLegajo>(DEFAULT_CONFIG);
  const [cronograma, setCronograma] = useState<CronogramaSemanal>(DEFAULT_CRONOGRAMA);
  const [escuela, setEscuela] = useState<EscuelaConfig>(getEscuelaConfig());
  const [alumnosList, setAlumnosList] = useState<AlumnoData[]>(getAlumnosGuardados());
  const [resolucionesNombres, setResolucionesNombres] = useState<string[]>(getResolucionesNombres());
  const [historial, setHistorial] = useState<PresupuestoHistorialItem[]>(getHistorialPresupuestos());

  // Generation options
  const [docs, setDocs] = useState<DocumentosSeleccionados>({
    ficha: true,
    presupuesto: true,
    consentimiento: true,
    planTrabajo: true,
    car: true,
    docColegio: true,
    actaAcuerdo: true,
    planillasAsistencia: true,
    planillaFacturacion: true,
    formulariosFijosJuntos: true,
    formulariosObraSocial: true,
  });

  const [formato, setFormato] = useState<FormatoFinal>('unificado');
  const [adjuntos, setAdjuntos] = useState<AdjuntoDoc[]>([]);

  // Generated results
  const [unificadoBytes, setUnificadoBytes] = useState<Uint8Array | null>(null);
  const [individuales, setIndividuales] = useState<GeneratedDocument[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);

  // Modals
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [isAlumnosOpen, setIsAlumnosOpen] = useState(false);
  const [isEscuelaOpen, setIsEscuelaOpen] = useState(false);
  const [isFormulariosOpen, setIsFormulariosOpen] = useState(false);
  const [isExcelOpen, setIsExcelOpen] = useState(false);
  const [isWebVsAppOpen, setIsWebVsAppOpen] = useState(false);
  const [attachmentModalType, setAttachmentModalType] = useState<'informe' | 'dni_carnet' | null>(null);

  // User Role & Admin PIN
  const [userRole, setUserRole] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('modo') || params.get('rol');
      if (m === 'admin' || params.get('admin') === 'true') return 'admin';
      if (m === 'operador') return 'operador';
      const saved = localStorage.getItem('legajos_user_role');
      if (saved === 'admin' || saved === 'operador') return saved;
    }
    return 'admin';
  });

  const [adminPin, setAdminPin] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('legajos_admin_pin') || '1234';
    }
    return '1234';
  });

  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);

  const handleToggleRole = () => {
    if (userRole === 'admin') {
      setUserRole('operador');
      localStorage.setItem('legajos_user_role', 'operador');
    } else {
      setIsAdminPinModalOpen(true);
    }
  };

  const handleUnlockAdmin = () => {
    setUserRole('admin');
    localStorage.setItem('legajos_user_role', 'admin');
  };

  const handleUpdateAdminPin = (newPin: string) => {
    setAdminPin(newPin);
    localStorage.setItem('legajos_admin_pin', newPin);
  };

  // Adapt documents selection when Obra Social changes
  const handleConfigChange = (updated: Partial<ConfiguracionLegajo>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updated };

      // Automatic matching rule: For specific Obras Sociales, ensure CAR and Presupuesto are checked
      if (updated.obraSocial) {
        const osUpper = updated.obraSocial.toUpperCase();
        if (
          osUpper.includes('ASE') ||
          osUpper.includes('OSDE') ||
          osUpper.includes('SWISS') ||
          osUpper.includes('IOMA') ||
          osUpper.includes('GALENO')
        ) {
          setDocs((prevDocs) => ({ ...prevDocs, car: true, presupuesto: true, planTrabajo: true }));
        }
      }

      return next;
    });
  };

  const handleAlumnoChange = (updated: Partial<AlumnoData>) => {
    setAlumno((prev) => ({ ...prev, ...updated }));
  };

  const handleClearAlumno = () => {
    setAlumno({
      apellidoNombre: '',
      dni: '',
      edad: '',
      fechaNacimiento: '',
      numAfiliado: '',
      diagnostico: '',
      escuelaComun: '',
      direccionEscuela: '',
      grado: '',
      turno: 'Mañana',
      nombreTitular: '',
      dniTitular: '',
      parentesco: 'Madre',
      numAfiliadoTitular: '',
    });
  };

  const handleSaveAlumnoToDirectory = () => {
    if (!alumno.apellidoNombre.trim() || !alumno.dni.trim()) {
      alert('Por favor ingrese al menos el Apellido/Nombre y DNI del alumno para guardarlo.');
      return;
    }
    const updated = saveAlumno(alumno);
    setAlumnosList(updated);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  const handleSearchDni = () => {
    const cleanDni = alumno.dni.replace(/\D/g, '');
    if (!cleanDni) {
      setIsAlumnosOpen(true);
      return;
    }

    const found = alumnosList.find(
      (a) => a.dni.replace(/\D/g, '') === cleanDni || a.dni.includes(cleanDni)
    );

    if (found) {
      setAlumno(found);
      setSavedNotification(true);
      setTimeout(() => setSavedNotification(false), 1500);
    } else {
      setIsAlumnosOpen(true);
    }
  };

  const handleSelectAlumnoFromList = (selected: AlumnoData) => {
    setAlumno(selected);
  };

  const handleDeleteAlumnoFromList = (id: string) => {
    const updated = deleteAlumno(id);
    setAlumnosList(updated);
  };

  const handleSaveEscuela = (newConfig: EscuelaConfig) => {
    saveEscuelaConfig(newConfig);
    setEscuela(newConfig);
  };

  // Import from Excel handlers
  const handleAlumnosImportados = (nuevos: AlumnoData[]) => {
    const updated = saveAlumnosBatch(nuevos);
    setAlumnosList(updated);
    if (nuevos.length > 0) {
      setAlumno(nuevos[0]);
    }
  };

  const handleResolucionesActualizadas = (items: ResolucionItem[]) => {
    saveCustomResoluciones(items);
    const updatedNombres = getResolucionesNombres();
    setResolucionesNombres(updatedNombres);

    // If an item matches current selected modalidad, auto update arancel and resolucion
    const matching = items.find((i) =>
      i.prestacion.toLowerCase().includes(config.modalidad.toLowerCase()) ||
      config.modalidad.toLowerCase().includes(i.prestacion.toLowerCase())
    );

    if (matching && matching.arancel > 0) {
      setConfig((prev) => ({
        ...prev,
        matriculaCuota: matching.arancel,
        resolucionMes: matching.resolucion + (matching.mes ? ' ' + matching.mes : ''),
      }));
    } else if (items.length > 0) {
      setConfig((prev) => ({
        ...prev,
        resolucionMes: items[0].resolucion + (items[0].mes ? ' ' + items[0].mes : ''),
      }));
    }
  };

  // Generation execution
  const handleGenerarLegajo = async () => {
    if (!alumno.apellidoNombre.trim()) {
      alert('Por favor complete el nombre y apellido del alumno.');
      return;
    }

    setIsGenerating(true);
    try {
      // Prepare attachments if any
      const adjuntosBytes: { nombre: string; bytes: Uint8Array }[] = [];
      for (const adj of adjuntos) {
        if (adj.fileDataUrl.startsWith('data:application/pdf;base64,')) {
          const base64Data = adj.fileDataUrl.replace('data:application/pdf;base64,', '');
          const binaryString = window.atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          adjuntosBytes.push({ nombre: adj.nombre, bytes });
        }
      }

      const resultado = await generarLegajoCompleto(
        alumno,
        config,
        escuela,
        cronograma,
        docs,
        adjuntosBytes
      );

      // Record this generated legajo into persistent history so Excel export has ALL budgets!
      saveHistorialPresupuesto({
        fechaGeneracion: config.emisionFecha || new Date().toLocaleDateString('es-AR'),
        alumnoNombre: alumno.apellidoNombre,
        alumnoDni: alumno.dni,
        alumnoAfiliado: alumno.numAfiliado,
        obraSocial: config.obraSocial,
        modalidad: config.modalidad,
        escuelaComun: alumno.escuelaComun,
        grado: alumno.grado,
        turno: alumno.turno,
        periodo: `${config.periodoDesde} a ${config.periodoHasta}`,
        anio: config.anio,
        montoCuota: config.matriculaCuota,
        montoLetras: numeroALetras(config.matriculaCuota),
        resolucion: config.resolucionMes,
        titularNombre: alumno.nombreTitular,
        titularDni: alumno.dniTitular,
        documentosIncluidos: resultado.individuales.map((d) => d.id),
      });
      setHistorial(getHistorialPresupuestos());

      setUnificadoBytes(resultado.unificado);
      setIndividuales(resultado.individuales);
      setIsViewerOpen(true);
    } catch (err) {
      console.error('Error al generar legajo:', err);
      alert('Ocurrió un error al generar los documentos PDF. Por favor verifique los datos.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans text-gray-800 antialiased">
      {/* Top Application Bar */}
      <Header
        onOpenExplainer={() => setIsExplainerOpen(true)}
        onOpenFormularios={() => setIsFormulariosOpen(true)}
        onOpenAlumnos={() => setIsAlumnosOpen(true)}
        onOpenEscuela={() => setIsEscuelaOpen(true)}
        onOpenExcelManager={() => setIsExcelOpen(true)}
        onOpenInstallApp={() => setIsWebVsAppOpen(true)}
        alumnosCount={alumnosList.length}
        userRole={userRole}
        onToggleRole={handleToggleRole}
        onOpenPinModal={() => setIsAdminPinModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-4">
        {/* Two-Column Form Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Alumno & Titular */}
          <div className="lg:col-span-6 space-y-4">
            <AlumnoForm
              alumno={alumno}
              onChange={handleAlumnoChange}
              onClear={handleClearAlumno}
              onSaveToDirectory={handleSaveAlumnoToDirectory}
              onSearchDni={handleSearchDni}
              onOpenExcel={() => setIsExcelOpen(true)}
              savedNotification={savedNotification}
            />
          </div>

          {/* Right Column: Configuración, Aranceles y Cronograma */}
          <div className="lg:col-span-6 space-y-4">
            <ConfiguracionForm
              config={config}
              cronograma={cronograma}
              resolucionesNombres={resolucionesNombres}
              onConfigChange={handleConfigChange}
              onCronogramaChange={setCronograma}
              onOpenExcelResoluciones={() => setIsExcelOpen(true)}
            />
          </div>
        </div>

        {/* Lower Full-Width Block: Opciones de Generación y Acciones del Legajo */}
        <OpcionesGeneracion
          docs={docs}
          onDocsChange={(updated) => setDocs((prev) => ({ ...prev, ...updated }))}
          formato={formato}
          onFormatoChange={setFormato}
          onGenerarLegajo={handleGenerarLegajo}
          onPrevisualizar={() => {
            if (!unificadoBytes && individuales.length === 0) {
              handleGenerarLegajo();
            } else {
              setIsViewerOpen(true);
            }
          }}
          onAbrirAdjuntoInforme={() => setAttachmentModalType('informe')}
          onAbrirAdjuntoDni={() => setAttachmentModalType('dni_carnet')}
          adjuntos={adjuntos}
          isGenerating={isGenerating}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-2.5 px-4 text-center text-xs text-gray-500">
        <div className="flex flex-wrap items-center justify-between max-w-7xl mx-auto gap-2">
          <span>
            {escuela.nombreInstitucion} • {escuela.cuit} • {escuela.localidad}
          </span>
          <span className="text-[11px] text-emerald-800 font-medium">
            ✓ Escuela Especial • Procesamiento PDF Nativo & Excel Completo • Reordenamiento Dinámico de Páginas
          </span>
        </div>
      </footer>

      {/* Modals */}
      <PdfViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        unificadoBytes={unificadoBytes}
        individuales={individuales}
        formato={formato}
        alumno={alumno}
      />

      <PdfTemplateExplainerModal
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
        alumno={alumno}
        config={config}
      />

      <AlumnosModal
        isOpen={isAlumnosOpen}
        onClose={() => setIsAlumnosOpen(false)}
        alumnos={alumnosList}
        onSelectAlumno={handleSelectAlumnoFromList}
        onDeleteAlumno={handleDeleteAlumnoFromList}
        onOpenExcelManager={() => setIsExcelOpen(true)}
      />

      <EscuelaConfigModal
        isOpen={isEscuelaOpen}
        onClose={() => setIsEscuelaOpen(false)}
        config={escuela}
        onSave={handleSaveEscuela}
      />

      <FormulariosManagerModal
        isOpen={isFormulariosOpen}
        onClose={() => setIsFormulariosOpen(false)}
        alumno={alumno}
        config={config}
        cronograma={cronograma}
      />

      <AttachmentModal
        isOpen={attachmentModalType !== null}
        onClose={() => setAttachmentModalType(null)}
        tipo={attachmentModalType || 'informe'}
        adjuntos={adjuntos}
        onAddAdjunto={(nuevo) => setAdjuntos((prev) => [...prev, nuevo])}
        onDeleteAdjunto={(id) => setAdjuntos((prev) => prev.filter((a) => a.id !== id))}
      />

      <ExcelManagerModal
        isOpen={isExcelOpen}
        onClose={() => setIsExcelOpen(false)}
        alumnos={alumnosList}
        historial={historial}
        onAlumnosImportados={handleAlumnosImportados}
        onResolucionesActualizadas={handleResolucionesActualizadas}
      />

      <WebVsAppModal
        isOpen={isWebVsAppOpen}
        onClose={() => setIsWebVsAppOpen(false)}
      />

      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onClose={() => setIsAdminPinModalOpen(false)}
        onSuccess={handleUnlockAdmin}
        currentPin={adminPin}
        onUpdatePin={handleUpdateAdminPin}
        isAdmin={userRole === 'admin'}
      />
    </div>
  );
}
