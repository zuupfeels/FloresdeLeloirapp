import React, { useState } from 'react';
import { AlumnoData } from '../types';
import { exportarAlumnosAExcel } from '../utils/excelUtils';
import { X, Search, UserCheck, Trash2, Users, FileSpreadsheet, Download, Upload } from 'lucide-react';

interface AlumnosModalProps {
  isOpen: boolean;
  onClose: () => void;
  alumnos: AlumnoData[];
  onSelectAlumno: (alumno: AlumnoData) => void;
  onDeleteAlumno: (id: string) => void;
  onOpenExcelManager: () => void;
}

export const AlumnosModal: React.FC<AlumnosModalProps> = ({
  isOpen,
  onClose,
  alumnos,
  onSelectAlumno,
  onDeleteAlumno,
  onOpenExcelManager,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = alumnos.filter((a) => {
    const q = searchTerm.toLowerCase();
    return (
      a.apellidoNombre.toLowerCase().includes(q) ||
      a.dni.toLowerCase().includes(q) ||
      a.numAfiliado.toLowerCase().includes(q) ||
      a.escuelaComun.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-300">
        {/* Header */}
        <div className="bg-emerald-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-300" />
            <div>
              <h2 className="text-sm font-bold">Directorio de Alumnos de la Escuela ({alumnos.length})</h2>
              <p className="text-[11px] text-emerald-200">
                Seleccioná un alumno para autocompletar instantáneamente o exportá todo a Excel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportarAlumnosAExcel(alumnos)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold shadow-xs transition"
              title="Descargar base de alumnos en planilla Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar a Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenExcelManager();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-xs transition"
              title="Subir archivo Excel con alumnos"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir Excel</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 text-emerald-300 hover:text-white hover:bg-emerald-800 rounded transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Nombre, DNI, Afiliado o Escuela Común..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-500 bg-white"
            />
          </div>

          <div className="text-xs text-gray-500 font-medium">
            {filtered.length} de {alumnos.length} alumnos
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs">
              No se encontraron alumnos con ese criterio de búsqueda.
            </div>
          ) : (
            filtered.map((al) => (
              <div
                key={al.id || al.dni}
                className="p-3 bg-white border border-gray-200 hover:border-emerald-500 rounded-lg shadow-2xs hover:shadow-xs transition flex items-center justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-xs truncate">
                      {al.apellidoNombre}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                      DNI: {al.dni}
                    </span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {al.edad} años
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-600 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <span>
                      <strong>Titular:</strong> {al.nombreTitular} ({al.parentesco})
                    </span>
                    <span>•</span>
                    <span>
                      <strong>Afiliado:</strong> {al.numAfiliado}
                    </span>
                    <span>•</span>
                    <span className="truncate">
                      <strong>Escuela:</strong> {al.escuelaComun} ({al.grado})
                    </span>
                  </div>

                  <div className="text-[10px] text-emerald-700 italic truncate">
                    {al.diagnostico}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      onSelectAlumno(al);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-medium transition"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Cargar en Formulario</span>
                  </button>

                  {al.id && (
                    <button
                      onClick={() => onDeleteAlumno(al.id!)}
                      title="Eliminar del directorio escolar"
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>Total en base escolar: {alumnos.length} alumnos registrados</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportarAlumnosAExcel(alumnos)}
              className="text-emerald-700 hover:text-emerald-900 font-semibold underline text-xs"
            >
              Descargar Planilla Completa (.xlsx)
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium ml-2"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
