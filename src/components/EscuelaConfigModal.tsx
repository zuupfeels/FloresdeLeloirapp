import React, { useState } from 'react';
import { EscuelaConfig } from '../types';
import { X, School, Save, Check, FileCheck, Stamp } from 'lucide-react';

interface EscuelaConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EscuelaConfig;
  onSave: (saved: EscuelaConfig) => void;
}

export const EscuelaConfigModal: React.FC<EscuelaConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [formData, setFormData] = useState<EscuelaConfig>({ ...config });
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-300">
        {/* Header */}
        <div className="bg-emerald-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-emerald-300" />
            <div>
              <h2 className="text-sm font-bold">Datos Institucionales de la Escuela y Firmas</h2>
              <p className="text-[11px] text-emerald-200">
                Membrete oficial, CUIT, registro ministerial y datos de la Dirección
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="md:col-span-2">
              <label className="block font-semibold text-gray-700 mb-1">
                Nombre de la Escuela Especial / Centro Prestador:
              </label>
              <input
                type="text"
                value={formData.nombreInstitucion}
                onChange={(e) => setFormData({ ...formData, nombreInstitucion: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-gray-700 mb-1">
                Razón Social Titular / Entidad Propietaria:
              </label>
              <input
                type="text"
                value={formData.razonSocial || ''}
                onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                placeholder="FLORES DE LELOIR S.A."
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                N° de Institución / DIEGEP:
              </label>
              <input
                type="text"
                value={formData.numeroInstitucion}
                onChange={(e) => setFormData({ ...formData, numeroInstitucion: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                CUIT Institucional:
              </label>
              <input
                type="text"
                value={formData.cuit}
                onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                placeholder="30-71458921-9"
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Dirección:</label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Localidad y Provincia:
              </label>
              <input
                type="text"
                value={formData.localidad}
                onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Teléfono:</label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Email Oficial:</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-gray-700 mb-1">
                Resolución Habilitación / Registro SNR Discapacidad:
              </label>
              <input
                type="text"
                value={formData.resolucionHabilitacion}
                onChange={(e) => setFormData({ ...formData, resolucionHabilitacion: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Nombre y Apellido de la Directora:
              </label>
              <input
                type="text"
                value={formData.nombreDirectora}
                onChange={(e) => setFormData({ ...formData, nombreDirectora: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Cargo y Matrícula Profesional:
              </label>
              <input
                type="text"
                value={formData.cargoDirectora}
                onChange={(e) => setFormData({ ...formData, cargoDirectora: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-emerald-800">
            <Stamp className="w-5 h-5 text-emerald-700 shrink-0" />
            <p className="text-[11px]">
              Estos datos se imprimen automáticamente en el membrete superior y pie de firma de cada hoja de los presupuestos, actas y legajos generados.
            </p>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium shadow-sm transition"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Datos Guardados!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Configuración</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
