import {
  AlumnoData,
  EscuelaConfig,
  ConfiguracionLegajo,
  CronogramaSemanal,
  PresupuestoHistorialItem,
  FormularioCustomModel,
} from '../types';
import {
  getAllPdfFormulariosFromDB,
  savePdfFormularioToDB,
  deletePdfFormularioFromDB,
  saveMultiplePdfFormulariosToDB,
} from './indexedDbStorage';

export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[Storage] No se pudo guardar en localStorage (posible límite de cuota superado para ${key}):`, err);
    return false;
  }
}

const STORAGE_KEYS = {
  ALUMNOS: 'legajos_alumnos_list',
  ESCUELA: 'legajos_escuela_config',
  LAST_CONFIG: 'legajos_last_config',
  ADJUNTOS: 'legajos_adjuntos_temp',
  OBRAS_SOCIALES_CUSTOM: 'legajos_obras_sociales_custom',
  RESOLUCIONES_CUSTOM: 'legajos_resoluciones_custom',
};

export const DEFAULT_ESCUELA: EscuelaConfig = {
  nombreInstitucion: 'Escuela de Educación Especial y Formación Integral N° 1',
  razonSocial: 'FLORES DE LELOIR S.A.',
  numeroInstitucion: 'DIEGEP 4812 / Dirección de Educación Especial',
  cuit: '30-71458921-9',
  direccion: 'Av. Rivadavia 21.450',
  localidad: 'Ituzaingó',
  provincia: 'Buenos Aires',
  telefono: '(011) 4624-9988',
  email: 'administracion@escuelaespecial.edu.ar',
  nombreDirectora: 'Lic. Claudia M. Rodríguez',
  cargoDirectora: 'Directora - Lic. en Ciencias de la Educación y Psicopedagogía M.N. 45.892',
  resolucionHabilitacion: 'Disposición Ministerial N° 458/2014 - Registro Nacional SNR Prestadores N° 849/22',
};

export const DEFAULT_ALUMNO: AlumnoData = {
  apellidoNombre: 'GÓMEZ PÉREZ, Joaquín Valentín',
  dni: '48.912.455',
  edad: 9,
  fechaNacimiento: '2017-04-15',
  numAfiliado: '01-48912455/02',
  diagnostico: 'Trastorno del Espectro Autista (F84.0) - CUD Vigente',
  escuelaComun: 'Colegio Belgrano Day School (EP N° 14)',
  direccionEscuela: 'Calle Zufriategui 840, Ituzaingó',
  grado: '4° Grado',
  turno: 'Mañana',
  nombreTitular: 'PÉREZ, Marcela Alejandra',
  dniTitular: '32.458.712',
  parentesco: 'Madre',
  numAfiliadoTitular: '01-48912455/00',
};

// LISTADO OFICIAL EXACTO DE OBRAS SOCIALES
export const OBRAS_SOCIALES_OFICIALES = [
  'OSPIF',
  'WILLIAM HOPE',
  'OSDE',
  'UOCRA',
  'ENSALUD',
  'FERROVIARIOS',
  'FRIGORIFICO',
  'GALENO',
  'HOSPITAL ALEMAN',
  'HOSPITAL ITALIANO',
  'IOMA',
  'MAESTRANZA',
  'MEDICUS',
  'OMINT',
  'OSALARA',
  'OSAP',
  'OSCHOCA',
  'OSDEPYM',
  'OSDOP',
  'OSEPJANA',
  'OSETYA',
  'OSFATUN',
  'OSFE',
  'OSIM',
  'OSIPA',
  'OSOSS',
  'OSPA',
  'OSPACP',
  'OSPAGA',
  'OSPATCA',
  'OSPE',
  'OSPG',
  'OSPIA',
  'OSPIC',
  'OSPICA',
  'OSPIV',
  'OSPMLM',
  'OSPOCE',
  'OSPSA',
  'OSPSIP',
  'OSRJA',
  'OSSEG',
  'OSTEE',
  'OSTEL',
  'OSUTHGRA',
  'OSYC',
  'PASTELEROS',
  'PERSONAL DE FARMACIA',
  'PODER JUDICIAL',
  'POLICIA',
  'SANCOR SALUD',
  'SPF',
  'SWISS MEDICAL',
  'TV SALUD',
  'UP',
  'UTA',
  'VAREADORES',
  'ASE',
  'AVALIAN',
  'DAS',
  'OSMATA',
  'OSUOMRA',
  'UOM',
];

// PRESTACIONES EXCLUSIVAS DE ESCUELA ESPECIAL (NO CET)
export const PRESTACIONES_ESCUELA_ESPECIAL = [
  'MODULO DE APOYO A LA INTEGRACION ESCOLAR (CON EQUIPO)',
  'MODULO DE APOYO A LA INTEGRACION ESCOLAR (MODALIDAD AE)',
  'ESCOLARIDAD ESPECIAL PRIMARIA JORNADA SIMPLE',
  'ESCOLARIDAD ESPECIAL PRIMARIA JORNADA DOBLE',
  'ESCOLARIDAD ESPECIAL INICIAL JORNADA SIMPLE',
  'ESCOLARIDAD FORMACION LABORAL JORNADA SIMPLE',
  'ESCOLARIDAD FORMACION LABORAL JORNADA DOBLE',
];

export const RESOLUCIONES_DEFAULT = [
  { nombre: '3487/2026 SEPTIEMBRE', mes: 'SEPTIEMBRE', anio: '2026', aranceles: {
    'MODULO DE APOYO A LA INTEGRACION ESCOLAR (CON EQUIPO)': 770043.58,
    'MODULO DE APOYO A LA INTEGRACION ESCOLAR (MODALIDAD AE)': 620450.00,
    'ESCOLARIDAD ESPECIAL PRIMARIA JORNADA DOBLE': 895200.00,
    'ESCOLARIDAD ESPECIAL PRIMARIA JORNADA SIMPLE': 510300.00,
    'ESCOLARIDAD ESPECIAL INICIAL JORNADA SIMPLE': 495000.00,
    'ESCOLARIDAD FORMACION LABORAL JORNADA DOBLE': 895200.00,
    'ESCOLARIDAD FORMACION LABORAL JORNADA SIMPLE': 510300.00,
  }},
  { nombre: '2914/2026 JUNIO', mes: 'JUNIO', anio: '2026', aranceles: {
    'MODULO DE APOYO A LA INTEGRACION ESCOLAR (CON EQUIPO)': 715000.00,
    'MODULO DE APOYO A LA INTEGRACION ESCOLAR (MODALIDAD AE)': 575000.00,
    'ESCOLARIDAD ESPECIAL PRIMARIA JORNADA DOBLE': 830000.00,
    'ESCOLARIDAD ESPECIAL PRIMARIA JORNADA SIMPLE': 475000.00,
    'ESCOLARIDAD ESPECIAL INICIAL JORNADA SIMPLE': 460000.00,
    'ESCOLARIDAD FORMACION LABORAL JORNADA DOBLE': 830000.00,
    'ESCOLARIDAD FORMACION LABORAL JORNADA SIMPLE': 475000.00,
  }},
  { nombre: '1840/2026 MARZO', mes: 'MARZO', anio: '2026', aranceles: {
    'MODULO DE APOYO A LA INTEGRACION ESCOLAR (CON EQUIPO)': 650000.00,
    'MODULO DE APOYO A LA INTEGRACION ESCOLAR (MODALIDAD AE)': 520000.00,
    'ESCOLARIDAD ESPECIAL PRIMARIA JORNADA DOBLE': 755000.00,
    'ESCOLARIDAD ESPECIAL PRIMARIA JORNADA SIMPLE': 430000.00,
    'ESCOLARIDAD ESPECIAL INICIAL JORNADA SIMPLE': 415000.00,
    'ESCOLARIDAD FORMACION LABORAL JORNADA DOBLE': 755000.00,
    'ESCOLARIDAD FORMACION LABORAL JORNADA SIMPLE': 430000.00,
  }},
  { nombre: 'Resolución Ministerial Vigente (Nomenclador)', mes: 'ACTUAL', anio: '2026', aranceles: {} }
];

export const DEFAULT_CONFIG: ConfiguracionLegajo = {
  obraSocial: 'ASE',
  modalidad: 'MODULO DE APOYO A LA INTEGRACION ESCOLAR (CON EQUIPO)',
  nivel: 'Primaria',
  anio: '2027',
  emisionLugar: 'Ituzaingó',
  emisionFecha: '30/09/2026',
  periodoDesde: 'FEBRERO',
  periodoHasta: 'DICIEMBRE',
  matriculaCuota: 770043.58,
  resolucionMes: '3487/2026 SEPTIEMBRE',
  incluirFirmaDigital: true,
};

export const DEFAULT_CRONOGRAMA: CronogramaSemanal = {
  lunes: { desde: '08:30', hasta: '16:30', activo: true },
  martes: { desde: '08:30', hasta: '16:30', activo: true },
  miercoles: { desde: '08:30', hasta: '16:30', activo: true },
  jueves: { desde: '08:30', hasta: '16:30', activo: true },
  viernes: { desde: '08:30', hasta: '16:30', activo: true },
};

// OBRAS SOCIALES: Obtener lista completa (oficiales + anexadas por el usuario)
export function getObrasSociales(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OBRAS_SOCIALES_CUSTOM);
    const custom: string[] = raw ? JSON.parse(raw) : [];
    const set = new Set([...OBRAS_SOCIALES_OFICIALES, ...custom]);
    return Array.from(set);
  } catch {
    return OBRAS_SOCIALES_OFICIALES;
  }
}

// ANEXAR NUEVA OBRA SOCIAL
export function agregarObraSocial(nombre: string): string[] {
  const clean = nombre.trim().toUpperCase();
  if (!clean) return getObrasSociales();

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OBRAS_SOCIALES_CUSTOM);
    const custom: string[] = raw ? JSON.parse(raw) : [];
    if (!custom.includes(clean) && !OBRAS_SOCIALES_OFICIALES.includes(clean)) {
      custom.push(clean);
      safeLocalStorageSet(STORAGE_KEYS.OBRAS_SOCIALES_CUSTOM, JSON.stringify(custom));
    }
  } catch (e) {
    console.error('Error saving custom obra social', e);
  }

  return getObrasSociales();
}

// RESOLUCIONES
export function getResolucionesNombres(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESOLUCIONES_CUSTOM);
    if (!raw) return RESOLUCIONES_DEFAULT.map((r) => r.nombre);
    const parsed: any[] = JSON.parse(raw);
    const set = new Set([...parsed.map((p) => p.nombre || p.resolucion), ...RESOLUCIONES_DEFAULT.map((r) => r.nombre)]);
    return Array.from(set);
  } catch {
    return RESOLUCIONES_DEFAULT.map((r) => r.nombre);
  }
}

export function saveCustomResoluciones(resolucionesList: any[]): void {
  safeLocalStorageSet(STORAGE_KEYS.RESOLUCIONES_CUSTOM, JSON.stringify(resolucionesList));
}

// ALUMNOS STORAGE
export function getAlumnosGuardados(): AlumnoData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ALUMNOS);
    if (!raw) {
      const initial: AlumnoData[] = [
        DEFAULT_ALUMNO,
        {
          id: 'alum-2',
          apellidoNombre: 'MARTÍNEZ BENÍTEZ, Sofía',
          dni: '50.114.890',
          edad: 8,
          fechaNacimiento: '2018-08-22',
          numAfiliado: '99-50114890/01',
          diagnostico: 'Retraso Global del Desarrollo (F88) - Trastorno Específico del Lenguaje',
          escuelaComun: 'Instituto San Francisco de Asís',
          direccionEscuela: 'Mariano Acosta 1250, Castelar',
          grado: '3° Grado',
          turno: 'Tarde',
          nombreTitular: 'BENÍTEZ, Valeria Roxana',
          dniTitular: '34.819.002',
          parentesco: 'Madre',
          numAfiliadoTitular: '99-50114890/00',
        },
        {
          id: 'alum-3',
          apellidoNombre: 'FERRARI, Tomás Ignacio',
          dni: '47.230.119',
          edad: 11,
          fechaNacimiento: '2015-11-03',
          numAfiliado: '25-47230119/03',
          diagnostico: 'Trastorno por Déficit de Atención con Hiperactividad e impulsividad (F90.0)',
          escuelaComun: 'Escuela Primaria N° 7 Domingo Faustino Sarmiento',
          direccionEscuela: 'Av. Ratti 450, Ituzaingó',
          grado: '6° Grado',
          turno: 'Mañana',
          nombreTitular: 'FERRARI, Carlos Alberto',
          dniTitular: '29.330.128',
          parentesco: 'Padre',
          numAfiliadoTitular: '25-47230119/00',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.ALUMNOS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [DEFAULT_ALUMNO];
  }
}

export function saveAlumno(alumno: AlumnoData): AlumnoData[] {
  const list = getAlumnosGuardados();
  const existingIdx = list.findIndex(
    (a) => a.dni.trim().replace(/\D/g, '') === alumno.dni.trim().replace(/\D/g, '')
  );

  const alumnoToSave = {
    ...alumno,
    id: alumno.id || 'alum-' + Date.now(),
  };

  if (existingIdx >= 0) {
    list[existingIdx] = alumnoToSave;
  } else {
    list.unshift(alumnoToSave);
  }

  safeLocalStorageSet(STORAGE_KEYS.ALUMNOS, JSON.stringify(list));
  return list;
}

export function saveAlumnosBatch(nuevosAlumnos: AlumnoData[]): AlumnoData[] {
  const list = getAlumnosGuardados();
  for (const nuevo of nuevosAlumnos) {
    const existingIdx = list.findIndex(
      (a) => a.dni.trim().replace(/\D/g, '') === nuevo.dni.trim().replace(/\D/g, '')
    );
    if (existingIdx >= 0) {
      list[existingIdx] = { ...nuevo, id: list[existingIdx].id };
    } else {
      list.push(nuevo);
    }
  }
  safeLocalStorageSet(STORAGE_KEYS.ALUMNOS, JSON.stringify(list));
  return list;
}

export function deleteAlumno(id: string): AlumnoData[] {
  const list = getAlumnosGuardados().filter((a) => a.id !== id);
  safeLocalStorageSet(STORAGE_KEYS.ALUMNOS, JSON.stringify(list));
  return list;
}

export function getEscuelaConfig(): EscuelaConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ESCUELA);
    if (!raw) return DEFAULT_ESCUELA;
    return { ...DEFAULT_ESCUELA, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ESCUELA;
  }
}

export function saveEscuelaConfig(config: EscuelaConfig): void {
  safeLocalStorageSet(STORAGE_KEYS.ESCUELA, JSON.stringify(config));
}

// 7. HISTORIAL DE PRESUPUESTOS Y LEGAJOS REALIZADOS
const HISTORIAL_KEY = 'legajos_historial_presupuestos';

export function getHistorialPresupuestos(): PresupuestoHistorialItem[] {
  try {
    const raw = localStorage.getItem(HISTORIAL_KEY);
    if (!raw) {
      // Initial seeded historical records
      const initial: PresupuestoHistorialItem[] = [
        {
          id: 'hist-1',
          fechaGeneracion: '30/09/2026',
          alumnoNombre: 'GÓMEZ PÉREZ, Joaquín Valentín',
          alumnoDni: '48.912.455',
          alumnoAfiliado: '01-48912455/02',
          obraSocial: 'ASE',
          modalidad: 'MODULO DE APOYO A LA INTEGRACION ESCOLAR (CON EQUIPO)',
          escuelaComun: 'Colegio Belgrano Day School (EP N° 14)',
          grado: '4° Grado',
          turno: 'Mañana',
          periodo: 'FEBRERO a DICIEMBRE',
          anio: '2027',
          montoCuota: 770043.58,
          montoLetras: 'PESOS SETECIENTOS SETENTA MIL CUARENTA Y TRES CON 58/100',
          resolucion: '3487/2026 SEPTIEMBRE',
          titularNombre: 'PÉREZ, Marcela Alejandra',
          titularDni: '32.458.712',
          documentosIncluidos: ['Ficha', 'Presupuesto', 'Consentimiento', 'Plan Trabajo', 'CAR', 'Acta Acuerdo', 'Asistencia', 'Facturación'],
        },
        {
          id: 'hist-2',
          fechaGeneracion: '28/09/2026',
          alumnoNombre: 'MARTÍNEZ BENÍTEZ, Sofía',
          alumnoDni: '50.114.890',
          alumnoAfiliado: '99-50114890/01',
          obraSocial: 'IOMA',
          modalidad: 'MODULO DE APOYO A LA INTEGRACION ESCOLAR (MODALIDAD AE)',
          escuelaComun: 'Instituto San Francisco de Asís',
          grado: '3° Grado',
          turno: 'Tarde',
          periodo: 'MARZO a DICIEMBRE',
          anio: '2027',
          montoCuota: 620450.00,
          montoLetras: 'PESOS SEISCIENTOS VEINTE MIL CUATROCIENTOS CINCUENTA CON 00/100',
          resolucion: '3487/2026 SEPTIEMBRE',
          titularNombre: 'BENÍTEZ, Valeria Roxana',
          titularDni: '34.819.002',
          documentosIncluidos: ['Presupuesto', 'Plan Trabajo (AE)', 'Formulario JUNTOS', 'Consentimiento', 'CAR'],
        },
        {
          id: 'hist-3',
          fechaGeneracion: '25/09/2026',
          alumnoNombre: 'FERRARI, Tomás Ignacio',
          alumnoDni: '47.230.119',
          alumnoAfiliado: '25-47230119/03',
          obraSocial: 'OSDE',
          modalidad: 'ESCOLARIDAD FORMACION LABORAL JORNADA DOBLE',
          escuelaComun: 'Centro Formación Integral N° 1',
          grado: '1° Año CFI',
          turno: 'Jornada Completa',
          periodo: 'FEBRERO a DICIEMBRE',
          anio: '2027',
          montoCuota: 895200.00,
          montoLetras: 'PESOS OCHOCIENTOS NOVENTA Y CINCO MIL DOSCIENTOS CON 00/100',
          resolucion: '3487/2026 SEPTIEMBRE',
          titularNombre: 'FERRARI, Carlos Alberto',
          titularDni: '29.330.128',
          documentosIncluidos: ['Ficha', 'Presupuesto', 'Proyecto CFI', 'CAR', 'Planilla Asistencia'],
        },
      ];
      safeLocalStorageSet(HISTORIAL_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveHistorialPresupuesto(item: Omit<PresupuestoHistorialItem, 'id'>): PresupuestoHistorialItem[] {
  const list = getHistorialPresupuestos();
  const newItem: PresupuestoHistorialItem = {
    ...item,
    id: 'hist-' + Date.now(),
  };
  list.unshift(newItem);
  safeLocalStorageSet(HISTORIAL_KEY, JSON.stringify(list));
  return list;
}

export function deleteHistorialPresupuesto(id: string): PresupuestoHistorialItem[] {
  const list = getHistorialPresupuestos().filter((h) => h.id !== id);
  safeLocalStorageSet(HISTORIAL_KEY, JSON.stringify(list));
  return list;
}

// 8. FORMULARIOS CUSTOM SUBIDOS (JUNTOS, OBRAS SOCIALES)
const FORMULARIOS_KEY = 'legajos_formularios_custom';

// Memoria en RAM con los formularios completos (incluyendo pdfBase64)
let memoryFormularios: FormularioCustomModel[] = [];
let dbHydrated = false;
let dbHydrationPromise: Promise<FormularioCustomModel[]> | null = null;

// Carga inicial síncrona desde localStorage y migración a IndexedDB
function initMemoryFromLocalStorage(): void {
  try {
    const raw = localStorage.getItem(FORMULARIOS_KEY);
    if (!raw) return;
    const parsed: FormularioCustomModel[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    memoryFormularios = parsed;

    // Si detectamos PDFs pesados en base64 en localStorage, migrarlos a IndexedDB y limpiar localStorage
    const hasHeavyData = parsed.some((f) => f.pdfBase64 && f.pdfBase64.length > 500);
    if (hasHeavyData) {
      saveMultiplePdfFormulariosToDB(parsed).then(() => {
        const lightList = parsed.map((f) => ({ ...f, pdfBase64: '' }));
        safeLocalStorageSet(FORMULARIOS_KEY, JSON.stringify(lightList));
      });
    }
  } catch (err) {
    console.warn('Error cargando formularios desde localStorage:', err);
  }
}

// Asegura que todos los PDFs completos se encuentren hidratados desde IndexedDB
export function ensureFormulariosLoaded(): Promise<FormularioCustomModel[]> {
  if (dbHydrated) {
    return Promise.resolve(memoryFormularios);
  }
  if (dbHydrationPromise) {
    return dbHydrationPromise;
  }

  dbHydrationPromise = (async () => {
    try {
      const dbForms = await getAllPdfFormulariosFromDB();
      if (dbForms && dbForms.length > 0) {
        const map = new Map<string, FormularioCustomModel>();
        for (const f of memoryFormularios) {
          map.set(f.id, f);
        }
        for (const f of dbForms) {
          const existing = map.get(f.id);
          if (existing) {
            map.set(f.id, {
              ...existing,
              ...f,
              pdfBase64: f.pdfBase64 || existing.pdfBase64,
            });
          } else {
            map.set(f.id, f);
          }
        }
        memoryFormularios = Array.from(map.values());
      } else if (memoryFormularios.length > 0) {
        const formsWithPdf = memoryFormularios.filter((f) => f.pdfBase64 && f.pdfBase64.length > 100);
        if (formsWithPdf.length > 0) {
          await saveMultiplePdfFormulariosToDB(formsWithPdf);
        }
      }
      dbHydrated = true;
      return memoryFormularios;
    } catch (err) {
      console.warn('Error en ensureFormulariosLoaded:', err);
      dbHydrated = true;
      return memoryFormularios;
    }
  })();

  return dbHydrationPromise;
}

// Inicialización automática al arrancar en el navegador
if (typeof window !== 'undefined') {
  initMemoryFromLocalStorage();
  ensureFormulariosLoaded();
}

export function getFormulariosCustom(): FormularioCustomModel[] {
  return memoryFormularios;
}

export function saveFormularioCustom(form: FormularioCustomModel): FormularioCustomModel[] {
  const existingIdx = memoryFormularios.findIndex((f) => f.id === form.id);
  if (existingIdx >= 0) {
    memoryFormularios[existingIdx] = form;
  } else {
    memoryFormularios.unshift(form);
  }

  // Guardar archivo completo (incluyendo PDF pesado) en IndexedDB
  savePdfFormularioToDB(form);

  // Guardar versión ligera sin PDF en localStorage para evitar QuotaExceededError
  try {
    const lightList = memoryFormularios.map((f) => ({
      ...f,
      pdfBase64: '',
    }));
    safeLocalStorageSet(FORMULARIOS_KEY, JSON.stringify(lightList));
  } catch (err) {
    console.warn('Error guardando metadata en localStorage:', err);
  }

  return [...memoryFormularios];
}

export function deleteFormularioCustom(id: string): FormularioCustomModel[] {
  memoryFormularios = memoryFormularios.filter((f) => f.id !== id);

  // Eliminar de IndexedDB
  deletePdfFormularioFromDB(id);

  // Actualizar versión ligera en localStorage
  try {
    const lightList = memoryFormularios.map((f) => ({
      ...f,
      pdfBase64: '',
    }));
    safeLocalStorageSet(FORMULARIOS_KEY, JSON.stringify(lightList));
  } catch (err) {
    console.warn('Error actualizando metadata en localStorage tras borrado:', err);
  }

  return [...memoryFormularios];
}
