import React from 'react';
import { School, Users, HelpCircle, Layers, FileSpreadsheet, MonitorDown, Sparkles, Lock, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  onOpenExplainer: () => void;
  onOpenFormularios: () => void;
  onOpenAlumnos: () => void;
  onOpenEscuela: () => void;
  onOpenExcelManager: () => void;
  onOpenInstallApp: () => void;
  alumnosCount: number;
  userRole: UserRole;
  onToggleRole: () => void;
  onOpenPinModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenExplainer,
  onOpenFormularios,
  onOpenAlumnos,
  onOpenEscuela,
  onOpenExcelManager,
  onOpenInstallApp,
  alumnosCount,
  userRole,
  onToggleRole,
  onOpenPinModal,
}) => {
  return (
    <header className="bg-emerald-800 text-white select-none shadow-md">
      {/* Window title bar style (like the user's desktop application) */}
      <div className="bg-emerald-950/80 px-4 py-1.5 flex items-center justify-between text-xs text-emerald-200 border-b border-emerald-700/50">
        <div className="flex items-center gap-2 font-medium">
          <span className="text-base">🌱</span>
          <span>Sistema de Gestión de Legajos - Escuela Especial</span>
          <span className="text-[10px] bg-emerald-700 text-emerald-100 px-2 py-0.5 rounded-full font-sans">
            v3.7 • Escuela Especial
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Indicador y Selector de Perfil */}
          {userRole === 'admin' ? (
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded text-[10.5px] flex items-center gap-1 shadow-2xs">
                <span>👑 Modo Administradora (Diseñador Activo)</span>
              </span>
              <button
                type="button"
                onClick={onToggleRole}
                className="text-[10px] text-emerald-300 hover:text-white underline font-medium"
                title="Cambiar a Modo Operador para probar la vista simplificada de tus compañeros"
              >
                Cambiar a Modo Operador
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="bg-blue-600/90 text-white font-semibold px-2 py-0.5 rounded text-[10.5px] flex items-center gap-1">
                <span>👤 Modo Operador (Solo Emisión de Presupuestos)</span>
              </span>
              <button
                type="button"
                onClick={onOpenPinModal}
                className="text-[10px] bg-emerald-800 hover:bg-emerald-700 text-emerald-100 px-2 py-0.5 rounded font-bold border border-emerald-600 flex items-center gap-1 transition"
                title="Desbloquear Diseñador de Formularios y Configuración Institucional con PIN"
              >
                <Lock className="w-3 h-3 text-amber-300" />
                <span>Acceso Administradora</span>
              </button>
            </div>
          )}

          <span className="text-[11px] text-emerald-300 hidden md:inline">
            {new Date().toLocaleDateString('es-AR', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-emerald-800 via-emerald-800 to-teal-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Sistema de Generación de Legajos y Presupuestos</span>
          </h1>
          <p className="text-xs text-emerald-200 mt-0.5">
            {userRole === 'admin'
              ? 'Escuela Especial • Integración Escolar • Emisión automática y Diseñador de Formularios'
              : 'Escuela Especial • Emisión automática de presupuestos y legajos oficiales'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Subir y Probar Formularios JUNTOS / Obras Sociales (SOLO ADMINISTRADOR) */}
          {userRole === 'admin' && (
            <button
              onClick={onOpenFormularios}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition shadow-sm border border-blue-400/40"
              title="Diseñador de plantillas JUNTOS y Obras Sociales para mover casilleros y probar el relleno"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Formularios JUNTOS & O. Sociales</span>
            </button>
          )}

          {/* Botón Excel destacado */}
          <button
            onClick={onOpenExcelManager}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition shadow-sm border border-emerald-400/50"
            title="Exportar todos los presupuestos a Excel, alumnos o resoluciones"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-yellow-200" />
            <span>Base Excel (Presupuestos)</span>
          </button>

          <button
            onClick={onOpenAlumnos}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-medium transition shadow-sm border border-emerald-500/40"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Directorio Alumnos ({alumnosCount})</span>
          </button>

          {/* Escuela y Firmas (SOLO ADMINISTRADOR) */}
          {userRole === 'admin' && (
            <button
              onClick={onOpenEscuela}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded font-medium transition shadow-sm border border-emerald-700"
              title="Configurar datos institucionales, CUIT, directores y firmas digitales"
            >
              <School className="w-3.5 h-3.5 text-emerald-300" />
              <span>Escuela y Firmas</span>
            </button>
          )}

          {/* Web vs App info button */}
          <button
            onClick={onOpenInstallApp}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium transition shadow-sm"
            title="Guía completa: Cómo acceder desde la Web, instalar en la PC y paso a paso para descargar los legajos en PDF"
          >
            <MonitorDown className="w-3.5 h-3.5" />
            <span>Acceso Web & Descargas</span>
          </button>
        </div>
      </div>
    </header>
  );
};
