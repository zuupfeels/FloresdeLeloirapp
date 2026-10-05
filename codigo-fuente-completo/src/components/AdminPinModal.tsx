import React, { useState } from 'react';
import { X, Lock, Key, Check, AlertCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentPin: string;
  onUpdatePin: (newPin: string) => void;
  isAdmin: boolean;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentPin,
  onUpdatePin,
  isAdmin,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput.trim() === currentPin.trim()) {
      setError(false);
      setPinInput('');
      onSuccess();
      onClose();
    } else {
      setError(true);
    }
  };

  const handleSaveNewPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newPinInput.trim().length >= 4) {
      onUpdatePin(newPinInput.trim());
      setPinChangeSuccess(true);
      setTimeout(() => {
        setPinChangeSuccess(false);
        setIsChangingPin(false);
        setNewPinInput('');
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-300">
        {/* Header */}
        <div className="bg-emerald-950 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-800 rounded-lg text-emerald-300">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {isAdmin ? 'Gestión de Acceso Administrador' : 'Acceso a Modo Administrador'}
              </h3>
              <p className="text-[10.5px] text-emerald-300">
                {isAdmin ? 'Configuración de seguridad' : 'Diseñador de PDFs y Configuración'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-400 hover:text-white p-1 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {!isAdmin ? (
            <form onSubmit={handleVerify} className="space-y-3.5">
              <p className="text-gray-600 text-[11px] leading-relaxed">
                Ingresá la clave de Administradora para desbloquear el <strong>Diseñador de Formularios</strong>, ajuste de coordenadas y firmas institucionales:
              </p>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  PIN o Clave de Acceso:
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    autoFocus
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setError(false);
                    }}
                    placeholder="Clave (ej. 1234)"
                    className={`w-full px-3 py-2 pr-10 border rounded text-sm font-mono tracking-wider ${
                      error
                        ? 'border-red-500 bg-red-50 focus:ring-red-400'
                        : 'border-gray-300 bg-white focus:ring-emerald-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && (
                  <p className="text-red-600 text-[11px] font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Clave incorrecta. Clave por defecto inicial: 1234</span>
                  </p>
                )}
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-[10.5px] text-emerald-900">
                💡 <strong>Clave por defecto:</strong> Si es la primera vez que ingresás, la clave inicial es <strong>1234</strong>.
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!pinInput.trim()}
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white rounded font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Habilitar Modo Administrador</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3.5">
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-[11px] text-emerald-950 space-y-1">
                <div className="font-bold flex items-center gap-1 text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Modo Administradora Activo</span>
                </div>
                <p className="text-emerald-800">
                  Tenés acceso completo a todas las funciones: Diseñador de Formularios JUNTOS, coordenadas de etiquetas y Firmas Institucionales.
                </p>
              </div>

              {!isChangingPin ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(true)}
                    className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-semibold text-xs border border-gray-300 transition text-center"
                  >
                    🔑 Cambiar PIN de Administradora (Actual: {currentPin})
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveNewPin} className="space-y-2.5 bg-gray-50 p-3 rounded border border-gray-200">
                  <label className="block font-bold text-gray-700 text-[11px]">
                    Nuevo PIN de acceso (mínimo 4 caracteres):
                  </label>
                  <input
                    type="text"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="Ej. 2027 o 9876"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs font-mono"
                  />
                  {pinChangeSuccess && (
                    <p className="text-emerald-700 text-[11px] font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>¡PIN actualizado exitosamente!</span>
                    </p>
                  )}
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsChangingPin(false)}
                      className="px-2.5 py-1 text-gray-600 text-[11px]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={newPinInput.trim().length < 4}
                      className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-[11px] font-bold disabled:opacity-50"
                    >
                      Guardar Nuevo PIN
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
