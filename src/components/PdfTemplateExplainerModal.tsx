import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Layers, FileText, ArrowRight, Sparkles, Download } from 'lucide-react';
import { PLANTILLAS_PREDEFINIDAS, rellenarPdfExistente } from '../utils/pdfStamper';
import { AlumnoData, ConfiguracionLegajo } from '../types';
import { numeroALetras, formatearMoneda } from '../utils/numberToWords';

interface PdfTemplateExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  alumno: AlumnoData;
  config: ConfiguracionLegajo;
}

export const PdfTemplateExplainerModal: React.FC<PdfTemplateExplainerModalProps> = ({
  isOpen,
  onClose,
  alumno,
  config,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(PLANTILLAS_PREDEFINIDAS[0]);
  const [stampedPdfUrl, setStampedPdfUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-emerald-700/30 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-800 rounded-lg text-yellow-300">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold">
                ¿Se puede rellenar directamente desde PDF sin pasar a Word?
              </h2>
              <p className="text-xs text-emerald-200">
                Respuesta técnica oficial: Sí, con fidelidad visual 100% y sin alterar el formato original
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Big Clarification Box */}
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-emerald-900 text-sm">
                ¡SÍ, ROTUNDAMENTE SÍ! No necesitás convertir los PDFs a Word ni etiquetarlos manualmente.
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Convertir formularios de Obras Sociales a Word suele deformar las tablas, mover los membretes, romper los casilleros y desalinear los textos. 
                Esta aplicación trabaja <strong>directamente sobre el formato PDF</strong> mediante dos tecnologías profesionales integradas:
              </p>
            </div>
          </div>

          {/* Comparativa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-red-50/70 border border-red-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-red-800 font-bold text-xs uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>El problema de convertir a Word:</span>
              </div>
              <ul className="text-xs text-red-700 space-y-1.5 list-disc pl-4">
                <li>Se pierden los membretes vectoriales y tipografías exactas.</li>
                <li>Hay que poner manualmente etiquetas como {'{APELLIDO_ALUMNO}'} en cada celda.</li>
                <li>Las tablas se ensanchan y se pasa de 1 hoja a 2 hojas arruinando el formulario.</li>
                <li>Al volver a guardar a PDF, la Obra Social puede rechazarlo por alteración de plantilla.</li>
              </ul>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Cómo lo hace esta aplicación:</span>
              </div>
              <ul className="text-xs text-emerald-800 space-y-1.5 list-disc pl-4">
                <li><strong>Estampado Directo (PDF Overlay):</strong> Superpone los datos (Nombre, DNI, Diagnóstico, Aranceles) exactamente en las coordenadas (X, Y) de las casillas del PDF original.</li>
                <li><strong>Formularios Interactivos (AcroForms):</strong> Rellena directamente los campos oficiales si el PDF original los contiene.</li>
                <li><strong>Unificación Automática:</strong> Concatena todos los formularios + informes + DNI en un solo <strong>PDF UNIFICADO</strong> listo para enviar.</li>
              </ul>
            </div>
          </div>

          {/* Flujo de 3 Pasos */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>Flujo de Trabajo Automatizado del Sistema</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="w-5 h-5 bg-emerald-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] mb-2">1</span>
                <p className="font-bold text-gray-800">Cargás los datos 1 sola vez</p>
                <p className="text-gray-600 text-[11px] mt-1">
                  Escribís o buscás al alumno por DNI. El sistema tiene listo el cronograma, la escuela inclusora, el titular y los aranceles.
                </p>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="w-5 h-5 bg-emerald-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] mb-2">2</span>
                <p className="font-bold text-gray-800">Búsqueda y Mapeo Automático</p>
                <p className="text-gray-600 text-[11px] mt-1">
                  Al elegir la Obra Social (ASE, OSDE, IOMA, etc.) y la Prestación, el sistema selecciona automáticamente todos los formularios requeridos.
                </p>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="w-5 h-5 bg-emerald-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] mb-2">3</span>
                <p className="font-bold text-gray-800">Generación y PDF Unificado</p>
                <p className="text-gray-600 text-[11px] mt-1">
                  Con 1 clic se emiten la Ficha, Presupuesto oficial con resolución y montos en letras, Consentimiento, Plan de Trabajo, CAR y Asistencia, unificados en un solo archivo.
                </p>
              </div>
            </div>
          </div>

          {/* Plantillas Preconfiguradas para probar */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-800 text-xs">
                  Plantillas de Obras Sociales integradas en el sistema:
                </h4>
                <p className="text-[11px] text-gray-500">
                  Podés utilizarlas inmediatamente o solicitar que incorporemos cualquier nuevo formulario oficial
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {PLANTILLAS_PREDEFINIDAS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedTemplate(p)}
                  className={`p-2.5 rounded border cursor-pointer transition ${
                    selectedTemplate.id === p.id
                      ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-400'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-gray-800">{p.nombre}</div>
                  <div className="text-[11px] text-gray-500">{p.descripcion}</div>
                  <div className="text-[10px] text-emerald-700 font-medium mt-1">
                    ✓ {p.campos.length} campos mapeados directamente sobre PDF
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-200 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Los PDFs se procesan 100% de forma local en tu computadora, garantizando la privacidad de los menores.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-md shadow-sm transition"
          >
            Entendido, volver a la aplicación
          </button>
        </div>
      </div>
    </div>
  );
};
