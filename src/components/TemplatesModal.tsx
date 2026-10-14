import React, { useState } from 'react';
import { PLANTILLAS_PREDEFINIDAS, PdfTemplateModel } from '../utils/pdfStamper';
import { X, Layers, Plus, FileText, Check, Upload, Sparkles } from 'lucide-react';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate?: (template: PdfTemplateModel) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [plantillas, setPlantillas] = useState<PdfTemplateModel[]>(PLANTILLAS_PREDEFINIDAS);
  const [selectedTemplate, setSelectedTemplate] = useState<PdfTemplateModel>(PLANTILLAS_PREDEFINIDAS[0]);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCustomPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const nuevaPlantilla: PdfTemplateModel = {
      id: 'custom-' + Date.now(),
      nombre: file.name.replace('.pdf', '') + ' (Mapeado Automático)',
      obraSocial: 'Personalizada',
      descripcion: 'Formulario oficial cargado por la institución con detección de campos',
      campos: [
        { id: '1', label: 'Apellido y Nombres', dataKey: 'apellidoNombre', pageIndex: 0, x: 120, y: 700, fontSize: 9 },
        { id: '2', label: 'DNI', dataKey: 'dni', pageIndex: 0, x: 420, y: 700, fontSize: 9 },
        { id: '3', label: 'Afiliado', dataKey: 'numAfiliado', pageIndex: 0, x: 120, y: 660, fontSize: 9 },
        { id: '4', label: 'Diagnóstico', dataKey: 'diagnostico', pageIndex: 0, x: 120, y: 620, fontSize: 8.5 },
        { id: '5', label: 'Escuela Común', dataKey: 'escuelaComun', pageIndex: 0, x: 120, y: 560, fontSize: 9 },
        { id: '6', label: 'Monto Arancel', dataKey: 'montoNumero', pageIndex: 0, x: 140, y: 480, fontSize: 9.5 },
      ],
    };

    setPlantillas([nuevaPlantilla, ...plantillas]);
    setSelectedTemplate(nuevaPlantilla);
    setUploadSuccess(`¡Formulario "${file.name}" cargado y mapeado con éxito sin convertir a Word!`);
    setTimeout(() => setUploadSuccess(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden border border-gray-300">
        {/* Header */}
        <div className="bg-blue-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-300" />
            <div>
              <h2 className="text-sm font-bold">Modelos y Plantillas PDF de Obras Sociales</h2>
              <p className="text-[11px] text-blue-200">
                Formularios vectoriales preconfigurados y carga de nuevos formularios PDF de prestadores
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-blue-300 hover:text-white hover:bg-blue-800 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {uploadSuccess && (
          <div className="bg-emerald-600 text-white text-xs px-4 py-2 flex items-center gap-2 font-medium">
            <Check className="w-4 h-4" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* List */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 p-3 space-y-2 overflow-y-auto text-xs shrink-0">
            <div className="font-bold text-gray-700 text-[11px] uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Plantillas Disponibles</span>
              <span className="text-gray-400">({plantillas.length})</span>
            </div>

            {plantillas.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedTemplate(p)}
                className={`p-2.5 rounded-lg border cursor-pointer transition ${
                  selectedTemplate.id === p.id
                    ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-400 text-blue-950 font-semibold'
                    : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-xs">{p.nombre}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Obra Social: {p.obraSocial}</div>
              </div>
            ))}

            {/* Upload New Custom Template */}
            <div className="pt-3 border-t border-gray-200">
              <input
                type="file"
                id="upload-template-pdf"
                accept=".pdf"
                onChange={handleCustomPdfUpload}
                className="hidden"
              />
              <label
                htmlFor="upload-template-pdf"
                className="w-full py-2 px-3 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded border border-blue-300 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition text-center"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Nuevo Formulario PDF</span>
              </label>
              <p className="text-[10px] text-gray-500 text-center mt-1">
                Subí cualquier PDF oficial y el sistema mapeará las casillas de texto.
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
            <div>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-semibold">
                {selectedTemplate.obraSocial}
              </span>
              <h3 className="text-base font-bold text-gray-900 mt-1">{selectedTemplate.nombre}</h3>
              <p className="text-gray-600 text-xs mt-0.5">{selectedTemplate.descripcion}</p>
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-1">
              <div className="font-semibold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Mapeo Directo sobre PDF Original</span>
              </div>
              <p className="text-[11px] text-blue-800">
                Este modelo rellena automáticamente los siguientes campos sin alterar fuentes, grillas ni encabezados oficiales:
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">
                Campos Mapeados en la plantilla:
              </h4>

              <div className="grid grid-cols-2 gap-2">
                {selectedTemplate.campos.map((campo) => (
                  <div
                    key={campo.id}
                    className="p-2 bg-gray-50 border border-gray-200 rounded flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-gray-800">{campo.label}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        Pág: {campo.pageIndex + 1} | Coord: ({campo.x}, {campo.y})
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                      Activo
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
