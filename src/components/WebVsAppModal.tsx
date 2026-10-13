import React, { useState } from 'react';
import {
  X,
  Monitor,
  Globe,
  CheckCircle2,
  Star,
  Zap,
  Sparkles,
  Download,
  Copy,
  Check,
  Smartphone,
  Printer,
  FileCheck,
  Bookmark,
  Layers,
  AlertTriangle,
  FolderDown,
  Terminal,
  ExternalLink,
  Users,
  Shield,
  KeyRound,
} from 'lucide-react';

interface WebVsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WebVsAppModal: React.FC<WebVsAppModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'tres_personas' | 'exe' | 'alojar_web' | 'descarga' | 'app_pc'>('tres_personas');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';

  const handleCopyUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCmd(id);
      setTimeout(() => setCopiedCmd(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-300 animate-in fade-in duration-150">
        {/* Header */}
        <div className="bg-emerald-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-800 rounded-lg text-emerald-300">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Crear .EXE de Windows, Alojamiento Web & Descargas</h2>
              <p className="text-[11px] text-emerald-200">
                Solución de acceso, empaquetado para computadoras de la escuela y guía de uso
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

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-gray-200 bg-gray-50 px-4 pt-2 gap-1.5 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('tres_personas')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition shrink-0 ${
              activeTab === 'tres_personas'
                ? 'border-indigo-700 text-indigo-950 font-bold bg-white rounded-t-md shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>👥 1. Versión para 3 Personas (Operador vs Admin)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('exe')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition shrink-0 ${
              activeTab === 'exe'
                ? 'border-purple-700 text-purple-950 font-bold bg-white rounded-t-md shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-purple-600" />
            <span>💻 2. Convertir en .EXE para PC</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alojar_web')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition shrink-0 ${
              activeTab === 'alojar_web'
                ? 'border-blue-700 text-blue-950 font-bold bg-white rounded-t-md shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>🌐 3. Alojar en Web Pública</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('descarga')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition shrink-0 ${
              activeTab === 'descarga'
                ? 'border-emerald-700 text-emerald-900 font-bold bg-white rounded-t-md shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>📥 4. Paso a Paso para Descargar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('app_pc')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition shrink-0 ${
              activeTab === 'app_pc'
                ? 'border-amber-700 text-amber-900 font-bold bg-white rounded-t-md shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-amber-600" />
            <span>⚡ 5. Instalar App en Windows (PWA)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: TRES PERSONAS (OPERADOR VS ADMIN) */}
          {activeTab === 'tres_personas' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-300 rounded-lg">
                <h3 className="font-bold text-indigo-950 text-sm flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-700" />
                  <span>¡SÍ, TOTALMENTE! Ya está implementada la separación de perfiles para los 3 usuarios</span>
                </h3>
                <p className="text-indigo-900 text-[11.5px] mt-1.5 leading-relaxed">
                  Para que tus 2 compañeros tengan una <strong>versión limpia enfocada únicamente en cargar alumnos y generar presupuestos</strong> (sin ver el diseñador de PDFs ni desconfigurar casilleros), mientras vos conservás el control total del diseñador de plantillas y firmas:
                </p>
              </div>

              {/* Comparación de los 2 Modos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. Modo Operador */}
                <div className="p-4 bg-white border-2 border-blue-400 rounded-lg space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      <span>Versión para tus 2 compañeros</span>
                    </span>
                    <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      Modo Operador
                    </span>
                  </div>

                  <div className="space-y-1.5 text-gray-700 text-[11px]">
                    <div className="font-bold text-gray-900">✓ Qué tienen disponible:</div>
                    <ul className="space-y-1 pl-1">
                      <li>• Buscar y seleccionar alumnos en el Directorio o por DNI.</li>
                      <li>• Cargar y guardar nuevos alumnos en la base de datos.</li>
                      <li>• Elegir Obra Social, Prestación (Integración / AE) y Nivel.</li>
                      <li>• Generar y descargar presupuestos oficiales y legajos en PDF.</li>
                      <li>• Ver y exportar el historial de presupuestos a Excel.</li>
                    </ul>

                    <div className="font-bold text-red-700 pt-1">🔒 Lo que está 100% oculto y protegido:</div>
                    <ul className="space-y-0.5 pl-1 text-gray-500 text-[10.5px]">
                      <li>✗ El Diseñador de Formularios JUNTOS no aparece.</li>
                      <li>✗ No pueden mover etiquetas ni cambiar coordenadas.</li>
                      <li>✗ No pueden subir o sobreescribir plantillas PDF.</li>
                      <li>✗ No pueden alterar los datos institucionales ni firmas.</li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-gray-200 space-y-1.5">
                    <label className="font-bold text-blue-950 text-[10.5px] block">
                      Enlace para enviarles a ellos:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={currentUrl ? `${currentUrl.split('?')[0]}?modo=operador` : ''}
                        className="flex-1 px-2 py-1 bg-blue-50/70 border border-blue-200 rounded font-mono text-[10.5px] select-all"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            currentUrl ? `${currentUrl.split('?')[0]}?modo=operador` : '',
                            'link_operador'
                          )
                        }
                        className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded font-medium text-[10.5px] shrink-0 flex items-center gap-1"
                      >
                        {copiedCmd === 'link_operador' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCmd === 'link_operador' ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Modo Administradora */}
                <div className="p-4 bg-white border-2 border-amber-400 rounded-lg space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span>Versión para Vos</span>
                    </span>
                    <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[10px]">
                      Modo Administradora
                    </span>
                  </div>

                  <div className="space-y-1.5 text-gray-700 text-[11px]">
                    <div className="font-bold text-gray-900">👑 Acceso Completo e Ilimitado:</div>
                    <ul className="space-y-1 pl-1">
                      <li>• Todo lo del Modo Operador.</li>
                      <li>• <strong>Botón "Formularios JUNTOS & O. Sociales":</strong> diseñador visual en vivo para ubicar y mover casilleros de texto con arrastrar y soltar.</li>
                      <li>• Subir nuevas plantillas PDF oficiales.</li>
                      <li>• <strong>Botón "Escuela y Firmas":</strong> configurar el CUIT, razón social, directora, habilitaciones y firmas digitales.</li>
                      <li>• Descargar PDFs de prueba inmediatos.</li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-gray-200 space-y-1.5">
                    <label className="font-bold text-amber-950 text-[10.5px] block">
                      Enlace para tu uso personal:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={currentUrl ? `${currentUrl.split('?')[0]}?modo=admin` : ''}
                        className="flex-1 px-2 py-1 bg-amber-50/70 border border-amber-200 rounded font-mono text-[10.5px] select-all"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            currentUrl ? `${currentUrl.split('?')[0]}?modo=admin` : '',
                            'link_admin'
                          )
                        }
                        className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded font-medium text-[10.5px] shrink-0 flex items-center gap-1"
                      >
                        {copiedCmd === 'link_admin' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCmd === 'link_admin' ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desbloqueo por Clave PIN en la barra superior */}
              <div className="p-3.5 bg-gray-50 border border-gray-300 rounded-lg space-y-1.5 text-[11px] text-gray-700">
                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-emerald-700" />
                  <span>¿Cómo pasar de Modo Operador a Administradora en cualquier computadora?</span>
                </span>
                <p className="leading-relaxed">
                  Si estás en la computadora de la escuela y está en Modo Operador, simplemente hacés clic arriba a la derecha en <strong>"🔑 Acceso Administradora"</strong>, ponés tu PIN (por defecto <strong>1234</strong>) y se desbloquea el Diseñador al instante. Cuando termines, hacés clic en <strong>"Cambiar a Modo Operador"</strong> para dejarlo seguro nuevamente.
                </p>
              </div>
            </div>
          )}
          {/* TAB 1: CONVERTIR A .EXE */}
          {activeTab === 'exe' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-purple-50 border border-purple-300 rounded-lg">
                <h3 className="font-bold text-purple-950 text-sm flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-purple-700" />
                  <span>¿Cómo convertir la aplicación en un archivo .EXE para Windows?</span>
                </h3>
                <p className="text-purple-900 text-[11px] mt-1 leading-relaxed">
                  Para tener un instalador o ejecutable <strong>.exe</strong> en Windows que se abra con doble clic y funcione como cualquier programa de la computadora, podés usar cualquiera de estas 2 opciones recomendadas:
                </p>
              </div>

              {/* Opción 1: Generador Automático Nativefier / Pake */}
              <div className="p-4 bg-white border border-gray-300 rounded-lg space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-purple-700 text-white flex items-center justify-center text-[10px]">A</span>
                    <span>Opción A: Generar .EXE portátil en 1 minuto con Nativefier (Recomendado)</span>
                  </h4>
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">Rápido y Automático</span>
                </div>

                <p className="text-gray-600 text-[11px] leading-relaxed">
                  Podés compilar esta aplicación en un ejecutable Windows independiente usando la herramienta oficial <strong>Nativefier</strong> (basada en Chromium / Electron). En tu PC con Node.js instalado, abrís la terminal (cmd o PowerShell) y ejecutás:
                </p>

                <div className="bg-gray-900 text-gray-100 p-2.5 rounded font-mono text-[11px] flex items-center justify-between gap-2 overflow-x-auto">
                  <code>npx nativefier --name "EscuelaEspecial" "{currentUrl}" --tray</code>
                  <button
                    type="button"
                    onClick={() => handleCopyText(`npx nativefier --name "EscuelaEspecial" "${currentUrl}" --tray`, 'cmd1')}
                    className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-sans font-medium shrink-0 flex items-center gap-1"
                  >
                    {copiedCmd === 'cmd1' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === 'cmd1' ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                <p className="text-[10.5px] text-gray-500">
                  ✨ Esto creará en segundos una carpeta llamada <code>EscuelaEspecial-win32-x64</code> que adentro contiene el archivo <strong>EscuelaEspecial.exe</strong> listo para copiar en un pendrive o en el escritorio.
                </p>
              </div>

              {/* Opción 2: Pake (Ultra liviano) */}
              <div className="p-4 bg-white border border-gray-300 rounded-lg space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-[10px]">B</span>
                    <span>Opción B: Generar .EXE ultra liviano con Pake (Tauri / Rust)</span>
                  </h4>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">Pesa menos de 5 MB</span>
                </div>

                <div className="bg-gray-900 text-gray-100 p-2.5 rounded font-mono text-[11px] flex items-center justify-between gap-2 overflow-x-auto">
                  <code>npx @pake/cli "{currentUrl}" --name "EscuelaEspecial"</code>
                  <button
                    type="button"
                    onClick={() => handleCopyText(`npx @pake/cli "${currentUrl}" --name "EscuelaEspecial"`, 'cmd2')}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-sans font-medium shrink-0 flex items-center gap-1"
                  >
                    {copiedCmd === 'cmd2' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === 'cmd2' ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Opción 3: PWA de Windows (La que no requiere instalar nada de programación) */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg space-y-1.5">
                <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                  <Star className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  <span>La forma más fácil de Windows sin programar nada:</span>
                </h4>
                <p className="text-emerald-900 text-[11px] leading-relaxed">
                  Cuando abrís la web en <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong> en tu computadora, hacés clic en el icono de <strong>"Instalar aplicación" 🖥️</strong> ubicado al final de la barra de direcciones. Windows crea automáticamente un archivo ejecutable registrado en Windows, con acceso directo en el escritorio y menú inicio, exactamente igual que un .exe tradicional.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: ALOJAR EN WEB PÚBLICA & ERROR DEL ENLACE */}
          {activeTab === 'alojar_web' && (
            <div className="space-y-4">
              {/* Alerta del motivo del error */}
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold text-amber-950 text-sm">
                    ¿Por qué no pudiste ingresar con el enlace anterior?
                  </h3>
                  <p className="text-amber-900 text-[11px] leading-relaxed">
                    El enlace actual (<code>ais-pre-*.run.app</code>) es un entorno de desarrollo privado de Google Cloud. Por seguridad de Google, <strong>solo permite ingresar si en ese navegador iniciaste sesión con la cuenta de Google autorizada:</strong>
                  </p>
                  <p className="font-mono text-emerald-900 font-bold bg-white px-2 py-0.5 rounded border border-amber-300 inline-block text-[11px]">
                    ArantxaRegnault@gmail.com
                  </p>
                  <p className="text-amber-800 text-[10.5px]">
                    Si lo abriste desde el celular (por WhatsApp), en modo incógnito, o en una PC de la escuela donde hay otra cuenta de Google (o ninguna), Google bloquea el acceso con un error de permisos (403 Forbidden).
                  </p>
                </div>
              </div>

              {/* Cómo tener tu página web pública y libre */}
              <div className="p-4 bg-white border border-gray-300 rounded-lg space-y-3 shadow-2xs">
                <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Cómo alojarlo en una Página Web Pública en 2 minutos (100% Gratis y Libre)</span>
                </h4>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  Para que cualquier persona de la escuela, directivo o docente pueda entrar desde cualquier celular o computadora <strong>sin pedir ninguna cuenta de Google</strong>, podés publicarlo en un servidor web gratuito como <strong>Netlify</strong> o <strong>Vercel</strong>:
                </p>

                <div className="space-y-2 text-[11px] text-gray-700">
                  <div className="flex items-start gap-2 bg-gray-50 p-2.5 rounded border border-gray-200">
                    <span className="w-5 h-5 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                    <div>
                      <strong>Descargar la carpeta compilada (dist):</strong>
                      <p className="text-gray-500 text-[10.5px]">
                        La aplicación ya está configurada con rutas portátiles (<code>base: './'</code>) y se compila con el comando <code>npm run build</code>, generando la carpeta <code>dist</code>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-gray-50 p-2.5 rounded border border-gray-200">
                    <span className="w-5 h-5 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                    <div>
                      <strong>Arrastrar la carpeta en Netlify Drop:</strong>
                      <p className="text-gray-500 text-[10.5px]">
                        Entrás en <a href="https://app.netlify.com/drop" target="_blank" rel="noreferrer" className="text-blue-700 font-bold underline">app.netlify.com/drop</a> y simplemente arrastrás la carpeta <code>dist</code> a la pantalla.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-gray-50 p-2.5 rounded border border-gray-200">
                    <span className="w-5 h-5 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                    <div>
                      <strong>¡Listo! Tenés tu enlace público permanente:</strong>
                      <p className="text-gray-500 text-[10.5px]">
                        Netlify te dará una dirección pública directa (ejemplo: <code>https://escuela-especial-juntos.netlify.app</code>) que funciona siempre, para todos, en cualquier dispositivo y sin pedir contraseñas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Si querés ingresar ahora con este enlace */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg space-y-1 text-[11px] text-blue-950">
                <span className="font-bold flex items-center gap-1">
                  💡 Para ingresar ahora mismo al enlace actual:
                </span>
                <p>
                  Abrí Google Chrome en tu PC, asegurate de tener la sesión iniciada con <strong>ArantxaRegnault@gmail.com</strong>, y pegá esta URL:
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="flex-1 px-2 py-1 bg-white border border-blue-300 rounded font-mono text-[10.5px] select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded font-medium text-[10.5px] shrink-0"
                  >
                    {copiedUrl ? '¡Copiado!' : 'Copiar URL'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PASO A PASO PARA DESCARGAR */}
          {activeTab === 'descarga' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg">
                <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>¿Cómo descargar los legajos y formularios oficiales en PDF?</span>
                </h3>
                <p className="text-emerald-800 text-[11px] mt-1">
                  El sistema genera automáticamente todos los PDFs completados con los datos del alumno, escuela, aranceles y cronogramas, listos para imprimir o enviar por correo a las Obras Sociales.
                </p>
              </div>

              {/* 5 Pasos Clave */}
              <div className="space-y-3">
                <div className="p-3 bg-white border border-gray-200 rounded-lg flex items-start gap-3 shadow-2xs">
                  <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-900">Elegir o cargar al Alumno</h4>
                    <p className="text-gray-600 text-[11px] mt-0.5">
                      En la columna izquierda, seleccioná un alumno del <strong>Directorio</strong>, buscalo por su <strong>DNI</strong> o completá manualmente su nombre, DNI, fecha de nacimiento, diagnóstico y número de afiliado.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white border border-gray-200 rounded-lg flex items-start gap-3 shadow-2xs">
                  <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-900">Configurar Obra Social, Prestación y Nivel</h4>
                    <p className="text-gray-600 text-[11px] mt-0.5">
                      En <strong>"Configuración y Períodos"</strong> elegí la Obra Social (OSDE, IOMA, ASE, etc.), la Prestación (ej. <em>Integración Escolar</em> o <em>Modalidad AE</em>) y el Nivel correspondiente (Inicial, Primaria, Secundaria o CFI). Esto garantiza que se emitan los formularios y aranceles exactos.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white border border-gray-200 rounded-lg flex items-start gap-3 shadow-2xs">
                  <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-900">Tildar los Documentos a Incluir</h4>
                    <p className="text-gray-600 text-[11px] mt-0.5">
                      En <strong>"Documentos a Incluir en el Legajo"</strong>, marcá qué querés emitir: Presupuesto Oficial, Consentimiento, Plan de Trabajo, Constancia Alumno Regular (CAR), Planillas de Asistencia, Formularios Fijos de JUNTOS o Formularios de Obra Social.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white border border-gray-200 rounded-lg flex items-start gap-3 shadow-2xs">
                  <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    4
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-900">Hacer clic en "Generar Legajo Completo (PDF)"</h4>
                    <p className="text-gray-600 text-[11px] mt-0.5">
                      Presioná el botón verde principal al pie de la pantalla. En 1 a 2 segundos se compilarán todos los documentos con las firmas digitales de la directora y los casilleros estampados.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white border-2 border-emerald-500 rounded-lg flex items-start gap-3 shadow-sm bg-emerald-50/30">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    5
                  </span>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-emerald-950">Descargar en el Visor y Ensamblador</h4>
                    <p className="text-gray-700 text-[11px]">
                      Se abrirá automáticamente la ventana de previsualización con 3 opciones de descarga:
                    </p>
                    <ul className="space-y-1 text-gray-700 text-[11px]">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span><strong>Descargar PDF Unificado:</strong> Todo el legajo ensamblado en un único archivo con carátula oficial.</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span><strong>Descargar Todos (.ZIP):</strong> Descarga una carpeta comprimida con cada PDF individual por separado.</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span><strong>Imprimir:</strong> Envía directamente a la impresora conectada sin descargar archivos intermedios.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Descargar prueba desde el diseñador */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1 text-[11px] text-blue-950">
                <span className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  ¿Cómo descargar pruebas de planillas desde el Diseñador?
                </span>
                <p>
                  En el botón superior <strong>"Formularios JUNTOS & O. Sociales"</strong>, cuando seleccionás cualquier plantilla o acomodás etiquetas, podés hacer clic en el botón superior azul <strong>"Descargar PDF de Prueba"</strong> para verificar al instante cómo se imprime sobre el fondo original sin tapar ninguna casilla.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: APP EN PC (PWA) */}
          {activeTab === 'app_pc' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg flex items-start gap-3">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold text-emerald-950 text-sm">
                    Recomendación Oficial: Es MUCHO MÁS ÓPTIMO instalarlo como App en la PC de la escuela.
                  </h3>
                  <p className="text-emerald-800 text-[11px] leading-relaxed">
                    Esta aplicación está desarrollada como <strong>PWA (Progressive Web App)</strong>. Combina la facilidad de la web con el rendimiento de un programa de escritorio instalado en Windows o Mac.
                  </p>
                </div>
              </div>

              {/* Pasos de instalación */}
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                <h4 className="font-bold text-gray-800 text-xs">
                  ¿Cómo instalar la App en tu computadora en 2 clics?
                </h4>
                <div className="space-y-1.5 text-gray-700 text-[11px]">
                  <p>
                    1. En tu navegador (<strong>Google Chrome</strong> o <strong>Microsoft Edge</strong>), mirá al final de la barra de direcciones (donde dice la URL arriba).
                  </p>
                  <p>
                    2. Verás un icono de una pantalla con una flechita hacia abajo 🖥️ o el mensaje <strong>"Instalar aplicación"</strong>.
                  </p>
                  <p>
                    3. Hacé clic en <strong>"Instalar"</strong>. Se creará automáticamente el acceso directo en tu escritorio y barra de tareas como un programa oficial de la escuela.
                  </p>
                </div>
              </div>

              {/* Ventajas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-gray-200 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Ventana propia independiente</span>
                  </div>
                  <p className="text-gray-600 text-[11px]">
                    No se mezcla con pestañas de navegación ni corrés riesgo de cerrarlo por error mientras trabajás.
                  </p>
                </div>

                <div className="p-3 bg-white border border-gray-200 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>Máxima velocidad de compilación</span>
                  </div>
                  <p className="text-gray-600 text-[11px]">
                    Los PDFs se generan usando toda la potencia de tu procesador y memoria local en IndexedDB.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">
            Escuela Especial • Sistema Integral de Legajos
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
