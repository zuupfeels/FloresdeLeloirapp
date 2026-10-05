import React, { useState } from 'react';
import { AlumnoData, PresupuestoHistorialItem } from '../types';
import {
  exportarAlumnosAExcel,
  importarAlumnosDesdeExcel,
  descargarPlantillaExcelAlumnos,
  importarResolucionesDesdeExcel,
  descargarPlantillaExcelResoluciones,
  exportarHistorialPresupuestosAExcel,
  ResolucionItem,
} from '../utils/excelUtils';
import { formatearMoneda } from '../utils/numberToWords';
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Sparkles,
  Layers,
  Users,
  History,
  FileText,
} from 'lucide-react';

interface ExcelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  alumnos: AlumnoData[];
  historial: PresupuestoHistorialItem[];
  onAlumnosImportados: (nuevosAlumnos: AlumnoData[]) => void;
  onResolucionesActualizadas: (resoluciones: ResolucionItem[]) => void;
}

export const ExcelManagerModal: React.FC<ExcelManagerModalProps> = ({
  isOpen,
  onClose,
  alumnos,
  historial,
  onAlumnosImportados,
  onResolucionesActualizadas,
}) => {
  const [activeTab, setActiveTab] = useState<'presupuestos' | 'alumnos' | 'resoluciones'>('presupuestos');
  const [importStatus, setImportStatus] = useState<{ tipo: 'ok' | 'error'; mensaje: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Handle students file upload
  const handleAlumnosFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportStatus(null);
    try {
      const parsed = await importarAlumnosDesdeExcel(file);
      if (parsed.length === 0) {
        setImportStatus({ tipo: 'error', mensaje: 'No se encontraron registros de alumnos válidos en el archivo.' });
      } else {
        onAlumnosImportados(parsed);
        setImportStatus({
          tipo: 'ok',
          mensaje: `¡Se importaron ${parsed.length} alumnos con éxito a la base de datos escolar!`,
        });
      }
    } catch (err: any) {
      console.error('Error importing alumnos excel:', err);
      setImportStatus({
        tipo: 'error',
        mensaje: 'Error al leer el archivo Excel. Verifique que el formato sea .xlsx o .csv válido.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle resolutions file upload
  const handleResolucionesFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportStatus(null);
    try {
      const parsed = await importarResolucionesDesdeExcel(file);
      if (parsed.length === 0) {
        setImportStatus({ tipo: 'error', mensaje: 'No se encontraron resoluciones válidas en el archivo.' });
      } else {
        onResolucionesActualizadas(parsed);
        setImportStatus({
          tipo: 'ok',
          mensaje: `¡Se cargaron ${parsed.length} aranceles y resoluciones del Nomenclador con éxito!`,
        });
      }
    } catch (err: any) {
      console.error('Error importing resoluciones excel:', err);
      setImportStatus({
        tipo: 'error',
        mensaje: 'Error al leer el archivo Excel de resoluciones. Verifique las columnas.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-300">
        {/* Header */}
        <div className="bg-emerald-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-emerald-800 rounded text-emerald-200">
              <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            </span>
            <div>
              <h2 className="text-sm font-bold">Gestor de Archivos Base en Excel (.xlsx)</h2>
              <p className="text-[11px] text-emerald-200">
                Exportá el historial completo de presupuestos realizados, base de alumnos y resoluciones
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-emerald-300 hover:text-white hover:bg-emerald-800 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50 text-xs">
          <button
            onClick={() => {
              setActiveTab('presupuestos');
              setImportStatus(null);
            }}
            className={`flex-1 py-3 px-3 font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'presupuestos'
                ? 'border-emerald-600 text-emerald-900 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-4 h-4 text-emerald-700" />
            <span>Todos los Presupuestos ({historial.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('alumnos');
              setImportStatus(null);
            }}
            className={`flex-1 py-3 px-3 font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'alumnos'
                ? 'border-emerald-600 text-emerald-900 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-700" />
            <span>Base de Alumnos ({alumnos.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('resoluciones');
              setImportStatus(null);
            }}
            className={`flex-1 py-3 px-3 font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'resoluciones'
                ? 'border-emerald-600 text-emerald-900 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-700" />
            <span>Resoluciones del Nomenclador</span>
          </button>
        </div>

        {/* Notifications */}
        {importStatus && (
          <div
            className={`p-3 text-xs flex items-center gap-2 ${
              importStatus.tipo === 'ok'
                ? 'bg-emerald-100 text-emerald-900 border-b border-emerald-200'
                : 'bg-red-100 text-red-900 border-b border-red-200'
            }`}
          >
            {importStatus.tipo === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            )}
            <span>{importStatus.mensaje}</span>
          </div>
        )}

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* TAB 1: HISTORIAL COMPLETO DE PRESUPUESTOS (TODOS LOS REALIZADOS) */}
          {activeTab === 'presupuestos' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Registro Histórico de TODOS los Presupuestos Realizados</span>
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Acá se recopilan automáticamente todos los presupuestos emitidos en la escuela con sus montos, fechas, resoluciones y obras sociales.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => exportarHistorialPresupuestosAExcel(historial)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold flex items-center gap-1.5 shadow-sm transition shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Excel con TODOS los Presupuestos</span>
                </button>
              </div>

              {/* Table of all budgets */}
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold">
                        <th className="p-2.5">Fecha</th>
                        <th className="p-2.5">Alumno</th>
                        <th className="p-2.5">DNI</th>
                        <th className="p-2.5">Obra Social</th>
                        <th className="p-2.5">Prestación</th>
                        <th className="p-2.5">Valor Cuota</th>
                        <th className="p-2.5">Resolución</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {historial.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center p-8 text-gray-400">
                            Aún no se han generado presupuestos. Al hacer clic en "Generar Legajo Completo" se registrarán automáticamente aquí.
                          </td>
                        </tr>
                      ) : (
                        historial.map((item) => (
                          <tr key={item.id} className="hover:bg-emerald-50/50 transition">
                            <td className="p-2.5 text-gray-500 font-mono whitespace-nowrap">
                              {item.fechaGeneracion}
                            </td>
                            <td className="p-2.5 font-bold text-gray-900 whitespace-nowrap">
                              {item.alumnoNombre}
                            </td>
                            <td className="p-2.5 text-gray-600 font-mono whitespace-nowrap">
                              {item.alumnoDni}
                            </td>
                            <td className="p-2.5 font-semibold text-emerald-800 whitespace-nowrap">
                              {item.obraSocial}
                            </td>
                            <td className="p-2.5 text-gray-700 max-w-xs truncate" title={item.modalidad}>
                              {item.modalidad}
                            </td>
                            <td className="p-2.5 font-bold text-blue-900 whitespace-nowrap">
                              {formatearMoneda(item.montoCuota)}
                            </td>
                            <td className="p-2.5 text-gray-600 whitespace-nowrap">
                              {item.resolucion}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BASE DE ALUMNOS */}
          {activeTab === 'alumnos' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-1">
                <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Sincronización de Base de Alumnos</span>
                </h4>
                <p className="text-[11px] text-emerald-800">
                  Podés descargar un archivo Excel con todos los datos que vas cargando en la escuela o subir un Excel que ya tengas armado para cargar todos los alumnos de una sola vez.
                </p>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Exportar */}
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-3 flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-emerald-700" />
                      <span>1. Exportar Alumnos a Excel (.xlsx)</span>
                    </h5>
                    <p className="text-gray-500 text-[11px] mt-1">
                      Genera una planilla Excel completa con los {alumnos.length} alumnos registrados actualmente en el sistema.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => exportarAlumnosAExcel(alumnos)}
                    className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Excel de Alumnos (.xlsx)</span>
                  </button>
                </div>

                {/* 2. Importar */}
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-3 flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-blue-700" />
                      <span>2. Subir o Importar Alumnos (.xlsx)</span>
                    </h5>
                    <p className="text-gray-500 text-[11px] mt-1">
                      Subí tu planilla Excel y el sistema detectará automáticamente las columnas y guardará los alumnos.
                    </p>
                  </div>

                  <div>
                    <input
                      type="file"
                      id="upload-alumnos-excel"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleAlumnosFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="upload-alumnos-excel"
                      className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium flex items-center justify-center gap-2 shadow-xs cursor-pointer transition text-center"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isProcessing ? 'Procesando...' : 'Seleccionar Archivo Excel'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Download Sample Template */}
              <div className="pt-2 flex items-center justify-between border-t border-gray-200 text-gray-600">
                <span className="text-[11px]">
                  ¿Necesitás el formato de columnas recomendado para tu Excel?
                </span>
                <button
                  type="button"
                  onClick={descargarPlantillaExcelAlumnos}
                  className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold underline text-xs"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Descargar Plantilla de Ejemplo</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: RESOLUCIONES */}
          {activeTab === 'resoluciones' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-1">
                <h4 className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-700" />
                  <span>Carga de Resoluciones del Nomenclador de Discapacidad</span>
                </h4>
                <p className="text-[11px] text-blue-800">
                  Subí aquí el archivo Excel con las Resoluciones oficiales (ANDIS / Ministerio de Salud). Al subirlo, el sistema actualizará automáticamente la lista desplegable de resoluciones y sus aranceles vigentes.
                </p>
              </div>

              <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-3">
                <h5 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-700" />
                  <span>Subir Archivo Excel de Resoluciones</span>
                </h5>

                <div className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-lg p-5 text-center bg-gray-50 transition">
                  <input
                    type="file"
                    id="upload-resoluciones-excel"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleResolucionesFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="upload-resoluciones-excel"
                    className="cursor-pointer flex flex-col items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-8 h-8 text-emerald-700" />
                    <span className="font-semibold text-gray-800">
                      Hacé clic para seleccionar tu Excel con las Resoluciones y Aranceles
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Columnas admitidas: Resolución, Mes, Año, Prestación, Valor Cuota / Arancel
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-gray-500">
                    Podés descargar la plantilla modelo para completar tus aumentos:
                  </span>
                  <button
                    type="button"
                    onClick={descargarPlantillaExcelResoluciones}
                    className="flex items-center gap-1 text-blue-700 hover:text-blue-900 font-semibold underline text-xs"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Descargar Plantilla de Resoluciones (.xlsx)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
