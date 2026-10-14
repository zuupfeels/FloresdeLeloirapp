import React from 'react';
import { DocumentosSeleccionados, FormatoFinal, AdjuntoDoc } from '../types';
import { getFormulariosCustom } from '../utils/storage';
import {
  FileCheck2,
  Download,
  Paperclip,
  Eye,
  FileStack,
  FolderDown,
  CheckCheck,
  FileCode,
  FileArchive,
} from 'lucide-react';

interface OpcionesGeneracionProps {
  docs: DocumentosSeleccionados;
  onDocsChange: (updated: Partial<DocumentosSeleccionados>) => void;
  formato: FormatoFinal;
  onFormatoChange: (f: FormatoFinal) => void;
  onGenerarLegajo: () => void;
  onPrevisualizar: () => void;
  onAbrirAdjuntoInforme: () => void;
  onAbrirAdjuntoDni: () => void;
  adjuntos: AdjuntoDoc[];
  isGenerating: boolean;
  obraSocial?: string;
}

export const OpcionesGeneracion: React.FC<OpcionesGeneracionProps> = ({
  docs,
  onDocsChange,
  formato,
  onFormatoChange,
  onGenerarLegajo,
  onPrevisualizar,
  onAbrirAdjuntoInforme,
  onAbrirAdjuntoDni,
  adjuntos,
  isGenerating,
  obraSocial = 'OSDE',
}) => {
  const allChecked = Object.values(docs).every(Boolean);

  const toggleAll = () => {
    const nextVal = !allChecked;
    onDocsChange({
      ficha: nextVal,
      presupuesto: nextVal,
      consentimiento: nextVal,
      planTrabajo: nextVal,
      car: nextVal,
      docColegio: nextVal,
      actaAcuerdo: nextVal,
      planillasAsistencia: nextVal,
      planillaFacturacion: nextVal,
      formulariosFijosJuntos: nextVal,
      formulariosObraSocial: nextVal,
    });
  };

  const fijosJuntosCount = getFormulariosCustom().filter(
    (f) => f.tipoFormulario === 'fijo_juntos' || f.obraSocial.includes('JUNTOS')
  ).length;

  const osUpper = (obraSocial || '').toUpperCase();
  const obraSocialFormsCount = getFormulariosCustom().filter(
    (f) =>
      f.tipoFormulario !== 'fijo_juntos' &&
      !f.obraSocial.includes('JUNTOS') &&
      (f.obraSocial.toUpperCase() === osUpper ||
        osUpper.includes(f.obraSocial.toUpperCase()) ||
        f.obraSocial.toUpperCase().includes(osUpper))
  ).length;

  const informesCount = adjuntos.filter((a) => a.tipo === 'informe').length;
  const dniCarnetCount = adjuntos.filter((a) => a.tipo === 'dni_carnet' || a.tipo === 'cud').length;

  return (
    <div className="space-y-4">
      {/* 1. OPCIONES DE GENERACIÓN */}
      <div className="bg-rose-50/50 rounded-lg border border-rose-200/80 shadow-sm p-3.5">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-rose-200/80">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800 tracking-wide uppercase">
            <FileStack className="w-4 h-4 text-rose-800" />
            <span>Opciones de Generación</span>
          </div>

          <button
            type="button"
            onClick={toggleAll}
            className="text-[11px] font-medium text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>{allChecked ? 'Desmarcar todos' : 'Seleccionar todos'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
          {/* 1. Documentos a Generar */}
          <div className="lg:col-span-8">
            <span className="font-bold text-gray-800 block mb-2">1. Documentos:</span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-gray-800 font-medium">
                <input
                  type="checkbox"
                  checked={docs.ficha}
                  onChange={(e) => onDocsChange({ ficha: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Ficha</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-gray-800 font-medium">
                <input
                  type="checkbox"
                  checked={docs.presupuesto}
                  onChange={(e) => onDocsChange({ presupuesto: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Presupuesto</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-gray-800 font-medium">
                <input
                  type="checkbox"
                  checked={docs.consentimiento}
                  onChange={(e) => onDocsChange({ consentimiento: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Consentimiento</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-gray-800 font-medium">
                <input
                  type="checkbox"
                  checked={docs.planTrabajo}
                  onChange={(e) => onDocsChange({ planTrabajo: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Plan de Trabajo</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-gray-800 font-medium">
                <input
                  type="checkbox"
                  checked={docs.car}
                  onChange={(e) => onDocsChange({ car: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>CAR</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-gray-800 font-medium">
                <input
                  type="checkbox"
                  checked={docs.docColegio}
                  onChange={(e) => onDocsChange({ docColegio: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Doc. Colegio</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-gray-800 font-medium">
                <input
                  type="checkbox"
                  checked={docs.actaAcuerdo}
                  onChange={(e) => onDocsChange({ actaAcuerdo: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Acta Acuerdo</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-gray-800 font-medium col-span-2">
                <input
                  type="checkbox"
                  checked={docs.planillasAsistencia}
                  onChange={(e) => onDocsChange({ planillasAsistencia: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Planillas Anuales Asistencia (Familias)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-gray-800 font-medium col-span-2">
                <input
                  type="checkbox"
                  checked={docs.planillaFacturacion}
                  onChange={(e) => onDocsChange({ planillaFacturacion: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Planilla de Facturación (Administración)</span>
              </label>

              {/* Formularios Fijos Institucionales de JUNTOS */}
              <label className="flex items-center gap-1.5 cursor-pointer text-amber-950 font-bold col-span-2 sm:col-span-3 bg-amber-50/90 hover:bg-amber-100/80 px-2 py-1.5 rounded border border-amber-300 shadow-2xs transition">
                <input
                  type="checkbox"
                  checked={docs.formulariosFijosJuntos !== false}
                  onChange={(e) => onDocsChange({ formulariosFijosJuntos: e.target.checked })}
                  className="rounded text-amber-700 focus:ring-amber-500 w-3.5 h-3.5"
                />
                <span className="flex items-center justify-between flex-1 gap-2">
                  <span>🏫 Formularios Fijos Institucionales (JUNTOS)</span>
                  <span className="text-[10px] bg-amber-200/90 text-amber-900 px-1.5 py-0.2 rounded font-semibold shrink-0">
                    {fijosJuntosCount > 0 ? `${fijosJuntosCount} cargado(s)` : 'Base Escolar'}
                  </span>
                </span>
              </label>

              {/* Formularios Específicos de la Obra Social (Complementarios) */}
              <label className="flex items-center gap-1.5 cursor-pointer text-blue-950 font-bold col-span-2 sm:col-span-3 bg-blue-50/90 hover:bg-blue-100/80 px-2 py-1.5 rounded border border-blue-300 shadow-2xs transition">
                <input
                  type="checkbox"
                  checked={docs.formulariosObraSocial !== false}
                  onChange={(e) => onDocsChange({ formulariosObraSocial: e.target.checked })}
                  className="rounded text-blue-700 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="flex items-center justify-between flex-1 gap-2">
                  <span>🏥 Formularios Oficiales de la Obra Social (Complementarios)</span>
                  <span className="text-[10px] bg-blue-200/90 text-blue-900 px-1.5 py-0.2 rounded font-semibold shrink-0">
                    {obraSocialFormsCount > 0
                      ? `${obraSocialFormsCount} formulario(s) para ${obraSocial}`
                      : `Exigidos por ${obraSocial}`}
                  </span>
                </span>
              </label>

              {/* Nota explicativa de complementariedad */}
              <div className="col-span-2 sm:col-span-3 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded text-[10.5px] text-gray-600 flex items-start gap-1.5">
                <span className="text-blue-600 font-bold text-xs shrink-0">💡</span>
                <span>
                  <strong>Complementarios:</strong> Los formularios fijos de JUNTOS constituyen la documentación base institucional y <strong>no reemplazan</strong> las planillas oficiales que exige la obra social ({obraSocial}); ambas se integran y complementan de forma armónica dentro del legajo anual.
                </span>
              </div>
            </div>
          </div>

          {/* 2. Formato Final */}
          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-rose-200/80 pt-2 lg:pt-0 lg:pl-4">
            <span className="font-bold text-gray-800 block mb-2">2. Formato Final PDF:</span>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-950 bg-emerald-100/90 p-2 rounded-md border border-emerald-300 shadow-2xs">
                <input
                  type="radio"
                  name="formatoFinal"
                  value="unificado"
                  checked={formato === 'unificado'}
                  onChange={() => onFormatoChange('unificado')}
                  className="text-emerald-700 focus:ring-emerald-600 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-700">✓</span>
                  <span>PDF UNIFICADO</span>
                  <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.2 rounded font-normal ml-1">
                    Recomendado
                  </span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700 hover:text-gray-900 p-2 rounded hover:bg-white/60 transition">
                <input
                  type="radio"
                  name="formatoFinal"
                  value="separados"
                  checked={formato === 'separados'}
                  onChange={() => onFormatoChange('separados')}
                  className="text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>PDFs Separados (Descarga ZIP)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ACCIONES DEL LEGAJO */}
      <div className="space-y-2.5">
        {/* Big Green Generation Button */}
        <button
          type="button"
          onClick={onGenerarLegajo}
          disabled={isGenerating}
          className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-sm sm:text-base rounded-md shadow-md hover:shadow-lg transition flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer border border-emerald-800"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Generando Documentos y Ensamblando Legajo...</span>
            </>
          ) : (
            <>
              <FileCheck2 className="w-5 h-5" />
              <span>Generar Legajo Completo ({formato === 'unificado' ? 'PDF UNIFICADO' : 'Archivos Separados'})</span>
            </>
          )}
        </button>

        {/* Secondary Row of Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
          {/* Orange: Guardar en / Previsualizar */}
          <button
            type="button"
            onClick={onPrevisualizar}
            className="sm:col-span-5 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Eye className="w-4 h-4" />
            <span>Previsualizar / Descargar Legajo</span>
          </button>

          {/* Gray: Adjuntar Informe */}
          <button
            type="button"
            onClick={onAbrirAdjuntoInforme}
            className="sm:col-span-3.5 py-2.5 px-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Paperclip className="w-4 h-4" />
            <span>
              Adjuntar Informe {informesCount > 0 ? `(${informesCount})` : '(Opcional)'}
            </span>
          </button>

          {/* Cyan/Blue: Adjuntar DNI / Carnet */}
          <button
            type="button"
            onClick={onAbrirAdjuntoDni}
            className="sm:col-span-3.5 py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Paperclip className="w-4 h-4" />
            <span>
              Adjuntar DNI / Carnet {dniCarnetCount > 0 ? `(${dniCarnetCount})` : ''}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
