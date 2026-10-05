import React, { useState } from 'react';
import { AlumnoData } from '../types';
import { User, Users, Search, Trash2, Save, Sparkles, Check } from 'lucide-react';

interface AlumnoFormProps {
  alumno: AlumnoData;
  onChange: (updated: Partial<AlumnoData>) => void;
  onClear: () => void;
  onSaveToDirectory: () => void;
  onSearchDni: () => void;
  onOpenExcel: () => void;
  savedNotification: boolean;
}

export const AlumnoForm: React.FC<AlumnoFormProps> = ({
  alumno,
  onChange,
  onClear,
  onSaveToDirectory,
  onSearchDni,
  onOpenExcel,
  savedNotification,
}) => {
  const [showDiagnosticos, setShowDiagnosticos] = useState(false);

  // Helper to calculate age from birthdate
  const handleFechaNacimientoChange = (fecha: string) => {
    let edad = alumno.edad;
    if (fecha) {
      const birth = new Date(fecha);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      if (!isNaN(age) && age >= 0 && age < 100) {
        edad = age;
      }
    }
    onChange({ fechaNacimiento: fecha, edad });
  };

  const DIAGNOSTICOS_FRECUENTES = [
    'Trastorno del Espectro Autista (F84.0) - CUD Vigente',
    'Retraso Global del Desarrollo (F88)',
    'Trastorno Específico del Lenguaje (TEL) Mixto',
    'Trastorno por Déficit de Atención con Hiperactividad (F90.0)',
    'Parálisis Cerebral Infantil (PCI) / Discapacidad Motora',
    'Síndrome de Down (Trisomía 21) - CUD Vigente',
    'Discapacidad Intelectual Leve (F70)',
  ];

  return (
    <div className="space-y-4">
      {/* 1. DATOS DEL ALUMNO */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-3.5">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800 tracking-wide uppercase">
            <User className="w-4 h-4 text-emerald-700" />
            <span>Datos del Alumno</span>
          </div>
          <span className="text-[11px] text-gray-400">Beneficiario directo</span>
        </div>

        <div className="space-y-2.5 text-xs">
          {/* Apellido y Nombre */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-3 font-medium text-gray-700 text-right pr-1">
              Apellido y Nombre:
            </label>
            <div className="col-span-9">
              <input
                type="text"
                value={alumno.apellidoNombre}
                onChange={(e) => onChange({ apellidoNombre: e.target.value })}
                placeholder="Ej. GÓMEZ PÉREZ, Joaquín Valentín"
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 bg-white"
              />
            </div>
          </div>

          {/* DNI y Edad */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-3 font-medium text-gray-700 text-right pr-1">
              DNI y Edad:
            </label>
            <div className="col-span-9 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={alumno.dni}
                  onChange={(e) => onChange({ dni: e.target.value })}
                  placeholder="DNI Alumno (ej. 48.912.455)"
                  className="w-full px-2.5 py-1.5 pr-8 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={onSearchDni}
                  title="Buscar en base de datos escolar por DNI"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 w-28">
                <label className="text-gray-600 font-medium">Edad:</label>
                <input
                  type="number"
                  value={alumno.edad}
                  onChange={(e) => onChange({ edad: parseInt(e.target.value, 10) || '' })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-center focus:ring-1 focus:ring-emerald-500"
                  min="1"
                  max="99"
                />
              </div>
            </div>
          </div>

          {/* Fecha Nacimiento */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-3 font-medium text-gray-700 text-right pr-1">
              Fecha Nacimiento:
            </label>
            <div className="col-span-9">
              <input
                type="date"
                value={alumno.fechaNacimiento}
                onChange={(e) => handleFechaNacimientoChange(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* N° Afiliado / Socio */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-3 font-medium text-gray-700 text-right pr-1">
              N° Afiliado / Socio:
            </label>
            <div className="col-span-9">
              <input
                type="text"
                value={alumno.numAfiliado}
                onChange={(e) => onChange({ numAfiliado: e.target.value })}
                placeholder="Ej. 01-48912455/02 o N° credencial completa"
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Diagnóstico */}
          <div className="grid grid-cols-12 items-start gap-2">
            <label className="col-span-3 font-medium text-gray-700 text-right pr-1 pt-1.5">
              Diagnóstico:
            </label>
            <div className="col-span-9 space-y-1">
              <div className="relative">
                <input
                  type="text"
                  value={alumno.diagnostico}
                  onChange={(e) => onChange({ diagnostico: e.target.value })}
                  placeholder="Ej. Trastorno del Espectro Autista (F84.0) - CUD Vigente"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowDiagnosticos(!showDiagnosticos)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 bg-gray-100 hover:bg-emerald-100 text-gray-600 rounded flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Sugerir</span>
                </button>
              </div>

              {showDiagnosticos && (
                <div className="p-2 bg-gray-50 border border-gray-200 rounded text-[11px] space-y-1">
                  <div className="font-semibold text-gray-500 mb-1">Diagnósticos frecuentes CUD:</div>
                  <div className="flex flex-wrap gap-1">
                    {DIAGNOSTICOS_FRECUENTES.map((diag) => (
                      <button
                        key={diag}
                        type="button"
                        onClick={() => {
                          onChange({ diagnostico: diag });
                          setShowDiagnosticos(false);
                        }}
                        className="text-left px-2 py-1 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded text-gray-700"
                      >
                        {diag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Escuela Común */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-3 font-medium text-gray-700 text-right pr-1">
              Escuela Común:
            </label>
            <div className="col-span-9">
              <input
                type="text"
                value={alumno.escuelaComun}
                onChange={(e) => onChange({ escuelaComun: e.target.value })}
                placeholder="Ej. Colegio Belgrano Day School / EP N° 14"
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Dirección Escuela */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-3 font-medium text-gray-700 text-right pr-1">
              Dirección Escuela:
            </label>
            <div className="col-span-9">
              <input
                type="text"
                value={alumno.direccionEscuela}
                onChange={(e) => onChange({ direccionEscuela: e.target.value })}
                placeholder="Ej. Calle Zufriategui 840, Ituzaingó"
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Grado y Turno */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-3 font-medium text-gray-700 text-right pr-1">
              Grado y Turno:
            </label>
            <div className="col-span-9 flex items-center gap-2">
              <input
                type="text"
                value={alumno.grado}
                onChange={(e) => onChange({ grado: e.target.value })}
                placeholder="Ej. 4° Grado / Sala 5 / 1° Año"
                className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
              />

              <div className="flex items-center gap-1.5">
                <label className="text-gray-600 font-medium">Turno:</label>
                <select
                  value={alumno.turno}
                  onChange={(e) => onChange({ turno: e.target.value as any })}
                  className="px-2 py-1.5 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Jornada Completa">Jornada Completa</option>
                  <option value="Doble Escolaridad">Doble Escolaridad</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DATOS DEL TITULAR */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-3.5">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800 tracking-wide uppercase">
            <Users className="w-4 h-4 text-blue-700" />
            <span>Datos del Titular</span>
          </div>
          <span className="text-[11px] text-gray-400">Padre / Madre / Tutor</span>
        </div>

        <div className="space-y-2.5 text-xs">
          {/* Nombre Titular */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-3 font-medium text-gray-700 text-right pr-1">
              Nombre Titular:
            </label>
            <div className="col-span-9">
              <input
                type="text"
                value={alumno.nombreTitular}
                onChange={(e) => onChange({ nombreTitular: e.target.value })}
                placeholder="Ej. PÉREZ, Marcela Alejandra"
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* DNI Titular & Parentesco */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-3 font-medium text-gray-700 text-right pr-1">
              DNI Titular:
            </label>
            <div className="col-span-9 flex items-center gap-2">
              <input
                type="text"
                value={alumno.dniTitular}
                onChange={(e) => onChange({ dniTitular: e.target.value })}
                placeholder="DNI Titular"
                className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
              />

              <div className="flex items-center gap-1.5">
                <label className="text-gray-600 font-medium">Parentesco:</label>
                <select
                  value={alumno.parentesco}
                  onChange={(e) => onChange({ parentesco: e.target.value as any })}
                  className="px-2 py-1.5 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Madre">Madre</option>
                  <option value="Padre">Padre</option>
                  <option value="Tutor/a Legal">Tutor/a Legal</option>
                  <option value="Abuelo/a">Abuelo/a</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
          </div>

          {/* N° Afiliado Titular */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-3 font-medium text-gray-700 text-right pr-1">
              N° Afiliado Titular:
            </label>
            <div className="col-span-9">
              <input
                type="text"
                value={alumno.numAfiliadoTitular}
                onChange={(e) => onChange({ numAfiliadoTitular: e.target.value })}
                placeholder="Ej. 01-48912455/00"
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Buttons: Limpiar, Excel & Guardar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 border border-gray-300 hover:border-red-300 rounded text-xs transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar Campos</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-xs font-medium transition"
              title="Abrir gestor de Excel para exportar o importar"
            >
              <span>📊</span>
              <span>Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={onSaveToDirectory}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-medium transition shadow-sm ${
                savedNotification
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              {savedNotification ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Alumno</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
