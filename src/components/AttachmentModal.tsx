import React, { useState } from 'react';
import { AdjuntoDoc } from '../types';
import { X, Paperclip, Upload, Trash2, FileText, CheckCircle2 } from 'lucide-react';

interface AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'informe' | 'dni_carnet';
  adjuntos: AdjuntoDoc[];
  onAddAdjunto: (nuevo: AdjuntoDoc) => void;
  onDeleteAdjunto: (id: string) => void;
}

export const AttachmentModal: React.FC<AttachmentModalProps> = ({
  isOpen,
  onClose,
  tipo,
  adjuntos,
  onAddAdjunto,
  onDeleteAdjunto,
}) => {
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>('');

  if (!isOpen) return null;

  const filtered = adjuntos.filter((a) =>
    tipo === 'informe'
      ? a.tipo === 'informe'
      : a.tipo === 'dni_carnet' || a.tipo === 'cud'
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNombreArchivo(file.name);
    setFileType(file.type);

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGuardarAdjunto = () => {
    if (!fileBase64 || !nombreArchivo) return;

    onAddAdjunto({
      id: 'adj-' + Date.now(),
      nombre: nombreArchivo,
      tipo: tipo === 'informe' ? 'informe' : 'dni_carnet',
      fileDataUrl: fileBase64,
      fileType,
    });

    setNombreArchivo('');
    setFileBase64(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-300">
        {/* Header */}
        <div className="bg-emerald-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-emerald-300" />
            <div>
              <h2 className="text-sm font-bold">
                {tipo === 'informe'
                  ? 'Adjuntar Informe Pedagógico / Médico (Opcional)'
                  : 'Adjuntar DNI, Carnet de Afiliado o CUD'}
              </h2>
              <p className="text-[11px] text-emerald-200">
                Los archivos PDF o imágenes se fusionan automáticamente al final del PDF UNIFICADO
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

        {/* Content */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto">
          {/* Upload Zone */}
          <div className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-lg p-5 text-center bg-gray-50 transition">
            <input
              type="file"
              id="file-upload-input"
              accept=".pdf,image/png,image/jpeg"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="file-upload-input"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="w-7 h-7 text-emerald-700" />
              <span className="font-semibold text-gray-800">
                Hacé clic aquí para seleccionar el archivo (PDF, JPG, PNG)
              </span>
              <span className="text-[11px] text-gray-500">
                {tipo === 'informe'
                  ? 'Informe de evolución, proyecto de cátedra o resumen interdisciplinario'
                  : 'Frente y dorso de DNI del alumno, CUD o carnet de la obra social'}
              </span>
            </label>

            {nombreArchivo && (
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                <span className="font-medium text-emerald-800 truncate">{nombreArchivo}</span>
                <button
                  type="button"
                  onClick={handleGuardarAdjunto}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium shadow-xs"
                >
                  Confirmar y Adjuntar
                </button>
              </div>
            )}
          </div>

          {/* List of currently attached files */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wide">
              Documentos adjuntos a este legajo ({filtered.length}):
            </h4>

            {filtered.length === 0 ? (
              <p className="text-gray-400 italic text-[11px] py-2">
                No hay archivos adjuntos en esta categoría todavía.
              </p>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="font-medium text-gray-800 truncate">{item.nombre}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteAdjunto(item.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                    title="Eliminar adjunto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
