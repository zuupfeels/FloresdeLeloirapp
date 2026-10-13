import React, { useState } from 'react';
import { ConfiguracionLegajo, CronogramaSemanal } from '../types';
import {
  getObrasSociales,
  agregarObraSocial,
  PRESTACIONES_ESCUELA_ESPECIAL,
} from '../utils/storage';
import { numeroALetras, formatearMoneda } from '../utils/numberToWords';
import {
  Settings,
  DollarSign,
  Clock,
  Copy,
  Plus,
  Check,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';

interface ConfiguracionFormProps {
  config: ConfiguracionLegajo;
  cronograma: CronogramaSemanal;
  resolucionesNombres: string[];
  onConfigChange: (updated: Partial<ConfiguracionLegajo>) => void;
  onCronogramaChange: (updated: CronogramaSemanal) => void;
  onOpenExcelResoluciones: () => void;
}

export const ConfiguracionForm: React.FC<ConfiguracionFormProps> = ({
  config,
  cronograma,
  resolucionesNombres,
  onConfigChange,
  onCronogramaChange,
  onOpenExcelResoluciones,
}) => {
  const [obrasSociales, setObrasSociales] = useState<string[]>(getObrasSociales());
  const [showNuevaOsInput, setShowNuevaOsInput] = useState(false);
  const [nuevaOsNombre, setNuevaOsNombre] = useState('');

  const MESES = [
    'ENERO',
    'FEBRERO',
    'MARZO',
    'ABRIL',
    'MAYO',
    'JUNIO',
    'JULIO',
    'AGOSTO',
    'SEPTIEMBRE',
    'OCTUBRE',
    'NOVIEMBRE',
    'DICIEMBRE',
  ];

  const handleCopiarLunes = () => {
    const lunes = cronograma.lunes;
    onCronogramaChange({
      lunes: { ...lunes },
      martes: { ...lunes },
      miercoles: { ...lunes },
      jueves: { ...lunes },
      viernes: { ...lunes },
    });
  };

  const handleUpdateDia = (
    dia: keyof CronogramaSemanal,
    campo: 'desde' | 'hasta' | 'activo',
    valor: any
  ) => {
    onCronogramaChange({
      ...cronograma,
      [dia]: {
        ...cronograma[dia],
        [campo]: valor,
      },
    });
  };

  const handleGuardarNuevaOs = () => {
    if (!nuevaOsNombre.trim()) return;
    const updated = agregarObraSocial(nuevaOsNombre);
    setObrasSociales(updated);
    onConfigChange({ obraSocial: nuevaOsNombre.trim().toUpperCase() });
    setNuevaOsNombre('');
    setShowNuevaOsInput(false);
  };

  const letras = numeroALetras(config.matriculaCuota);
  const formateado = formatearMoneda(config.matriculaCuota);

  const isAE = config.modalidad.includes('MODALIDAD AE');
  const isIntegracionConEquipo = config.modalidad.includes('CON EQUIPO');

  return (
    <div className="space-y-4">
      {/* 1. CONFIGURACIÓN Y PERÍODOS */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-3.5">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800 tracking-wide uppercase">
            <Settings className="w-4 h-4 text-emerald-700" />
            <span>Configuración y Períodos</span>
          </div>
          <span className="text-[11px] text-gray-400">Escuela Especial</span>
        </div>

        <div className="space-y-2.5 text-xs">
          {/* Obra Social con botón para anexar */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-3 font-medium text-gray-700 text-right pr-1">
              Obra Social:
            </label>
            <div className="col-span-9 flex items-center gap-1.5">
              <select
                value={config.obraSocial}
                onChange={(e) => onConfigChange({ obraSocial: e.target.value })}
                className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-emerald-500 font-medium"
              >
                {obrasSociales.map((os) => (
                  <option key={os} value={os}>
                    {os}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowNuevaOsInput(!showNuevaOsInput)}
                title="Anexar una nueva Obra Social no listada"
                className="px-2 py-1.5 bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-800 border border-gray-300 rounded flex items-center gap-1 shrink-0 font-medium transition"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-[10px]">Anexar</span>
              </button>
            </div>
          </div>

          {/* Formulario desplegable para anexar nueva Obra Social */}
          {showNuevaOsInput && (
            <div className="p-2.5 bg-emerald-50/70 border border-emerald-300 rounded-md flex items-center gap-2">
              <input
                type="text"
                value={nuevaOsNombre}
                onChange={(e) => setNuevaOsNombre(e.target.value)}
                placeholder="Nombre de la nueva Obra Social / Prepaga..."
                className="flex-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 uppercase"
                autoFocus
              />
              <button
                type="button"
                onClick={handleGuardarNuevaOs}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Guardar</span>
              </button>
              <button
                type="button"
                onClick={() => setShowNuevaOsInput(false)}
                className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded text-xs"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Modalidad / Prestación oficial de Escuela Especial */}
          <div className="grid grid-cols-12 items-start gap-2">
            <label className="col-span-3 font-medium text-gray-700 text-right pr-1 pt-1.5">
              Prestación:
            </label>
            <div className="col-span-9 space-y-1">
              <select
                value={config.modalidad}
                onChange={(e) => onConfigChange({ modalidad: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-emerald-500 font-semibold text-emerald-950"
              >
                {PRESTACIONES_ESCUELA_ESPECIAL.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </select>

              {isAE && (
                <div className="p-1.5 bg-blue-50 border border-blue-200 rounded text-[10.5px] text-blue-900 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Modalidad AE:</strong> se emite bajo el nombre reglamentario de Módulo de Apoyo, adaptando automáticamente el <strong>Plan de Trabajo al Acompañamiento en Aula</strong> y el <strong>Presupuesto</strong> correspondiente.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Nivel (Integración / AE / Escuela) */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-3 font-semibold text-gray-700 text-right pr-1">
              {isAE ? 'Nivel AE:' : isIntegracionConEquipo ? 'Nivel Integración:' : 'Nivel Escolar:'}
            </label>
            <div className="col-span-9">
              <select
                value={config.nivel}
                onChange={(e) => onConfigChange({ nivel: e.target.value as any })}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Inicial">Inicial (Jardín de Infantes)</option>
                <option value="Primaria">Primaria</option>
                <option value="Secundaria">Secundaria</option>
                <option value="Formación Integral">Formación Integral / Laboral (CFI)</option>
              </select>
            </div>
          </div>

          {/* Año / Emisión */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-3 font-medium text-gray-700 text-right pr-1">
              Año / Emisión:
            </label>
            <div className="col-span-9 flex items-center gap-2">
              <input
                type="text"
                value={config.anio}
                onChange={(e) => onConfigChange({ anio: e.target.value })}
                placeholder="2027"
                className="w-20 px-2 py-1.5 border border-gray-300 rounded text-center focus:ring-1 focus:ring-emerald-500 font-semibold"
              />

              <div className="flex items-center gap-1.5 flex-1">
                <label className="text-gray-600 font-medium">Emisión:</label>
                <input
                  type="text"
                  value={
                    config.emisionLugar && config.emisionFecha
                      ? `${config.emisionLugar}, ${config.emisionFecha}`
                      : `${config.emisionLugar}`
                  }
                  onChange={(e) => {
                    const parts = e.target.value.split(',');
                    if (parts.length >= 2) {
                      onConfigChange({
                        emisionLugar: parts[0].trim(),
                        emisionFecha: parts.slice(1).join(',').trim(),
                      });
                    } else {
                      onConfigChange({ emisionLugar: e.target.value });
                    }
                  }}
                  placeholder="Ituzaingó, 30/09/2026"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Período Cobertura: Desde / Hasta */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-3 font-medium text-gray-700 text-right pr-1">
              Período Cobertura:
            </label>
            <div className="col-span-9 flex items-center gap-3">
              <div className="flex items-center gap-1.5 flex-1">
                <span className="text-gray-500 font-medium">Desde:</span>
                <select
                  value={config.periodoDesde}
                  onChange={(e) => onConfigChange({ periodoDesde: e.target.value })}
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-emerald-500"
                >
                  {MESES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 flex-1">
                <span className="text-gray-500 font-medium">Hasta:</span>
                <select
                  value={config.periodoHasta}
                  onChange={(e) => onConfigChange({ periodoHasta: e.target.value })}
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-emerald-500"
                >
                  {MESES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ARANCELES Y RESOLUCIÓN */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-3.5">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800 tracking-wide uppercase">
            <DollarSign className="w-4 h-4 text-emerald-700" />
            <span>Aranceles y Resolución</span>
          </div>

          <button
            type="button"
            onClick={onOpenExcelResoluciones}
            className="text-[11px] text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1 hover:underline"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Subir Excel Resoluciones</span>
          </button>
        </div>

        <div className="space-y-2.5 text-xs">
          {/* Matrícula / Cuota */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-3 font-medium text-gray-700 text-right pr-1">
              Matrícula/Cuota:
            </label>
            <div className="col-span-9">
              <input
                type="number"
                step="0.01"
                value={config.matriculaCuota}
                onChange={(e) =>
                  onConfigChange({ matriculaCuota: parseFloat(e.target.value) || 0 })
                }
                placeholder="770043.58"
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 font-bold text-gray-800 text-sm"
              />
            </div>
          </div>

          {/* Resolución / Mes */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-3 font-medium text-gray-700 text-right pr-1">
              Resolución/Mes:
            </label>
            <div className="col-span-9">
              <select
                value={config.resolucionMes}
                onChange={(e) => onConfigChange({ resolucionMes: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-emerald-500"
              >
                {resolucionesNombres.map((res) => (
                  <option key={res} value={res}>
                    {res}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* En letras automático */}
          <div className="pt-1 text-center">
            <div className="text-[11px] font-semibold italic text-blue-900 bg-blue-50/70 p-2 rounded border border-blue-200">
              {formateado} -&gt; ({letras})
            </div>
          </div>
        </div>
      </div>

      {/* 3. CRONOGRAMA SEMANAL DE HORARIOS */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-3.5">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800 tracking-wide uppercase">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>Cronograma Semanal de Horarios</span>
          </div>

          <button
            type="button"
            onClick={handleCopiarLunes}
            className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-800 border border-gray-300 rounded text-[11px] font-medium transition"
            title="Copia el horario del Lunes a Martes, Miércoles, Jueves y Viernes"
          >
            <Copy className="w-3 h-3 text-emerald-700" />
            <span>Copiar Lunes al resto</span>
          </button>
        </div>

        <div className="space-y-1.5 text-xs py-1">
          {(
            [
              ['lunes', 'LUNES'],
              ['martes', 'MARTES'],
              ['miercoles', 'MIERCOLES'],
              ['jueves', 'JUEVES'],
              ['viernes', 'VIERNES'],
            ] as const
          ).map(([diaKey, diaLabel]) => {
            const h = cronograma[diaKey];
            return (
              <div key={diaKey} className="grid grid-cols-12 items-center gap-2 py-0.5">
                <div className="col-span-3 flex items-center justify-end gap-1.5">
                  <input
                    type="checkbox"
                    checked={h.activo}
                    onChange={(e) => handleUpdateDia(diaKey, 'activo', e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span
                    className={`font-semibold ${
                      h.activo ? 'text-gray-800' : 'text-gray-400 line-through'
                    }`}
                  >
                    {diaLabel}:
                  </span>
                </div>

                <div className="col-span-9 flex items-center gap-2">
                  <input
                    type="time"
                    value={h.desde}
                    disabled={!h.activo}
                    onChange={(e) => handleUpdateDia(diaKey, 'desde', e.target.value)}
                    className={`w-28 px-2 py-1 border rounded text-center focus:ring-1 focus:ring-emerald-500 ${
                      h.activo ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-100 text-gray-400'
                    }`}
                  />
                  <span className="text-gray-500 text-xs">a</span>
                  <input
                    type="time"
                    value={h.hasta}
                    disabled={!h.activo}
                    onChange={(e) => handleUpdateDia(diaKey, 'hasta', e.target.value)}
                    className={`w-28 px-2 py-1 border rounded text-center focus:ring-1 focus:ring-emerald-500 ${
                      h.activo ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-100 text-gray-400'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Checkbox: Incluir Firma Digital Automática */}
        <div className="pt-2.5 mt-2 border-t border-gray-200 flex items-center gap-2 text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-800">
            <input
              type="checkbox"
              checked={config.incluirFirmaDigital}
              onChange={(e) => onConfigChange({ incluirFirmaDigital: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1.5">
              <span>🖋️</span>
              <span>Incluir Firma Digital Automática (excepto CAR)</span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
