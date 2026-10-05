import React, { useState, useEffect, useRef } from 'react';
import {
  AlumnoData,
  ConfiguracionLegajo,
  CronogramaSemanal,
  EscuelaConfig,
  FormularioCustomModel,
  CampoEtiqueta,
  RolDocumentoFijo,
  PrestacionFijo,
  NivelFijo,
} from '../types';
import {
  getFormulariosCustom,
  saveFormularioCustom,
  deleteFormularioCustom,
  ensureFormulariosLoaded,
  getObrasSociales,
  DEFAULT_CRONOGRAMA,
  getEscuelaConfig,
} from '../utils/storage';
import { cleanWinAnsi } from '../utils/pdfGenerator';
import {
  autoDetectarMetadatosFormulario,
  getFormularioEffectiveMeta,
  formularioAplicaAAlumno,
  LABELS_PRESTACION_FIJO,
  LABELS_ROL_DOCUMENTO,
  getPrestacionKeyFromModalidad,
} from '../utils/formMatching';
import { numeroALetras, formatearMoneda } from '../utils/numberToWords';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import {
  X,
  Upload,
  Sparkles,
  Save,
  Plus,
  Trash2,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Move,
  Tag,
  Eye,
  Check,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface FormulariosManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  alumno: AlumnoData;
  config: ConfiguracionLegajo;
  cronograma?: CronogramaSemanal;
}

export function getPrestacionAbreviada(modalidad: string): string {
  const m = (modalidad || '').toUpperCase();
  if (m.includes('PRIMARIA') && m.includes('SIMPLE')) return 'EGB JS';
  if (m.includes('PRIMARIA') && m.includes('DOBLE')) return 'EGB JD';
  if (m.includes('LABORAL') && m.includes('SIMPLE')) return 'FORMACION LABORAL JS';
  if (m.includes('LABORAL') && m.includes('DOBLE')) return 'FORMACION LABORAL JD';
  if (m.includes('INICIAL')) return 'INICIAL JS';
  if (m.includes('INTEGRACION') || m.includes('APOYO') || m.includes('SAIE') || m.includes('AE')) return 'SAIE';
  return 'SAIE';
}

// Helpers para calcular cantidad de días y sesiones semanales/mensuales según cronograma del afiliado
export function getDiasActivosCronograma(cr?: CronogramaSemanal): number {
  if (!cr) return 5;
  const dias = [cr.lunes, cr.martes, cr.miercoles, cr.jueves, cr.viernes];
  const count = dias.filter((d) => d && d.activo !== false).length;
  return count > 0 ? count : 5;
}

export function getSesionesSemanales(cr?: CronogramaSemanal): number {
  return getDiasActivosCronograma(cr);
}

export function getSesionesMensuales(cr?: CronogramaSemanal): number {
  return getDiasActivosCronograma(cr) * 4;
}

const NUMEROS_A_LETRAS_SESIONES: Record<number, string> = {
  1: 'UNA',
  2: 'DOS',
  3: 'TRES',
  4: 'CUATRO',
  5: 'CINCO',
  6: 'SEIS',
  7: 'SIETE',
  8: 'OCHO',
  10: 'DIEZ',
  12: 'DOCE',
  16: 'DIECISÉIS',
  20: 'VEINTE',
  24: 'VEINTICUATRO',
};

// Formatea el mes en formato DD/MM/AAAA (ej. 01/02/2027)
export function getFechaPeriodo(mesTexto?: string, anioTexto?: string, esFin: boolean = false): string {
  const anio = (anioTexto || '2027').replace(/\D/g, '') || '2027';
  const m = (mesTexto || '').toUpperCase().trim();

  // Si ya viene con formato numérico DD/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(m)) return m;

  let mesNum = 2; // Por defecto Febrero
  let finDia = 28;
  const yearInt = parseInt(anio, 10);
  const isLeap = (yearInt % 4 === 0 && yearInt % 100 !== 0) || yearInt % 400 === 0;

  if (m.includes('ENE')) { mesNum = 1; finDia = 31; }
  else if (m.includes('FEB')) { mesNum = 2; finDia = isLeap ? 29 : 28; }
  else if (m.includes('MAR')) { mesNum = 3; finDia = 31; }
  else if (m.includes('ABR')) { mesNum = 4; finDia = 30; }
  else if (m.includes('MAY')) { mesNum = 5; finDia = 31; }
  else if (m.includes('JUN')) { mesNum = 6; finDia = 30; }
  else if (m.includes('JUL')) { mesNum = 7; finDia = 31; }
  else if (m.includes('AGO')) { mesNum = 8; finDia = 31; }
  else if (m.includes('SEP')) { mesNum = 9; finDia = 30; }
  else if (m.includes('OCT')) { mesNum = 10; finDia = 31; }
  else if (m.includes('NOV')) { mesNum = 11; finDia = 30; }
  else if (m.includes('DIC')) { mesNum = 12; finDia = 31; }

  const mesStr = String(mesNum).padStart(2, '0');
  if (esFin) {
    return `${finDia}/${mesStr}/${anio}`;
  } else {
    return `01/${mesStr}/${anio}`;
  }
}

// Obtiene horario corto desde-hasta del cronograma (ej. 08:30 a 16:30 o 08:30 - 16:30)
export function getHorarioCorto(cr?: CronogramaSemanal, separador: string = ' a '): string {
  if (!cr) return `08:30${separador}16:30`;
  const dias = [cr.lunes, cr.martes, cr.miercoles, cr.jueves, cr.viernes];
  const activo = dias.find((d) => d && d.activo !== false && d.desde && d.hasta) || cr.lunes;
  const desde = activo?.desde || '08:30';
  const hasta = activo?.hasta || '16:30';
  return `${desde}${separador}${hasta}`;
}

export type CategoriaEtiqueta =
  | 'Prestación'
  | 'Horarios'
  | 'Fechas'
  | 'Alumno'
  | 'Escuela Común'
  | 'Titular'
  | 'Aranceles'
  | 'Institución';

export interface TagItemDef {
  etiqueta: string;
  categoria: CategoriaEtiqueta;
  nombre: string;
  descripcion: string;
  ejemplo: (
    a: AlumnoData,
    c: ConfiguracionLegajo,
    cr?: CronogramaSemanal,
    esc?: EscuelaConfig
  ) => string;
}

export const TODAS_LAS_ETIQUETAS: TagItemDef[] = [
  // 1. PRESTACIÓN Y MODALIDAD (LARGA Y CORTA)
  {
    etiqueta: '{PRESTACION_CORTA}',
    categoria: 'Prestación',
    nombre: 'Prestación Abreviada (EGB JS, EGB JD, SAIE, etc.)',
    descripcion: 'Abreviación oficial corta para casilleros pequeños sin salirse del renglón',
    ejemplo: (_a, c) => getPrestacionAbreviada(c.modalidad),
  },
  {
    etiqueta: '{PRESTACION}',
    categoria: 'Prestación',
    nombre: 'Prestación Nombre Completo Oficial',
    descripcion: 'Nombre reglamentario completo según Escuela Especial',
    ejemplo: (_a, c) => c.modalidad,
  },
  {
    etiqueta: '{NIVEL}',
    categoria: 'Prestación',
    nombre: 'Nivel Escolar (Primaria, Secundaria, Inicial, etc.)',
    descripcion: 'Nivel educativo en que se encuentra matriculado el alumno',
    ejemplo: (_a, c) => c.nivel || 'Primaria',
  },
  {
    etiqueta: '{NIVEL_EDUCATIVO}',
    categoria: 'Prestación',
    nombre: 'Nivel Educativo con Texto ("Nivel X")',
    descripcion: 'Ej. Nivel Primario / Nivel Secundario',
    ejemplo: (_a, c) => `Nivel ${c.nivel || 'Primaria'}`,
  },
  {
    etiqueta: '{OBRA_SOCIAL}',
    categoria: 'Prestación',
    nombre: 'Obra Social o Prepaga del Alumno',
    descripcion: 'Nombre de la entidad aseguradora (ej. OSDE, IOMA, ASE)',
    ejemplo: (_a, c) => c.obraSocial || 'OSDE',
  },

  // 2. HORARIOS DE CADA DÍA DE LA SEMANA (COMPACTOS Y COMPLETOS)
  // Versiones ultra-cortas para casilleros pequeños (L_D, L_A, M_D, M_A, etc.)
  {
    etiqueta: '{L_D}',
    categoria: 'Horarios',
    nombre: 'Lunes Desde Corto (L_D)',
    descripcion: 'Hora de ingreso día lunes en formato compacto para casilleros pequeños (ej. 08:30)',
    ejemplo: (_a, _c, cr) => (cr?.lunes?.activo !== false ? cr?.lunes?.desde || '08:30' : '-'),
  },
  {
    etiqueta: '{L_A}',
    categoria: 'Horarios',
    nombre: 'Lunes Hasta Corto (L_A)',
    descripcion: 'Hora de egreso día lunes en formato compacto para casilleros pequeños (ej. 16:30)',
    ejemplo: (_a, _c, cr) => (cr?.lunes?.activo !== false ? cr?.lunes?.hasta || '16:30' : '-'),
  },
  {
    etiqueta: '{M_D}',
    categoria: 'Horarios',
    nombre: 'Martes Desde Corto (M_D)',
    descripcion: 'Hora de ingreso día martes compacto (ej. 08:30)',
    ejemplo: (_a, _c, cr) => (cr?.martes?.activo !== false ? cr?.martes?.desde || '08:30' : '-'),
  },
  {
    etiqueta: '{M_A}',
    categoria: 'Horarios',
    nombre: 'Martes Hasta Corto (M_A)',
    descripcion: 'Hora de egreso día martes compacto (ej. 16:30)',
    ejemplo: (_a, _c, cr) => (cr?.martes?.activo !== false ? cr?.martes?.hasta || '16:30' : '-'),
  },
  {
    etiqueta: '{MI_D}',
    categoria: 'Horarios',
    nombre: 'Miércoles Desde Corto (MI_D)',
    descripcion: 'Hora de ingreso día miércoles compacto (ej. 08:30)',
    ejemplo: (_a, _c, cr) => (cr?.miercoles?.activo !== false ? cr?.miercoles?.desde || '08:30' : '-'),
  },
  {
    etiqueta: '{MI_A}',
    categoria: 'Horarios',
    nombre: 'Miércoles Hasta Corto (MI_A)',
    descripcion: 'Hora de egreso día miércoles compacto (ej. 16:30)',
    ejemplo: (_a, _c, cr) => (cr?.miercoles?.activo !== false ? cr?.miercoles?.hasta || '16:30' : '-'),
  },
  {
    etiqueta: '{J_D}',
    categoria: 'Horarios',
    nombre: 'Jueves Desde Corto (J_D)',
    descripcion: 'Hora de ingreso día jueves compacto (ej. 08:30)',
    ejemplo: (_a, _c, cr) => (cr?.jueves?.activo !== false ? cr?.jueves?.desde || '08:30' : '-'),
  },
  {
    etiqueta: '{J_A}',
    categoria: 'Horarios',
    nombre: 'Jueves Hasta Corto (J_A)',
    descripcion: 'Hora de egreso día jueves compacto (ej. 16:30)',
    ejemplo: (_a, _c, cr) => (cr?.jueves?.activo !== false ? cr?.jueves?.hasta || '16:30' : '-'),
  },
  {
    etiqueta: '{V_D}',
    categoria: 'Horarios',
    nombre: 'Viernes Desde Corto (V_D)',
    descripcion: 'Hora de ingreso día viernes compacto (ej. 08:30)',
    ejemplo: (_a, _c, cr) => (cr?.viernes?.activo !== false ? cr?.viernes?.desde || '08:30' : '-'),
  },
  {
    etiqueta: '{V_A}',
    categoria: 'Horarios',
    nombre: 'Viernes Hasta Corto (V_A)',
    descripcion: 'Hora de egreso día viernes compacto (ej. 16:30)',
    ejemplo: (_a, _c, cr) => (cr?.viernes?.activo !== false ? cr?.viernes?.hasta || '16:30' : '-'),
  },
  {
    etiqueta: '{D}',
    categoria: 'Horarios',
    nombre: 'Desde Ultra-Corto (D)',
    descripcion: 'Hora de entrada general (ej. 08:30)',
    ejemplo: (_a, _c, cr) => cr?.lunes?.desde || '08:30',
  },
  {
    etiqueta: '{A}',
    categoria: 'Horarios',
    nombre: 'Hasta Ultra-Corto (A)',
    descripcion: 'Hora de salida general (ej. 16:30)',
    ejemplo: (_a, _c, cr) => cr?.lunes?.hasta || '16:30',
  },

  // Versiones completas con nombre de día
  // Lunes
  {
    etiqueta: '{LUNES_DESDE}',
    categoria: 'Horarios',
    nombre: 'Lunes Horario Desde (Hora de Entrada)',
    descripcion: 'Hora de inicio del día lunes (ej. 08:30)',
    ejemplo: (_a, _c, cr) => (cr?.lunes?.activo !== false ? cr?.lunes?.desde || '08:30' : '-'),
  },
  {
    etiqueta: '{LUNES_HASTA}',
    categoria: 'Horarios',
    nombre: 'Lunes Horario Hasta (Hora de Salida)',
    descripcion: 'Hora de egreso del día lunes (ej. 16:30)',
    ejemplo: (_a, _c, cr) => (cr?.lunes?.activo !== false ? cr?.lunes?.hasta || '16:30' : '-'),
  },
  {
    etiqueta: '{LUNES_HORARIO}',
    categoria: 'Horarios',
    nombre: 'Lunes Horario Completo (Desde a Hasta)',
    descripcion: 'Horario completo del lunes (ej. 08:30 a 16:30)',
    ejemplo: (_a, _c, cr) => (cr?.lunes?.activo !== false ? `${cr?.lunes?.desde || '08:30'} a ${cr?.lunes?.hasta || '16:30'}` : 'Sin actividad'),
  },

  // Martes
  {
    etiqueta: '{MARTES_DESDE}',
    categoria: 'Horarios',
    nombre: 'Martes Horario Desde (Hora de Entrada)',
    descripcion: 'Hora de inicio del día martes (ej. 08:30)',
    ejemplo: (_a, _c, cr) => (cr?.martes?.activo !== false ? cr?.martes?.desde || '08:30' : '-'),
  },
  {
    etiqueta: '{MARTES_HASTA}',
    categoria: 'Horarios',
    nombre: 'Martes Horario Hasta (Hora de Salida)',
    descripcion: 'Hora de egreso del día martes (ej. 16:30)',
    ejemplo: (_a, _c, cr) => (cr?.martes?.activo !== false ? cr?.martes?.hasta || '16:30' : '-'),
  },
  {
    etiqueta: '{MARTES_HORARIO}',
    categoria: 'Horarios',
    nombre: 'Martes Horario Completo (Desde a Hasta)',
    descripcion: 'Horario completo del martes (ej. 08:30 a 16:30)',
    ejemplo: (_a, _c, cr) => (cr?.martes?.activo !== false ? `${cr?.martes?.desde || '08:30'} a ${cr?.martes?.hasta || '16:30'}` : 'Sin actividad'),
  },

  // Miércoles
  {
    etiqueta: '{MIERCOLES_DESDE}',
    categoria: 'Horarios',
    nombre: 'Miércoles Horario Desde (Hora de Entrada)',
    descripcion: 'Hora de inicio del día miércoles (ej. 08:30)',
    ejemplo: (_a, _c, cr) => (cr?.miercoles?.activo !== false ? cr?.miercoles?.desde || '08:30' : '-'),
  },
  {
    etiqueta: '{MIERCOLES_HASTA}',
    categoria: 'Horarios',
    nombre: 'Miércoles Horario Hasta (Hora de Salida)',
    descripcion: 'Hora de egreso del día miércoles (ej. 16:30)',
    ejemplo: (_a, _c, cr) => (cr?.miercoles?.activo !== false ? cr?.miercoles?.hasta || '16:30' : '-'),
  },
  {
    etiqueta: '{MIERCOLES_HORARIO}',
    categoria: 'Horarios',
    nombre: 'Miércoles Horario Completo (Desde a Hasta)',
    descripcion: 'Horario completo del miércoles (ej. 08:30 a 16:30)',
    ejemplo: (_a, _c, cr) => (cr?.miercoles?.activo !== false ? `${cr?.miercoles?.desde || '08:30'} a ${cr?.miercoles?.hasta || '16:30'}` : 'Sin actividad'),
  },

  // Jueves
  {
    etiqueta: '{JUEVES_DESDE}',
    categoria: 'Horarios',
    nombre: 'Jueves Horario Desde (Hora de Entrada)',
    descripcion: 'Hora de inicio del día jueves (ej. 08:30)',
    ejemplo: (_a, _c, cr) => (cr?.jueves?.activo !== false ? cr?.jueves?.desde || '08:30' : '-'),
  },
  {
    etiqueta: '{JUEVES_HASTA}',
    categoria: 'Horarios',
    nombre: 'Jueves Horario Hasta (Hora de Salida)',
    descripcion: 'Hora de egreso del día jueves (ej. 16:30)',
    ejemplo: (_a, _c, cr) => (cr?.jueves?.activo !== false ? cr?.jueves?.hasta || '16:30' : '-'),
  },
  {
    etiqueta: '{JUEVES_HORARIO}',
    categoria: 'Horarios',
    nombre: 'Jueves Horario Completo (Desde a Hasta)',
    descripcion: 'Horario completo del jueves (ej. 08:30 a 16:30)',
    ejemplo: (_a, _c, cr) => (cr?.jueves?.activo !== false ? `${cr?.jueves?.desde || '08:30'} a ${cr?.jueves?.hasta || '16:30'}` : 'Sin actividad'),
  },

  // Viernes
  {
    etiqueta: '{VIERNES_DESDE}',
    categoria: 'Horarios',
    nombre: 'Viernes Horario Desde (Hora de Entrada)',
    descripcion: 'Hora de inicio del día viernes (ej. 08:30)',
    ejemplo: (_a, _c, cr) => (cr?.viernes?.activo !== false ? cr?.viernes?.desde || '08:30' : '-'),
  },
  {
    etiqueta: '{VIERNES_HASTA}',
    categoria: 'Horarios',
    nombre: 'Viernes Horario Hasta (Hora de Salida)',
    descripcion: 'Hora de egreso del día viernes (ej. 16:30)',
    ejemplo: (_a, _c, cr) => (cr?.viernes?.activo !== false ? cr?.viernes?.hasta || '16:30' : '-'),
  },
  {
    etiqueta: '{VIERNES_HORARIO}',
    categoria: 'Horarios',
    nombre: 'Viernes Horario Completo (Desde a Hasta)',
    descripcion: 'Horario completo del viernes (ej. 08:30 a 16:30)',
    ejemplo: (_a, _c, cr) => (cr?.viernes?.activo !== false ? `${cr?.viernes?.desde || '08:30'} a ${cr?.viernes?.hasta || '16:30'}` : 'Sin actividad'),
  },

  // Horarios Generales
  {
    etiqueta: '{HORARIO_DESDE}',
    categoria: 'Horarios',
    nombre: 'Horario General Desde',
    descripcion: 'Horario general de entrada (ej. 08:30)',
    ejemplo: (_a, _c, cr) => cr?.lunes?.desde || '08:30',
  },
  {
    etiqueta: '{HORARIO_HASTA}',
    categoria: 'Horarios',
    nombre: 'Horario General Hasta',
    descripcion: 'Horario general de salida (ej. 16:30)',
    ejemplo: (_a, _c, cr) => cr?.lunes?.hasta || '16:30',
  },
  {
    etiqueta: '{CRONOGRAMA_SEMANAL}',
    categoria: 'Horarios',
    nombre: 'Cronograma Semanal Resumen',
    descripcion: 'Resumen completo días y horarios (ej. Lunes a Viernes de 08:30 a 16:30 hs)',
    ejemplo: (_a, _c, cr) => `Lunes a Viernes de ${cr?.lunes?.desde || '08:30'} a ${cr?.lunes?.hasta || '16:30'} hs`,
  },
  {
    etiqueta: '{HORARIO_CORTO}',
    categoria: 'Horarios',
    nombre: 'Horario Corto Desde y Hasta (08:30 a 16:30)',
    descripcion: 'Horario de entrada y salida conciso (ej. 08:30 a 16:30)',
    ejemplo: (_a, _c, cr) => getHorarioCorto(cr, ' a '),
  },
  {
    etiqueta: '{HORARIO_GUION}',
    categoria: 'Horarios',
    nombre: 'Horario Corto con Guion (08:30 - 16:30)',
    descripcion: 'Horario conciso separado con guion (ej. 08:30 - 16:30)',
    ejemplo: (_a, _c, cr) => getHorarioCorto(cr, ' - '),
  },
  {
    etiqueta: '{HORARIO_DESDE_HASTA}',
    categoria: 'Horarios',
    nombre: 'Horario Desde y Hasta Cortito',
    descripcion: 'Solo hora desde y hora hasta (ej. 08:30 a 16:30)',
    ejemplo: (_a, _c, cr) => getHorarioCorto(cr, ' a '),
  },
  {
    etiqueta: '{HORARIO_HS}',
    categoria: 'Horarios',
    nombre: 'Horario Corto con hs (08:30 a 16:30 hs)',
    descripcion: 'Horario conciso con terminación hs (ej. 08:30 a 16:30 hs)',
    ejemplo: (_a, _c, cr) => `${getHorarioCorto(cr, ' a ')} hs`,
  },
  {
    etiqueta: '{HORARIO_SIMPLE}',
    categoria: 'Horarios',
    nombre: 'Horario Simple Sin Espacios (08:30-16:30)',
    descripcion: 'Para casilleros extremadamente pequeños (ej. 08:30-16:30)',
    ejemplo: (_a, _c, cr) => getHorarioCorto(cr, '-'),
  },

  // Sesiones Semanales y Mensuales (calculadas según días con prestación activa)
  // Versiones Cortas para casilleros estrechos
  {
    etiqueta: '{SES_SEM}',
    categoria: 'Horarios',
    nombre: 'Sesiones Semanales Corto (SES_SEM)',
    descripcion: 'Versión ultra-compacta para casilleros pequeños (ej. 5 o 3)',
    ejemplo: (_a, _c, cr) => String(getSesionesSemanales(cr)),
  },
  {
    etiqueta: '{SES_MEN}',
    categoria: 'Horarios',
    nombre: 'Sesiones Mensuales Corto (SES_MEN)',
    descripcion: 'Versión ultra-compacta para casilleros pequeños (ej. 20 o 12)',
    ejemplo: (_a, _c, cr) => String(getSesionesMensuales(cr)),
  },
  {
    etiqueta: '{SES_S}',
    categoria: 'Horarios',
    nombre: 'Sesiones Semanales Mínimo (SES_S)',
    descripcion: 'Alias mínimo para casilleros de 1 dígito',
    ejemplo: (_a, _c, cr) => String(getSesionesSemanales(cr)),
  },
  {
    etiqueta: '{SES_M}',
    categoria: 'Horarios',
    nombre: 'Sesiones Mensuales Mínimo (SES_M)',
    descripcion: 'Alias mínimo para casilleros estrechos',
    ejemplo: (_a, _c, cr) => String(getSesionesMensuales(cr)),
  },
  {
    etiqueta: '{SESIONES_SEMANALES}',
    categoria: 'Horarios',
    nombre: 'Cantidad de Sesiones Semanales (Número)',
    descripcion: 'Calculado según días activos del cronograma (ej. 5 o 3 o 2)',
    ejemplo: (_a, _c, cr) => String(getSesionesSemanales(cr)),
  },
  {
    etiqueta: '{SESIONES_MENSUALES}',
    categoria: 'Horarios',
    nombre: 'Cantidad de Sesiones Mensuales (Número)',
    descripcion: 'Calculado como sesiones semanales × 4 semanas (ej. 20 o 12 u 8)',
    ejemplo: (_a, _c, cr) => String(getSesionesMensuales(cr)),
  },
  {
    etiqueta: '{CANTIDAD_SESIONES_SEMANALES}',
    categoria: 'Horarios',
    nombre: 'Cantidad de Sesiones Semanales (Alias)',
    descripcion: 'Número de sesiones por semana según días activos (ej. 5)',
    ejemplo: (_a, _c, cr) => String(getSesionesSemanales(cr)),
  },
  {
    etiqueta: '{CANTIDAD_SESIONES_MENSUALES}',
    categoria: 'Horarios',
    nombre: 'Cantidad de Sesiones Mensuales (Alias)',
    descripcion: 'Número de sesiones por mes según semanas (ej. 20)',
    ejemplo: (_a, _c, cr) => String(getSesionesMensuales(cr)),
  },
  {
    etiqueta: '{SESIONES_SEMANALES_TEXTO}',
    categoria: 'Horarios',
    nombre: 'Sesiones Semanales con Texto',
    descripcion: 'Ej. 5 sesiones semanales',
    ejemplo: (_a, _c, cr) => `${getSesionesSemanales(cr)} sesiones semanales`,
  },
  {
    etiqueta: '{SESIONES_MENSUALES_TEXTO}',
    categoria: 'Horarios',
    nombre: 'Sesiones Mensuales con Texto',
    descripcion: 'Ej. 20 sesiones mensuales',
    ejemplo: (_a, _c, cr) => `${getSesionesMensuales(cr)} sesiones mensuales`,
  },
  {
    etiqueta: '{SESIONES_SEMANALES_LETRAS}',
    categoria: 'Horarios',
    nombre: 'Sesiones Semanales en Letras y Número',
    descripcion: 'Ej. CINCO (5)',
    ejemplo: (_a, _c, cr) => {
      const n = getSesionesSemanales(cr);
      return `${NUMEROS_A_LETRAS_SESIONES[n] || n} (${n})`;
    },
  },
  {
    etiqueta: '{SESIONES_MENSUALES_LETRAS}',
    categoria: 'Horarios',
    nombre: 'Sesiones Mensuales en Letras y Número',
    descripcion: 'Ej. VEINTE (20)',
    ejemplo: (_a, _c, cr) => {
      const n = getSesionesMensuales(cr);
      return `${NUMEROS_A_LETRAS_SESIONES[n] || n} (${n})`;
    },
  },
  {
    etiqueta: '{DIAS_SEMANA_CANTIDAD}',
    categoria: 'Horarios',
    nombre: 'Cantidad de Días a la Semana',
    descripcion: 'Cantidad de días con atención activa (ej. 5)',
    ejemplo: (_a, _c, cr) => String(getDiasActivosCronograma(cr)),
  },
  {
    etiqueta: '{DIAS_SEMANALES_TEXTO}',
    categoria: 'Horarios',
    nombre: 'Días Semanales con Texto',
    descripcion: 'Ej. 5 días por semana',
    ejemplo: (_a, _c, cr) => `${getDiasActivosCronograma(cr)} días por semana`,
  },

  // 3. FECHAS Y PERÍODOS (CON SOLO DESDE Y HASTA)
  {
    etiqueta: '{FECHA_DESDE}',
    categoria: 'Fechas',
    nombre: 'Fecha Período Desde (01/02/2027)',
    descripcion: 'Día inicial, mes y año en formato fecha numérica (ej. 01/02/2027)',
    ejemplo: (_a, c) => getFechaPeriodo(c.periodoDesde, c.anio, false),
  },
  {
    etiqueta: '{FECHA_HASTA}',
    categoria: 'Fechas',
    nombre: 'Fecha Período Hasta (31/12/2027)',
    descripcion: 'Último día del mes final con año en formato numérico (ej. 31/12/2027)',
    ejemplo: (_a, c) => getFechaPeriodo(c.periodoHasta, c.anio, true),
  },
  {
    etiqueta: '{PERIODO_DESDE_FECHA}',
    categoria: 'Fechas',
    nombre: 'Período Desde en Fecha (01/02/2027)',
    descripcion: 'Fecha completa de inicio de la cobertura (ej. 01/02/2027)',
    ejemplo: (_a, c) => getFechaPeriodo(c.periodoDesde, c.anio, false),
  },
  {
    etiqueta: '{PERIODO_HASTA_FECHA}',
    categoria: 'Fechas',
    nombre: 'Período Hasta en Fecha (31/12/2027)',
    descripcion: 'Fecha completa de finalización de cobertura (ej. 31/12/2027)',
    ejemplo: (_a, c) => getFechaPeriodo(c.periodoHasta, c.anio, true),
  },
  {
    etiqueta: '{PERIODO_FECHAS}',
    categoria: 'Fechas',
    nombre: 'Período en Fechas (01/02/2027 a 31/12/2027)',
    descripcion: 'Rango de fechas completo (ej. 01/02/2027 a 31/12/2027)',
    ejemplo: (_a, c) => `${getFechaPeriodo(c.periodoDesde, c.anio, false)} a ${getFechaPeriodo(c.periodoHasta, c.anio, true)}`,
  },
  {
    etiqueta: '{PERIODO_FECHAS_GUION}',
    categoria: 'Fechas',
    nombre: 'Período en Fechas con Guion (01/02/2027 - 31/12/2027)',
    descripcion: 'Rango de fechas separado con guion (ej. 01/02/2027 - 31/12/2027)',
    ejemplo: (_a, c) => `${getFechaPeriodo(c.periodoDesde, c.anio, false)} - ${getFechaPeriodo(c.periodoHasta, c.anio, true)}`,
  },
  {
    etiqueta: '{PERIODO_FECHAS_AL}',
    categoria: 'Fechas',
    nombre: 'Período en Fechas con "al" (01/02/2027 al 31/12/2027)',
    descripcion: 'Rango de fechas con la palabra al (ej. 01/02/2027 al 31/12/2027)',
    ejemplo: (_a, c) => `${getFechaPeriodo(c.periodoDesde, c.anio, false)} al ${getFechaPeriodo(c.periodoHasta, c.anio, true)}`,
  },
  {
    etiqueta: '{DESDE}',
    categoria: 'Fechas',
    nombre: 'Mes Desde (Solo texto del mes de inicio)',
    descripcion: 'Completa únicamente el mes desde, ej. FEBRERO',
    ejemplo: (_a, c) => c.periodoDesde || 'FEBRERO',
  },
  {
    etiqueta: '{HASTA}',
    categoria: 'Fechas',
    nombre: 'Mes Hasta (Solo texto del mes de finalización)',
    descripcion: 'Completa únicamente el mes hasta, ej. DICIEMBRE',
    ejemplo: (_a, c) => c.periodoHasta || 'DICIEMBRE',
  },
  {
    etiqueta: '{PERIODO_DESDE}',
    categoria: 'Fechas',
    nombre: 'Mes Desde (Período Cobertura)',
    descripcion: 'Mes inicial de cobertura',
    ejemplo: (_a, c) => c.periodoDesde || 'FEBRERO',
  },
  {
    etiqueta: '{PERIODO_HASTA}',
    categoria: 'Fechas',
    nombre: 'Mes Hasta (Período Cobertura)',
    descripcion: 'Mes final de cobertura',
    ejemplo: (_a, c) => c.periodoHasta || 'DICIEMBRE',
  },
  {
    etiqueta: '{PERIODO}',
    categoria: 'Fechas',
    nombre: 'Período Completo (Desde a Hasta Año)',
    descripcion: 'Ej. FEBRERO a DICIEMBRE (2027)',
    ejemplo: (_a, c) => `${c.periodoDesde} a ${c.periodoHasta} (${c.anio})`,
  },
  {
    etiqueta: '{ANIO}',
    categoria: 'Fechas',
    nombre: 'Ciclo Lectivo / Año',
    descripcion: 'Año del legajo',
    ejemplo: (_a, c) => c.anio || '2027',
  },
  {
    etiqueta: '{FECHA_EMISION}',
    categoria: 'Fechas',
    nombre: 'Lugar y Fecha de Emisión',
    descripcion: 'Localidad y fecha completa',
    ejemplo: (_a, c) => `${c.emisionLugar}, ${c.emisionFecha}`,
  },
  {
    etiqueta: '{FECHA_SOLA}',
    categoria: 'Fechas',
    nombre: 'Solo Fecha de Emisión (DD/MM/AAAA)',
    descripcion: 'Únicamente el día, mes y año',
    ejemplo: (_a, c) => c.emisionFecha || '30/09/2026',
  },
  {
    etiqueta: '{LUGAR_EMISION}',
    categoria: 'Fechas',
    nombre: 'Solo Localidad de Emisión',
    descripcion: 'Ciudad o municipio de la escuela',
    ejemplo: (_a, c) => c.emisionLugar || 'Ituzaingó',
  },

  // 4. DATOS DEL ALUMNO
  {
    etiqueta: '{APELLIDO_NOMBRE}',
    categoria: 'Alumno',
    nombre: 'Apellido y Nombres Completos',
    descripcion: 'Apellido en mayúsculas seguido de nombres',
    ejemplo: (a) => a.apellidoNombre || 'GÓMEZ PÉREZ, Joaquín Valentín',
  },
  {
    etiqueta: '{APELLIDO}',
    categoria: 'Alumno',
    nombre: 'Solo Apellido del Alumno',
    descripcion: 'Primer término antes de la coma',
    ejemplo: (a) => (a.apellidoNombre ? a.apellidoNombre.split(',')[0].trim() : 'GÓMEZ PÉREZ'),
  },
  {
    etiqueta: '{NOMBRES}',
    categoria: 'Alumno',
    nombre: 'Solo Nombres del Alumno',
    descripcion: 'Nombres después de la coma',
    ejemplo: (a) => (a.apellidoNombre && a.apellidoNombre.includes(',') ? a.apellidoNombre.split(',')[1].trim() : 'Joaquín Valentín'),
  },
  {
    etiqueta: '{DNI}',
    categoria: 'Alumno',
    nombre: 'DNI con Puntos',
    descripcion: 'Número de documento con separador de miles',
    ejemplo: (a) => a.dni || '48.912.455',
  },
  {
    etiqueta: '{DNI_SIN_PUNTOS}',
    categoria: 'Alumno',
    nombre: 'DNI sin Puntos (Solo Números)',
    descripcion: 'DNI limpio de caracteres para casillas numéricas',
    ejemplo: (a) => (a.dni ? a.dni.replace(/\D/g, '') : '48912455'),
  },
  {
    etiqueta: '{AFILIADO}',
    categoria: 'Alumno',
    nombre: 'N° de Afiliado / Socio Alumno',
    descripcion: 'Número de credencial del menor',
    ejemplo: (a) => a.numAfiliado || '01-48912455/02',
  },
  {
    etiqueta: '{OBRA_SOCIAL_Y_AFILIADO}',
    categoria: 'Alumno',
    nombre: 'Obra Social + N° Afiliado Completo',
    descripcion: 'Ej. OSDE - Afiliado N°: 01-48912455/02',
    ejemplo: (a, c) => `${c.obraSocial || 'OSDE'} - Afiliado N°: ${a.numAfiliado || '01-48912455/02'}`,
  },
  {
    etiqueta: '{OS_Y_AFILIADO_CORTO}',
    categoria: 'Alumno',
    nombre: 'Obra Social (N° Afiliado)',
    descripcion: 'Ej. OSDE (01-48912455/02)',
    ejemplo: (a, c) => `${c.obraSocial || 'OSDE'} (${a.numAfiliado || '01-48912455/02'})`,
  },
  {
    etiqueta: '{OS_Y_AFILIADO_GUION}',
    categoria: 'Alumno',
    nombre: 'Obra Social - N° Afiliado con Guion',
    descripcion: 'Ej. OSDE - 01-48912455/02',
    ejemplo: (a, c) => `${c.obraSocial || 'OSDE'} - ${a.numAfiliado || '01-48912455/02'}`,
  },
  {
    etiqueta: '{FECHA_NACIMIENTO}',
    categoria: 'Alumno',
    nombre: 'Fecha de Nacimiento',
    descripcion: 'Fecha natal del alumno',
    ejemplo: (a) => a.fechaNacimiento || '15/04/2017',
  },
  {
    etiqueta: '{EDAD}',
    categoria: 'Alumno',
    nombre: 'Edad con Texto ("X años")',
    descripcion: 'Edad calculada con la palabra años',
    ejemplo: (a) => `${a.edad || '9'} años`,
  },
  {
    etiqueta: '{EDAD_NUMERO}',
    categoria: 'Alumno',
    nombre: 'Edad Solo Número',
    descripcion: 'Únicamente el dígito de edad',
    ejemplo: (a) => `${a.edad || '9'}`,
  },
  {
    etiqueta: '{DIAGNOSTICO}',
    categoria: 'Alumno',
    nombre: 'Diagnóstico CUD Completo',
    descripcion: 'Patología y código CIE-10',
    ejemplo: (a) => a.diagnostico || 'Trastorno del Espectro Autista (F84.0) - CUD Vigente',
  },
  {
    etiqueta: '{DIAGNOSTICO_CORTO}',
    categoria: 'Alumno',
    nombre: 'Diagnóstico Breve',
    descripcion: 'Diagnóstico resumido para renglón corto',
    ejemplo: (a) => (a.diagnostico ? a.diagnostico.split('-')[0].trim() : 'TEA (F84.0)'),
  },

  // 3. ESCUELA COMÚN E INTEGRACIÓN
  {
    etiqueta: '{ESCUELA_COMUN}',
    categoria: 'Escuela Común',
    nombre: 'Escuela Común Inclusora',
    descripcion: 'Establecimiento educativo al que asiste',
    ejemplo: (a) => a.escuelaComun || 'Colegio Belgrano Day School (EP N° 14)',
  },
  {
    etiqueta: '{DIRECCION_ESCUELA}',
    categoria: 'Escuela Común',
    nombre: 'Dirección Escuela Común',
    descripcion: 'Calle y número de la escuela inclusora',
    ejemplo: (a) => a.direccionEscuela || 'Calle Zufriategui 840, Ituzaingó',
  },
  {
    etiqueta: '{GRADO}',
    categoria: 'Escuela Común',
    nombre: 'Grado / Sala / Año',
    descripcion: 'Nivel pedagógico que cursa',
    ejemplo: (a) => a.grado || '4° Grado',
  },
  {
    etiqueta: '{TURNO}',
    categoria: 'Escuela Común',
    nombre: 'Turno Escolar',
    descripcion: 'Mañana, Tarde o Doble',
    ejemplo: (a) => a.turno || 'Mañana',
  },
  {
    etiqueta: '{GRADO_TURNO}',
    categoria: 'Escuela Común',
    nombre: 'Grado y Turno Juntos',
    descripcion: 'Ej. 4° Grado (Mañana)',
    ejemplo: (a) => `${a.grado || '4° Grado'} (${a.turno || 'Mañana'})`,
  },

  // 4. DATOS DEL TITULAR
  {
    etiqueta: '{TITULAR}',
    categoria: 'Titular',
    nombre: 'Nombre del Titular a Cargo',
    descripcion: 'Padre, Madre o Tutor Legal',
    ejemplo: (a) => a.nombreTitular || 'PÉREZ, Marcela Alejandra',
  },
  {
    etiqueta: '{DNI_TITULAR}',
    categoria: 'Titular',
    nombre: 'DNI del Titular',
    descripcion: 'Documento del adulto responsable',
    ejemplo: (a) => a.dniTitular || '32.458.712',
  },
  {
    etiqueta: '{PARENTESCO}',
    categoria: 'Titular',
    nombre: 'Parentesco',
    descripcion: 'Madre, Padre o Tutor Legal',
    ejemplo: (a) => a.parentesco || 'Madre',
  },
  {
    etiqueta: '{NUM_AFILIADO_TITULAR}',
    categoria: 'Titular',
    nombre: 'N° Afiliado Titular',
    descripcion: 'Credencial titular',
    ejemplo: (a) => a.numAfiliadoTitular || '01-48912455/00',
  },

  // 5. ARANCELES Y RESOLUCIÓN
  {
    etiqueta: '{VALOR_CUOTA}',
    categoria: 'Aranceles',
    nombre: 'Valor Cuota con Signo $',
    descripcion: 'Formato monetario argentino completo',
    ejemplo: (_a, c) => formatearMoneda(c.matriculaCuota),
  },
  {
    etiqueta: '{VALOR_CUOTA_SIN_SIGNO}',
    categoria: 'Aranceles',
    nombre: 'Valor Cuota sin Signo $',
    descripcion: 'Solo el monto numérico con comas',
    ejemplo: (_a, c) => (c.matriculaCuota ? c.matriculaCuota.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '770.043,58'),
  },
  {
    etiqueta: '{MONTO_LETRAS}',
    categoria: 'Aranceles',
    nombre: 'Arancel en Letras Reglamentario',
    descripcion: 'PESOS ... CON .../100 para auditoría médica',
    ejemplo: (_a, c) => numeroALetras(c.matriculaCuota),
  },
  {
    etiqueta: '{CUOTA_Y_LETRAS}',
    categoria: 'Aranceles',
    nombre: 'Cuota + Cuota en Letras ($ y Letras)',
    descripcion: 'Monto numérico y en letras: $ 770.043,58 (PESOS ...)',
    ejemplo: (_a, c) => `${formatearMoneda(c.matriculaCuota)} (${numeroALetras(c.matriculaCuota)})`,
  },
  {
    etiqueta: '{VALOR_CUOTA_Y_LETRAS}',
    categoria: 'Aranceles',
    nombre: 'Valor Cuota y Arancel en Letras',
    descripcion: 'Monto y letras entre paréntesis para presupuestos oficiales',
    ejemplo: (_a, c) => `${formatearMoneda(c.matriculaCuota)} (${numeroALetras(c.matriculaCuota)})`,
  },
  {
    etiqueta: '{CUOTA_LETRAS_GUION}',
    categoria: 'Aranceles',
    nombre: 'Cuota - Cuota en Letras con Guion',
    descripcion: 'Ej. $ 770.043,58 - PESOS SETECIENTOS SETENTA MIL...',
    ejemplo: (_a, c) => `${formatearMoneda(c.matriculaCuota)} - ${numeroALetras(c.matriculaCuota)}`,
  },
  {
    etiqueta: '{RESOLUCION}',
    categoria: 'Aranceles',
    nombre: 'Resolución Ministerial Nomenclador',
    descripcion: 'Número y mes de resolución vigente',
    ejemplo: (_a, c) => c.resolucionMes || '3487/2026 SEPTIEMBRE',
  },

  // 6. DATOS DE LA INSTITUCIÓN / ESCUELA ESPECIAL (Ideal para CAR y Presupuestos)
  {
    etiqueta: '{RAZON_SOCIAL}',
    categoria: 'Institución',
    nombre: 'Razón Social (FLORES DE LELOIR S.A.)',
    descripcion: 'Razón social oficial de la entidad propietaria (FLORES DE LELOIR S.A.)',
    ejemplo: (_a, _c, _cr, esc) => esc?.razonSocial || 'FLORES DE LELOIR S.A.',
  },
  {
    etiqueta: '{RAZON_SOCIAL_Y_CUIT}',
    categoria: 'Institución',
    nombre: 'Razón Social + CUIT Completo',
    descripcion: 'Ej. FLORES DE LELOIR S.A. - CUIT: 30-71458921-9',
    ejemplo: (_a, _c, _cr, esc) => `${esc?.razonSocial || 'FLORES DE LELOIR S.A.'} - CUIT: ${esc?.cuit || '30-71458921-9'}`,
  },
  {
    etiqueta: '{RAZON_SOCIAL_CUIT_PARENTESIS}',
    categoria: 'Institución',
    nombre: 'Razón Social (CUIT)',
    descripcion: 'Ej. FLORES DE LELOIR S.A. (CUIT 30-71458921-9)',
    ejemplo: (_a, _c, _cr, esc) => `${esc?.razonSocial || 'FLORES DE LELOIR S.A.'} (CUIT ${esc?.cuit || '30-71458921-9'})`,
  },
  {
    etiqueta: '{INSTITUCION}',
    categoria: 'Institución',
    nombre: 'Nombre de la Escuela Especial',
    descripcion: 'Razón social institucional oficial (ej. ESCUELA ESPECIAL JUNTOS)',
    ejemplo: (_a, _c, _cr, esc) => esc?.nombreInstitucion || 'ESCUELA ESPECIAL DE RECUPERACIÓN JUNTOS',
  },
  {
    etiqueta: '{NUMERO_INSTITUCION}',
    categoria: 'Institución',
    nombre: 'N° DIPREGEP / CUE Escuela',
    descripcion: 'Número de habilitación o registro escolar',
    ejemplo: (_a, _c, _cr, esc) => esc?.numeroInstitucion || 'DIPREGEP N° 4580',
  },
  {
    etiqueta: '{CUIT_INSTITUCION}',
    categoria: 'Institución',
    nombre: 'CUIT Escuela Especial',
    descripcion: 'Clave única de identificación tributaria institucional',
    ejemplo: (_a, _c, _cr, esc) => esc?.cuit || '30-71458922-4',
  },
  {
    etiqueta: '{DIRECTORA}',
    categoria: 'Institución',
    nombre: 'Nombre de la Directora',
    descripcion: 'Autoridad directiva a cargo de la institución',
    ejemplo: (_a, _c, _cr, esc) => esc?.nombreDirectora || 'Lic. Silvina Alejandra Martínez',
  },
  {
    etiqueta: '{CARGO_DIRECTORA}',
    categoria: 'Institución',
    nombre: 'Cargo Directiva',
    descripcion: 'Cargo oficial (ej. Directora General)',
    ejemplo: (_a, _c, _cr, esc) => esc?.cargoDirectora || 'Directora General',
  },
  {
    etiqueta: '{DIRECCION_INSTITUCION}',
    categoria: 'Institución',
    nombre: 'Dirección Escuela Especial',
    descripcion: 'Calle y altura física del establecimiento especial',
    ejemplo: (_a, _c, _cr, esc) => esc?.direccion || 'Calle Mansilla 845',
  },
  {
    etiqueta: '{LOCALIDAD_ESCUELA_JUNTOS}',
    categoria: 'Institución',
    nombre: 'Localidad Escuela Especial',
    descripcion: 'Municipio o localidad de la sede especial',
    ejemplo: (_a, _c, _cr, esc) => esc?.localidad || 'Ituzaingó',
  },
  {
    etiqueta: '{TELEFONO_ESCUELA}',
    categoria: 'Institución',
    nombre: 'Teléfono Escuela Especial',
    descripcion: 'Contacto telefónico institucional',
    ejemplo: (_a, _c, _cr, esc) => esc?.telefono || '011 4624-9988',
  },
  {
    etiqueta: '{EMAIL_ESCUELA}',
    categoria: 'Institución',
    nombre: 'Email Escuela Especial',
    descripcion: 'Correo electrónico de secretaría escolar',
    ejemplo: (_a, _c, _cr, esc) => esc?.email || 'contacto@institutoespecialjuntos.edu.ar',
  },
  {
    etiqueta: '{NUMERO_HABILITACION}',
    categoria: 'Institución',
    nombre: 'Registro Provincial / SNR Disposición',
    descripcion: 'Resolución de categorización y habilitación nacional',
    ejemplo: (_a, _c, _cr, esc) => esc?.resolucionHabilitacion || 'SNR Disp. 1042/18 - Categoría "A"',
  },
];

export const FormulariosManagerModal: React.FC<FormulariosManagerModalProps> = ({
  isOpen,
  onClose,
  alumno,
  config,
  cronograma = DEFAULT_CRONOGRAMA,
}) => {
  const obrasSociales = getObrasSociales();
  const [formularios, setFormularios] = useState<FormularioCustomModel[]>(getFormulariosCustom);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [currentForm, setCurrentForm] = useState<FormularioCustomModel | null>(null);

  // Canvas & PDF state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [pdfDocProxy, setPdfDocProxy] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.1);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 595, height: 842 });
  
  // Tag palette state
  const [selectedTagToAdd, setSelectedTagToAdd] = useState<string>(TODAS_LAS_ETIQUETAS[0].etiqueta);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todas');
  const [busquedaEtiqueta, setBusquedaEtiqueta] = useState<string>('');
  const [isLivePreviewMode, setIsLivePreviewMode] = useState<boolean>(false);
  const [draggingTagId, setDraggingTagId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // New form upload dialog
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNombre, setUploadNombre] = useState<string>('');
  const [uploadTipo, setUploadTipo] = useState<'fijo_juntos' | 'obra_social'>('fijo_juntos');
  const [uploadObraSocial, setUploadObraSocial] = useState<string>(config.obraSocial || 'OSDE');
  const [uploadRol, setUploadRol] = useState<RolDocumentoFijo>('presupuesto');
  const [uploadPrestacion, setUploadPrestacion] = useState<PrestacionFijo>('todas');
  const [uploadNivel, setUploadNivel] = useState<NivelFijo>('todos');
  const [detectedSummary, setDetectedSummary] = useState<string>('');
  const [filtroGestionRol, setFiltroGestionRol] = useState<string>('todos');

  const escuela = getEscuelaConfig();

  // Form deletion & management dialogs
  const [formToDelete, setFormToDelete] = useState<FormularioCustomModel | null>(null);
  const [showManageFormsModal, setShowManageFormsModal] = useState<boolean>(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string>('');

  // Load first form when opened
  useEffect(() => {
    if (!isOpen) return;
    ensureFormulariosLoaded().then((list) => {
      setFormularios(list);
      if (list.length > 0 && (!selectedFormId || !list.some((f) => f.id === selectedFormId))) {
        setSelectedFormId(list[0].id);
        setCurrentForm(list[0]);
      }
    });
  }, [isOpen, selectedFormId]);

  // When selectedFormId changes
  useEffect(() => {
    const found = formularios.find((f) => f.id === selectedFormId);
    if (found) {
      setCurrentForm({ ...found });
      setCurrentPage(1);
    }
  }, [selectedFormId, formularios]);

  // Load PDF into pdfjs when currentForm changes
  useEffect(() => {
    if (!currentForm) return;

    let isMounted = true;
    async function loadPdf() {
      try {
        let pdfData: Uint8Array;

        if (currentForm?.pdfBase64 && currentForm.pdfBase64.includes('base64,')) {
          const b64 = currentForm.pdfBase64.split('base64,')[1];
          const binary = window.atob(b64);
          pdfData = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            pdfData[i] = binary.charCodeAt(i);
          }
        } else {
          // Create dummy template document if no file was uploaded
          const dummy = await PDFDocument.create();
          const page = dummy.addPage([595.28, 841.89]);
          const font = await dummy.embedFont(StandardFonts.HelveticaBold);
          page.drawRectangle({
            x: 40,
            y: 770,
            width: 515,
            height: 40,
            color: rgb(0.9, 0.94, 0.98),
            borderColor: rgb(0.2, 0.4, 0.7),
            borderWidth: 1,
          });
          page.drawText(`${currentForm?.nombre?.toUpperCase() || 'FORMULARIO OFICIAL'} - ${currentForm?.obraSocial || ''}`, {
            x: 50,
            y: 785,
            size: 11,
            font,
            color: rgb(0.1, 0.2, 0.5),
          });
          pdfData = await dummy.save();
        }

        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const proxy = await loadingTask.promise;
        if (!isMounted) return;
        setPdfDocProxy(proxy);
        setTotalPages(proxy.numPages);
      } catch (err) {
        console.error('Error cargando PDF en canvas:', err);
      }
    }

    loadPdf();
    return () => {
      isMounted = false;
    };
  }, [currentForm?.id, currentForm?.pdfBase64]);

  // Render current page to Canvas
  useEffect(() => {
    if (!pdfDocProxy || !canvasRef.current) return;

    let renderTask: any = null;
    async function renderPage() {
      try {
        const page = await pdfDocProxy.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        setPageSize({
          width: viewport.width / scale,
          height: viewport.height / scale,
        });

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Error renderizando página de PDF:', err);
        }
      }
    }

    renderPage();
    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDocProxy, currentPage, scale]);

  if (!isOpen) return null;

  // Add tag to the current page by clicking on canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentForm || draggingTagId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const unscaledX = clickX / scale;
    const unscaledY = clickY / scale;

    const pdfX = Math.round(unscaledX);
    const pdfY = Math.round(pageSize.height - unscaledY);

    const tagObj = TODAS_LAS_ETIQUETAS.find((t) => t.etiqueta === selectedTagToAdd);

    const nuevoCampo: CampoEtiqueta = {
      id: 'tag-' + Date.now(),
      etiqueta: selectedTagToAdd,
      nombreHumano: tagObj?.nombre || selectedTagToAdd,
      pageIndex: currentPage - 1,
      x: pdfX,
      y: pdfY,
      fontSize: 9,
    };

    const updated = {
      ...currentForm,
      campos: [...currentForm.campos, nuevoCampo],
    };

    setCurrentForm(updated);
    saveFormularioCustom(updated);
  };

  // Add tag to center of current page
  const handleColocarEnCentro = (etiquetaElegida: string) => {
    if (!currentForm) return;

    const tagObj = TODAS_LAS_ETIQUETAS.find((t) => t.etiqueta === etiquetaElegida);
    const nuevoCampo: CampoEtiqueta = {
      id: 'tag-' + Date.now(),
      etiqueta: etiquetaElegida,
      nombreHumano: tagObj?.nombre || etiquetaElegida,
      pageIndex: currentPage - 1,
      x: Math.round(pageSize.width / 2) - 60,
      y: Math.round(pageSize.height / 2),
      fontSize: 9,
    };

    const updated = {
      ...currentForm,
      campos: [...currentForm.campos, nuevoCampo],
    };

    setCurrentForm(updated);
    saveFormularioCustom(updated);
  };

  // Drag and Drop handlers for tags
  const handleTagMouseDown = (e: React.MouseEvent, tagId: string, currentLeft: number, currentTop: number) => {
    e.stopPropagation();
    if (!canvasContainerRef.current) return;
    const canvasRect = canvasContainerRef.current.getBoundingClientRect();
    setDraggingTagId(tagId);
    setDragOffset({
      x: e.clientX - canvasRect.left - currentLeft,
      y: e.clientY - canvasRect.top - currentTop,
    });
  };

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingTagId || !currentForm || !canvasContainerRef.current) return;

    const canvasRect = canvasContainerRef.current.getBoundingClientRect();
    const newLeft = e.clientX - canvasRect.left - dragOffset.x;
    const newTop = e.clientY - canvasRect.top - dragOffset.y;

    const unscaledX = newLeft / scale;
    const unscaledY = newTop / scale;

    const newPdfX = Math.round(unscaledX);
    const newPdfY = Math.round(pageSize.height - unscaledY);

    const updatedCampos = currentForm.campos.map((c) => {
      if (c.id === draggingTagId) {
        return { ...c, x: newPdfX, y: newPdfY };
      }
      return c;
    });

    setCurrentForm({ ...currentForm, campos: updatedCampos });
  };

  const handleContainerMouseUp = () => {
    if (draggingTagId && currentForm) {
      saveFormularioCustom(currentForm);
    }
    setDraggingTagId(null);
  };

  // Save current form changes to persistent storage
  const handleGuardarCambios = () => {
    if (!currentForm) return;
    const updated = saveFormularioCustom(currentForm);
    setFormularios(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // Change Obra Social of the selected form
  const handleCambiarObraSocial = (nuevaOs: string) => {
    if (!currentForm) return;
    const updated: FormularioCustomModel = {
      ...currentForm,
      obraSocial: nuevaOs,
      tipoFormulario: 'obra_social',
      descripcion: `Formulario oficial de ${nuevaOs}`,
    };
    setCurrentForm(updated);
    const saved = saveFormularioCustom(updated);
    setFormularios(saved);
  };

  // Switch form between Fixed School Form (JUNTOS) and Obra Social form
  const handleCambiarTipoFormulario = (nuevoTipo: 'fijo_juntos' | 'obra_social') => {
    if (!currentForm) return;
    const isFijo = nuevoTipo === 'fijo_juntos';
    const effectiveMeta = getFormularioEffectiveMeta(currentForm);
    const rol = isFijo ? (currentForm.rolDocumento || effectiveMeta.rolDocumento) : undefined;
    const prestacion = isFijo ? (currentForm.prestacionFijo || effectiveMeta.prestacionFijo) : undefined;
    const nivel = isFijo ? (currentForm.nivelFijo || effectiveMeta.nivelFijo) : undefined;

    const updated: FormularioCustomModel = {
      ...currentForm,
      tipoFormulario: nuevoTipo,
      rolDocumento: rol,
      prestacionFijo: prestacion,
      nivelFijo: nivel,
      obraSocial: isFijo ? 'JUNTOS (Fijo Escuela)' : config.obraSocial || 'OSDE',
      descripcion: isFijo
        ? `${LABELS_ROL_DOCUMENTO[rol || 'presupuesto']} - ${LABELS_PRESTACION_FIJO[prestacion || 'todas']}`
        : `Formulario oficial de ${config.obraSocial || 'OSDE'}`,
    };
    setCurrentForm(updated);
    const saved = saveFormularioCustom(updated);
    setFormularios(saved);
  };

  const handleCambiarRolDocumento = (nuevoRol: RolDocumentoFijo) => {
    if (!currentForm) return;
    const meta = getFormularioEffectiveMeta(currentForm);
    const updated: FormularioCustomModel = {
      ...currentForm,
      rolDocumento: nuevoRol,
      descripcion: `${LABELS_ROL_DOCUMENTO[nuevoRol]} - ${LABELS_PRESTACION_FIJO[currentForm.prestacionFijo || meta.prestacionFijo]}`,
    };
    setCurrentForm(updated);
    const saved = saveFormularioCustom(updated);
    setFormularios(saved);
  };

  const handleCambiarPrestacionFijo = (nuevaPrestacion: PrestacionFijo) => {
    if (!currentForm) return;
    const meta = getFormularioEffectiveMeta(currentForm);
    const preservesNivel =
      nuevaPrestacion === 'integracion' ||
      nuevaPrestacion === 'ae' ||
      nuevaPrestacion === 'integracion_ae';
    const updated: FormularioCustomModel = {
      ...currentForm,
      prestacionFijo: nuevaPrestacion,
      nivelFijo: preservesNivel ? (currentForm.nivelFijo || 'todos') : 'todos',
      descripcion: `${LABELS_ROL_DOCUMENTO[currentForm.rolDocumento || meta.rolDocumento]} - ${LABELS_PRESTACION_FIJO[nuevaPrestacion]}`,
    };
    setCurrentForm(updated);
    const saved = saveFormularioCustom(updated);
    setFormularios(saved);
  };

  const handleCambiarNivelFijo = (nuevoNivel: NivelFijo) => {
    if (!currentForm) return;
    const updated: FormularioCustomModel = {
      ...currentForm,
      nivelFijo: nuevoNivel,
    };
    setCurrentForm(updated);
    const saved = saveFormularioCustom(updated);
    setFormularios(saved);
  };

  // Delete a tag
  const handleEliminarCampo = (tagId: string) => {
    if (!currentForm) return;
    const updated = {
      ...currentForm,
      campos: currentForm.campos.filter((c) => c.id !== tagId),
    };
    setCurrentForm(updated);
    saveFormularioCustom(updated);
  };

  // Delete a full form from persistent storage
  const handleConfirmDeleteForm = () => {
    if (!formToDelete) return;
    const deletedId = formToDelete.id;
    const deletedName = formToDelete.nombre;
    const updated = deleteFormularioCustom(deletedId);
    setFormularios(updated);
    setFormToDelete(null);

    if (selectedFormId === deletedId) {
      if (updated.length > 0) {
        setSelectedFormId(updated[0].id);
        setCurrentForm({ ...updated[0] });
      } else {
        setSelectedFormId('');
        setCurrentForm(null);
        setPdfDocProxy(null);
      }
    }
    setDeleteSuccessMessage(`El formulario "${deletedName}" fue eliminado correctamente.`);
    setTimeout(() => setDeleteSuccessMessage(''), 3500);
  };

  // Upload new form confirm
  const handleConfirmUpload = () => {
    if (!uploadFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const isFijo = uploadTipo === 'fijo_juntos';
      const rol = isFijo ? uploadRol : 'general';
      const prestacion = isFijo ? (uploadRol === 'car' ? 'todas' : uploadPrestacion) : 'todas';
      const nivel = isFijo ? uploadNivel : 'todos';

      const nuevo: FormularioCustomModel = {
        id: 'form-' + Date.now(),
        nombre: uploadNombre || uploadFile.name.replace(/\.pdf$/i, ''),
        tipoFormulario: uploadTipo,
        rolDocumento: isFijo ? rol : undefined,
        prestacionFijo: isFijo ? prestacion : undefined,
        nivelFijo: isFijo ? nivel : undefined,
        obraSocial: isFijo ? 'JUNTOS (Fijo Escuela)' : uploadObraSocial,
        descripcion: isFijo
          ? `${LABELS_ROL_DOCUMENTO[rol]} - ${LABELS_PRESTACION_FIJO[prestacion]}`
          : `Formulario oficial de ${uploadObraSocial}`,
        pdfBase64: dataUrl,
        fechaSubida: new Date().toLocaleDateString('es-AR'),
        campos: [],
      };

      try {
        const updated = saveFormularioCustom(nuevo);
        setFormularios(updated);
        setSelectedFormId(nuevo.id);
        setCurrentForm(nuevo);
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadNombre('');
        setUploadTipo('fijo_juntos');
        setDetectedSummary('');
      } catch (err: any) {
        console.error('Error al guardar formulario custom:', err);
        alert('Hubo un error al procesar el archivo. Por favor reintente.');
      }
    };
    reader.readAsDataURL(uploadFile);
  };

  // Download test filled PDF
  const handleDescargarPrueba = async () => {
    if (!currentForm) return;

    try {
      let pdfBytes: Uint8Array;
      if (currentForm.pdfBase64 && currentForm.pdfBase64.includes('base64,')) {
        const b64 = currentForm.pdfBase64.split('base64,')[1];
        const binary = window.atob(b64);
        pdfBytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          pdfBytes[i] = binary.charCodeAt(i);
        }
      } else {
        alert('Este formulario aún no tiene un archivo PDF base cargado.');
        return;
      }

      const doc = await PDFDocument.load(pdfBytes);
      const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const pages = doc.getPages();

      for (const campo of currentForm.campos) {
        if (campo.pageIndex >= pages.length) continue;
        const page = pages[campo.pageIndex];

        let valor = '';
        const tagItem = TODAS_LAS_ETIQUETAS.find((t) => t.etiqueta === campo.etiqueta);
        if (tagItem) {
          valor = tagItem.ejemplo(alumno, config, cronograma, escuela);
        }

        if (valor) {
          const limpio = cleanWinAnsi(valor);
          const isBold =
            campo.etiqueta.includes('VALOR') ||
            campo.etiqueta.includes('CUOTA') ||
            campo.etiqueta.includes('CORTA') ||
            campo.etiqueta.includes('CORTO') ||
            campo.etiqueta.includes('FECHA') ||
            campo.etiqueta.includes('HORARIO') ||
            campo.etiqueta.includes('RAZON') ||
            campo.etiqueta === '{DESDE}' ||
            campo.etiqueta === '{HASTA}' ||
            campo.etiqueta.includes('SES') ||
            campo.etiqueta.length <= 6;

          const font = isBold ? fontBold : fontRegular;

          page.drawText(limpio, {
            x: campo.x,
            y: campo.y,
            size: campo.fontSize,
            font: font,
            color: rgb(0.05, 0.15, 0.5), // Tinta azul
          });
        }
      }

      const finalBytes = await doc.save();
      const blob = new Blob([finalBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Prueba_${currentForm.obraSocial}_${alumno.dni.replace(/\D/g, '')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generando PDF de prueba:', err);
    }
  };

  const camposDeEstaPagina = currentForm?.campos.filter((c) => c.pageIndex === currentPage - 1) || [];

  // Filter tags in palette
  const etiquetasFiltradas = TODAS_LAS_ETIQUETAS.filter((t) => {
    const matchCat = categoriaFiltro === 'Todas' || t.categoria === categoriaFiltro;
    const matchBusqueda =
      !busquedaEtiqueta.trim() ||
      t.etiqueta.toLowerCase().includes(busquedaEtiqueta.toLowerCase()) ||
      t.nombre.toLowerCase().includes(busquedaEtiqueta.toLowerCase()) ||
      t.descripcion.toLowerCase().includes(busquedaEtiqueta.toLowerCase());
    return matchCat && matchBusqueda;
  });

  const CATEGORIAS = ['Todas', 'Horarios', 'Fechas', 'Prestación', 'Alumno', 'Escuela Común', 'Titular', 'Aranceles', 'Institución'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs select-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[97vw] h-[95vh] flex flex-col overflow-hidden border border-gray-300">
        {/* Top Header */}
        <div className="bg-blue-900 text-white px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-blue-800 rounded text-blue-200">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </span>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>Diseñador Visual de Formularios PDF • Arrastrar Etiquetas en Tiempo Real</span>
              </h2>
              <p className="text-[11px] text-blue-200">
                Elegí cualquier etiqueta de la derecha y arrastrala directamente con el mouse sobre el renglón correspondiente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDescargarPrueba}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition"
              title="Descargar este formulario completado con el alumno actual"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF Relleno</span>
            </button>

            <button
              type="button"
              onClick={handleGuardarCambios}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold shadow-xs transition"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Coordenadas</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-800 rounded transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Deletion / Notification Toast */}
        {deleteSuccessMessage && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shrink-0 shadow-inner animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{deleteSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setDeleteSuccessMessage('')}
              className="text-emerald-100 hover:text-white p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Toolbar Bar */}
        <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Form Selector & Obra Social Switcher */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="font-bold text-gray-700">Formulario:</label>
              <select
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
                className="px-2.5 py-1 border border-gray-300 rounded bg-white font-medium max-w-xs truncate"
              >
                {formularios.some((f) => (f.tipoFormulario === 'fijo_juntos' || f.obraSocial.includes('JUNTOS')) && getFormularioEffectiveMeta(f).rolDocumento === 'presupuesto') && (
                  <optgroup label="📄 PRESUPUESTOS OFICIALES (DISCRIMINADOS)">
                    {formularios
                      .filter((f) => (f.tipoFormulario === 'fijo_juntos' || f.obraSocial.includes('JUNTOS')) && getFormularioEffectiveMeta(f).rolDocumento === 'presupuesto')
                      .map((f) => {
                        const meta = getFormularioEffectiveMeta(f);
                        const pBadge =
                          meta.prestacionFijo === 'ae'
                            ? 'AE'
                            : meta.prestacionFijo === 'integracion'
                            ? 'INTEGRACIÓN'
                            : meta.prestacionFijo.toUpperCase();
                        return (
                          <option key={f.id} value={f.id}>
                            📄 {f.nombre} • [{pBadge}]
                          </option>
                        );
                      })}
                  </optgroup>
                )}

                {formularios.some((f) => (f.tipoFormulario === 'fijo_juntos' || f.obraSocial.includes('JUNTOS')) && getFormularioEffectiveMeta(f).rolDocumento === 'plan_trabajo') && (
                  <optgroup label="📋 PLANES DE TRABAJO (DISCRIMINADOS)">
                    {formularios
                      .filter((f) => (f.tipoFormulario === 'fijo_juntos' || f.obraSocial.includes('JUNTOS')) && getFormularioEffectiveMeta(f).rolDocumento === 'plan_trabajo')
                      .map((f) => {
                        const meta = getFormularioEffectiveMeta(f);
                        const pBadge =
                          meta.prestacionFijo === 'ae'
                            ? 'AE'
                            : meta.prestacionFijo === 'integracion'
                            ? 'INTEGRACIÓN'
                            : meta.prestacionFijo.toUpperCase();
                        const niv = meta.nivelFijo && meta.nivelFijo !== 'todos' ? ` (${meta.nivelFijo})` : '';
                        return (
                          <option key={f.id} value={f.id}>
                            📋 {f.nombre} • [{pBadge}{niv}]
                          </option>
                        );
                      })}
                  </optgroup>
                )}

                {formularios.some((f) => (f.tipoFormulario === 'fijo_juntos' || f.obraSocial.includes('JUNTOS')) && getFormularioEffectiveMeta(f).rolDocumento === 'car') && (
                  <optgroup label="🎓 CONSTANCIAS ALUMNO REGULAR (CAR)">
                    {formularios
                      .filter((f) => (f.tipoFormulario === 'fijo_juntos' || f.obraSocial.includes('JUNTOS')) && getFormularioEffectiveMeta(f).rolDocumento === 'car')
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          🎓 {f.nombre} (Aplica a Todos)
                        </option>
                      ))}
                  </optgroup>
                )}

                {formularios.some((f) => (f.tipoFormulario === 'fijo_juntos' || f.obraSocial.includes('JUNTOS')) && getFormularioEffectiveMeta(f).rolDocumento === 'general') && (
                  <optgroup label="📁 OTROS FORMULARIOS FIJOS JUNTOS">
                    {formularios
                      .filter((f) => (f.tipoFormulario === 'fijo_juntos' || f.obraSocial.includes('JUNTOS')) && getFormularioEffectiveMeta(f).rolDocumento === 'general')
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          📁 {f.nombre} (Institucional)
                        </option>
                      ))}
                  </optgroup>
                )}

                {formularios.filter((f) => f.tipoFormulario !== 'fijo_juntos' && !f.obraSocial.includes('JUNTOS')).length > 0 && (
                  <optgroup label="🏥 FORMULARIOS POR OBRA SOCIAL">
                    {formularios
                      .filter((f) => f.tipoFormulario !== 'fijo_juntos' && !f.obraSocial.includes('JUNTOS'))
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          🏥 {f.nombre} ({f.obraSocial})
                        </option>
                      ))}
                  </optgroup>
                )}
                {formularios.length === 0 && <option value="">Sin formularios cargados</option>}
              </select>

              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shadow-xs transition"
                title="Subir un nuevo formulario PDF"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Subir PDF</span>
              </button>

              {currentForm && (
                <button
                  type="button"
                  onClick={() => setFormToDelete(currentForm)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-300 rounded font-medium shadow-2xs transition"
                  title={`Eliminar el formulario "${currentForm.nombre}"`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Eliminar Form</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowManageFormsModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded font-medium shadow-2xs transition"
                title="Ver y administrar todos los formularios"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Gestionar ({formularios.length})</span>
              </button>
            </div>

            {/* Change Obra Social / Tipo inline */}
            {currentForm && (
              <div className="flex items-center gap-2 pl-3 border-l border-gray-300 flex-wrap">
                {currentForm.tipoFormulario === 'fijo_juntos' || currentForm.obraSocial.includes('JUNTOS') ? (
                  (() => {
                    const meta = getFormularioEffectiveMeta(currentForm);
                    const aplicaActual = formularioAplicaAAlumno(currentForm, config);
                    return (
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Selector de Rol */}
                        <div className="flex items-center gap-1">
                          <label className="font-bold text-gray-700 text-[11px]">Tipo Doc:</label>
                          <select
                            value={meta.rolDocumento}
                            onChange={(e) => handleCambiarRolDocumento(e.target.value as RolDocumentoFijo)}
                            className="px-2 py-0.5 border border-amber-400 bg-amber-50 text-amber-950 rounded font-bold text-[11px]"
                            title="Rol oficial de este documento fijo"
                          >
                            <option value="presupuesto">📄 Presupuesto Oficial</option>
                            <option value="plan_trabajo">📋 Plan de Trabajo</option>
                            <option value="car">🎓 Constancia Alumno Regular (CAR)</option>
                            <option value="general">📁 Otro Institucional</option>
                          </select>
                        </div>

                        {/* Selector de Prestación (si no es CAR) */}
                        {meta.rolDocumento !== 'car' && (
                          <div className="flex items-center gap-1">
                            <label className="font-bold text-gray-700 text-[11px]">Prestación:</label>
                            <select
                              value={meta.prestacionFijo}
                              onChange={(e) => handleCambiarPrestacionFijo(e.target.value as PrestacionFijo)}
                              className="px-2 py-0.5 border border-indigo-300 bg-indigo-50 text-indigo-950 rounded font-bold text-[11px]"
                              title="Modalidad o prestación a la que aplica este formulario"
                            >
                              <option value="integracion">🤝 Integración Escolar (Con Equipo)</option>
                              <option value="ae">🧑‍🏫 Modalidad AE (Apoyo Educativo)</option>
                              <option value="egb_js">🏫 Primaria JS (EGB JS)</option>
                              <option value="egb_jd">🏫 Primaria JD (EGB JD)</option>
                              <option value="fl_js">🛠️ Formación Laboral JS (FL JS)</option>
                              <option value="fl_jd">🛠️ Formación Laboral JD (FL JD)</option>
                              <option value="inicial">🧸 Inicial JS (Jardín)</option>
                              {meta.prestacionFijo === 'integracion_ae' && (
                                <option value="integracion_ae">🤝 Integración / AE (General)</option>
                              )}
                              <option value="todas">🌟 Todas las Prestaciones</option>
                            </select>
                          </div>
                        )}

                        {/* Selector de Nivel Integración (exclusivo para Integración Escolar) */}
                        {meta.rolDocumento !== 'car' && meta.prestacionFijo === 'integracion' && (
                          <div className="flex items-center gap-1">
                            <label className="font-bold text-teal-900 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-300 text-[11px]">
                              Nivel Integración:
                            </label>
                            <select
                              value={meta.nivelFijo}
                              onChange={(e) => handleCambiarNivelFijo(e.target.value as NivelFijo)}
                              className="px-2 py-0.5 border border-teal-400 bg-teal-50 text-teal-950 rounded font-bold text-[11px]"
                              title="Nivel educativo para Integración Escolar (Inicial, Primaria, Secundaria o CFI)"
                            >
                              <option value="todos">Todos los Niveles</option>
                              <option value="Primaria">Primaria (Integración)</option>
                              <option value="Secundaria">Secundaria (Integración)</option>
                              <option value="Inicial">Inicial (Integración)</option>
                              <option value="Formación Integral">Formación Integral / CFI (Integración)</option>
                            </select>
                          </div>
                        )}

                        {/* Selector de Nivel AE (exclusivo para Modalidad AE) */}
                        {meta.rolDocumento !== 'car' && meta.prestacionFijo === 'ae' && (
                          <div className="flex items-center gap-1">
                            <label className="font-bold text-purple-900 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-300 text-[11px]">
                              Nivel AE:
                            </label>
                            <select
                              value={meta.nivelFijo}
                              onChange={(e) => handleCambiarNivelFijo(e.target.value as NivelFijo)}
                              className="px-2 py-0.5 border border-purple-400 bg-purple-50 text-purple-950 rounded font-bold text-[11px]"
                              title="Nivel educativo para Modalidad AE (Inicial, Primaria, Secundaria o CFI)"
                            >
                              <option value="todos">Todos los Niveles</option>
                              <option value="Primaria">Primaria (AE)</option>
                              <option value="Secundaria">Secundaria (AE)</option>
                              <option value="Inicial">Inicial (AE)</option>
                              <option value="Formación Integral">Formación Integral / CFI (AE)</option>
                            </select>
                          </div>
                        )}

                        {/* Compatibilidad si estuviera en modo legado integracion_ae */}
                        {meta.rolDocumento !== 'car' && meta.prestacionFijo === 'integracion_ae' && (
                          <div className="flex items-center gap-1">
                            <label className="font-bold text-gray-700 text-[11px]">Nivel:</label>
                            <select
                              value={meta.nivelFijo}
                              onChange={(e) => handleCambiarNivelFijo(e.target.value as NivelFijo)}
                              className="px-2 py-0.5 border border-gray-300 bg-gray-50 text-gray-900 rounded font-bold text-[11px]"
                            >
                              <option value="todos">Todos los Niveles</option>
                              <option value="Primaria">Primaria</option>
                              <option value="Secundaria">Secundaria</option>
                              <option value="Inicial">Inicial</option>
                              <option value="Formación Integral">Formación Integral / CFI</option>
                            </select>
                          </div>
                        )}

                        {/* Indicador de aplicabilidad al alumno actual */}
                        {aplicaActual ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded font-bold text-[10px] flex items-center gap-1 shadow-2xs">
                            <span>✓ Aplica a este alumno</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-300 rounded font-medium text-[10px] flex items-center gap-1" title={`Se activará automáticamente al seleccionar alumnos con prestación ${meta.prestacionFijo.toUpperCase()}`}>
                            <span>ℹ️ Prestación: {meta.prestacionFijo.toUpperCase()}</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCambiarTipoFormulario('obra_social')}
                          className="text-[10px] text-blue-700 hover:text-blue-900 underline font-medium ml-1"
                          title="Asignar a una obra social específica"
                        >
                          Asignar a Obra Social
                        </button>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-gray-700">Obra Social:</label>
                    <select
                      value={currentForm.obraSocial}
                      onChange={(e) => handleCambiarObraSocial(e.target.value)}
                      className="px-2 py-0.5 border border-blue-400 bg-blue-50 text-blue-900 rounded font-bold text-[11px]"
                      title="Cambiar a qué Obra Social pertenece este formulario"
                    >
                      {obrasSociales.map((os) => (
                        <option key={os} value={os}>
                          {os}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleCambiarTipoFormulario('fijo_juntos')}
                      className="text-[10.5px] text-amber-900 hover:text-amber-950 font-bold bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded border border-amber-400 shadow-2xs transition"
                      title="Convertir en formulario institucional fijo de la escuela JUNTOS"
                    >
                      ⭐ Pasar a Fijo JUNTOS
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Page controls & Zoom & Toggle Preview */}
          <div className="flex items-center gap-3">
            {/* Page navigation */}
            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-1.5 py-0.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 hover:bg-gray-100 disabled:opacity-30 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold px-2 text-gray-700">
                Pág {currentPage} de {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 hover:bg-gray-100 disabled:opacity-30 rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-1.5 py-0.5">
              <button
                onClick={() => setScale((s) => Math.max(0.7, s - 0.15))}
                className="p-1 hover:bg-gray-100 rounded"
                title="Alejar"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] text-gray-600 px-1">{Math.round(scale * 100)}%</span>
              <button
                onClick={() => setScale((s) => Math.min(2.0, s + 0.15))}
                className="p-1 hover:bg-gray-100 rounded"
                title="Acercar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Toggle Preview Real */}
            <button
              type="button"
              onClick={() => setIsLivePreviewMode(!isLivePreviewMode)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-bold transition shadow-xs ${
                isLivePreviewMode
                  ? 'bg-amber-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isLivePreviewMode ? 'Modo Vista Real (Activo)' : 'Ver con Datos Reales'}</span>
            </button>
          </div>
        </div>

        {/* Main Workspace Area */}
        <div className="flex-1 flex overflow-hidden bg-gray-200">
          {!currentForm ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-100">
              <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mb-3 shadow-inner">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">No hay ningún formulario seleccionado o disponible</h3>
              <p className="text-xs text-gray-500 max-w-md mb-4">
                Podés subir un formulario PDF oficial en blanco (Fijo Institucional de la Escuela JUNTOS o de una Obra Social) para colocar sus etiquetas en el diseñador.
              </p>
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>Subir Formulario PDF</span>
              </button>
            </div>
          ) : (
            <>
              {/* Central PDF Canvas with interactive draggable tags */}
              <div
                className="flex-1 overflow-auto p-4 flex justify-center items-start relative cursor-crosshair"
                onMouseMove={handleContainerMouseMove}
                onMouseUp={handleContainerMouseUp}
              >
            <div
              ref={canvasContainerRef}
              className="relative shadow-xl bg-white border border-gray-400 select-none"
              onClick={handleCanvasClick}
            >
              {/* PDF Canvas rendered by pdfjs */}
              <canvas ref={canvasRef} className="block pointer-events-none" />

              {/* Tag Badges Layer */}
              {camposDeEstaPagina.map((campo) => {
                const tagItem = TODAS_LAS_ETIQUETAS.find((t) => t.etiqueta === campo.etiqueta);
                const displayLeft = campo.x * scale;
                const displayTop = (pageSize.height - campo.y) * scale;
                const isBeingDragged = draggingTagId === campo.id;

                const textToDisplay = isLivePreviewMode
                  ? tagItem?.ejemplo(alumno, config, cronograma, escuela) || campo.etiqueta
                  : campo.etiqueta;

                const isCorta = campo.etiqueta === '{PRESTACION_CORTA}';
                const isPeriodoMes = campo.etiqueta === '{DESDE}' || campo.etiqueta === '{HASTA}';
                const isUltraCorta = ['{L_D}', '{L_A}', '{M_D}', '{M_A}', '{MI_D}', '{MI_A}', '{J_D}', '{J_A}', '{V_D}', '{V_A}', '{D}', '{A}'].includes(campo.etiqueta);
                const isSesiones = campo.etiqueta.includes('SES') || campo.etiqueta.includes('DIAS_SEMANA');
                const isHorario = tagItem?.categoria === 'Horarios';

                return (
                  <div
                    key={campo.id}
                    onMouseDown={(e) => handleTagMouseDown(e, campo.id, displayLeft, displayTop)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      left: `${displayLeft}px`,
                      top: `${displayTop}px`,
                      fontSize: `${campo.fontSize * scale}px`,
                    }}
                    className={`absolute transform -translate-y-full cursor-grab active:cursor-grabbing font-sans transition-shadow ${
                      isLivePreviewMode
                        ? 'font-bold text-blue-950 bg-transparent border border-dashed border-blue-400/50 px-0.5 py-0 whitespace-nowrap'
                        : isBeingDragged
                        ? 'bg-yellow-300 text-black border-2 border-yellow-600 font-bold px-1.5 py-0.5 rounded shadow-lg z-30 ring-2 ring-yellow-400'
                        : isCorta
                        ? 'bg-purple-700 text-white font-bold px-1.5 py-0.5 rounded shadow-md z-10 border border-purple-900 ring-1 ring-purple-300'
                        : isPeriodoMes
                        ? 'bg-amber-600 text-white font-bold px-1.5 py-0.5 rounded shadow-md z-10 border border-amber-800 ring-1 ring-amber-300'
                        : isUltraCorta
                        ? 'bg-blue-700 text-white font-black px-1.5 py-0.5 rounded shadow-md z-10 border border-blue-900 ring-1 ring-blue-300'
                        : isSesiones
                        ? 'bg-teal-700 text-white font-extrabold px-1.5 py-0.5 rounded shadow-md z-10 border border-teal-900 ring-1 ring-teal-300'
                        : isHorario
                        ? 'bg-sky-700 text-white font-bold px-1.5 py-0.5 rounded shadow-md z-10 border border-sky-900 ring-1 ring-sky-300'
                        : 'bg-emerald-600 text-white font-semibold px-1.5 py-0.5 rounded shadow-md z-10 hover:bg-emerald-700 border border-emerald-800'
                    }`}
                    title={`Arrastrá para mover. Posición: (${campo.x}, ${campo.y})`}
                  >
                    <div className="flex items-center gap-1">
                      <Move className="w-2.5 h-2.5 opacity-70" />
                      <span>{textToDisplay}</span>
                      {!isLivePreviewMode && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminarCampo(campo.id);
                          }}
                          className="ml-1 hover:text-red-200 text-[10px]"
                          title="Eliminar etiqueta"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Sidebar: Comprehensive Categorized Tag Palette */}
          <div className="w-96 bg-white border-l border-gray-300 flex flex-col shrink-0 text-xs">
            <div className="p-3 bg-gray-50 border-b border-gray-200 font-bold text-gray-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-700" />
                <span>Paleta Completa de Etiquetas</span>
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                {camposDeEstaPagina.length} en Pág {currentPage}
              </span>
            </div>

            {/* Quick Filter by Category */}
            <div className="p-2 border-b border-gray-200 bg-gray-50/70 space-y-1.5">
              <div className="flex flex-wrap gap-1">
                {CATEGORIAS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoriaFiltro(cat)}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-medium transition ${
                      categoriaFiltro === cat
                        ? 'bg-blue-700 text-white shadow-2xs font-bold'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busquedaEtiqueta}
                  onChange={(e) => setBusquedaEtiqueta(e.target.value)}
                  placeholder="Buscar etiqueta (ej. corta, dni, cuota...)"
                  className="w-full pl-8 pr-3 py-1 border border-gray-300 rounded text-xs bg-white"
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="px-3 py-1.5 bg-blue-50 border-b border-blue-200 text-[10.5px] text-blue-900 leading-tight">
              <span>👉 <strong>Para agregar una etiqueta:</strong> Hacé clic en <strong>"Colocar"</strong> o hacé clic sobre el renglón del PDF. Luego <strong>arrastrala con el mouse</strong>.</span>
            </div>

            {/* Tag List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {etiquetasFiltradas.map((tag) => {
                const isSelected = selectedTagToAdd === tag.etiqueta;
                const ejemploValor = tag.ejemplo(alumno, config, cronograma, escuela);
                const isCorta = tag.etiqueta === '{PRESTACION_CORTA}';
                const isPeriodoMes =
                  tag.categoria === 'Fechas' ||
                  tag.etiqueta === '{DESDE}' ||
                  tag.etiqueta === '{HASTA}' ||
                  tag.etiqueta.includes('FECHA') ||
                  tag.etiqueta.includes('PERIODO');
                const isUltraCorta = ['{L_D}', '{L_A}', '{M_D}', '{M_A}', '{MI_D}', '{MI_A}', '{J_D}', '{J_A}', '{V_D}', '{V_A}', '{D}', '{A}'].includes(tag.etiqueta);
                const isSesiones = tag.etiqueta.includes('SES') || tag.etiqueta.includes('DIAS_SEMANA');
                const isHorario = tag.categoria === 'Horarios';
                const isArancel = tag.categoria === 'Aranceles' || tag.etiqueta.includes('CUOTA') || tag.etiqueta.includes('MONTO');

                let badgeClass = 'bg-gray-100 text-gray-800';
                let btnClass = 'bg-blue-700 hover:bg-blue-800 text-white';
                let cardBg = isSelected
                  ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400'
                  : 'bg-white border-gray-200 hover:border-blue-300';

                if (isArancel) {
                  badgeClass = 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-extrabold';
                  btnClass = 'bg-emerald-700 hover:bg-emerald-800 text-white font-bold';
                  cardBg = isSelected
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400'
                    : 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400';
                } else if (isCorta) {
                  badgeClass = 'bg-purple-100 text-purple-900 border border-purple-300 font-bold';
                  btnClass = 'bg-purple-700 hover:bg-purple-800 text-white';
                  cardBg = isSelected
                    ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-400'
                    : 'bg-purple-50/50 border-purple-200 hover:border-purple-400';
                } else if (isPeriodoMes) {
                  badgeClass = 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold';
                  btnClass = 'bg-amber-600 hover:bg-amber-700 text-white font-extrabold';
                  cardBg = isSelected
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400'
                    : 'bg-amber-50/50 border-amber-200 hover:border-amber-400';
                } else if (isUltraCorta) {
                  badgeClass = 'bg-blue-100 text-blue-900 border border-blue-400 font-black tracking-wide';
                  btnClass = 'bg-blue-700 hover:bg-blue-800 text-white font-bold';
                  cardBg = isSelected
                    ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400'
                    : 'bg-blue-50/50 border-blue-200 hover:border-blue-400';
                } else if (isSesiones) {
                  badgeClass = 'bg-teal-100 text-teal-950 border border-teal-400 font-black tracking-wide';
                  btnClass = 'bg-teal-700 hover:bg-teal-800 text-white font-bold';
                  cardBg = isSelected
                    ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-400'
                    : 'bg-teal-50/50 border-teal-200 hover:border-teal-400';
                } else if (isHorario) {
                  badgeClass = 'bg-sky-100 text-sky-900 border border-sky-300 font-bold';
                  btnClass = 'bg-sky-700 hover:bg-sky-800 text-white';
                  cardBg = isSelected
                    ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-400'
                    : 'bg-sky-50/50 border-sky-200 hover:border-sky-400';
                }

                return (
                  <div
                    key={tag.etiqueta}
                    onClick={() => setSelectedTagToAdd(tag.etiqueta)}
                    className={`p-2 rounded-lg border transition cursor-pointer space-y-1 ${cardBg}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded ${badgeClass}`}>
                        {tag.etiqueta}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleColocarEnCentro(tag.etiqueta);
                        }}
                        className={`px-2 py-0.5 rounded text-[10.5px] font-bold shadow-2xs transition flex items-center gap-1 ${btnClass}`}
                        title="Colocar esta etiqueta en la página actual"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Colocar</span>
                      </button>
                    </div>

                    <div className="font-semibold text-gray-800 text-[11px]">{tag.nombre}</div>
                    <div className="text-[10px] text-gray-500">{tag.descripcion}</div>

                    <div className="pt-0.5 text-[10.5px] text-blue-900 bg-blue-50/60 px-1.5 py-0.5 rounded truncate font-mono">
                      Escribe: <strong>{ejemploValor}</strong>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Fields on this page */}
            <div className="p-2.5 border-t border-gray-300 bg-gray-50 max-h-48 overflow-y-auto space-y-1.5">
              <div className="font-bold text-gray-700 text-[10.5px] uppercase tracking-wider flex items-center justify-between">
                <span>En esta página ({camposDeEstaPagina.length}):</span>
                <span className="text-[10px] text-gray-400 font-normal">Tamaño de letra</span>
              </div>

              {camposDeEstaPagina.map((c) => (
                <div
                  key={c.id}
                  className="p-1.5 bg-white border border-gray-200 rounded flex items-center justify-between gap-1 text-[11px]"
                >
                  <div className="min-w-0 flex-1 truncate font-mono font-bold text-emerald-950">
                    {c.etiqueta}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <select
                      value={c.fontSize}
                      onChange={(e) => {
                        if (!currentForm) return;
                        const size = parseInt(e.target.value, 10);
                        const updated = currentForm.campos.map((item) =>
                          item.id === c.id ? { ...item, fontSize: size } : item
                        );
                        setCurrentForm({ ...currentForm, campos: updated });
                      }}
                      className="px-1 py-0.5 border border-gray-300 rounded text-[10px] bg-white"
                      title="Tamaño de letra"
                    >
                      <option value="6">6 pt</option>
                      <option value="7">7 pt</option>
                      <option value="8">8 pt</option>
                      <option value="9">9 pt</option>
                      <option value="10">10 pt</option>
                      <option value="11">11 pt</option>
                      <option value="12">12 pt</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleEliminarCampo(c.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="Eliminar esta etiqueta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-gray-300 bg-white">
              <button
                type="button"
                onClick={handleGuardarCambios}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded shadow-xs flex items-center justify-center gap-1.5 transition text-xs"
              >
                <Save className="w-4 h-4" />
                <span>{savedSuccess ? '¡Coordenadas Guardadas!' : 'Guardar Coordenadas'}</span>
              </button>
            </div>
          </div>
          </>
        )}
        </div>
      </div>

      {/* Upload New Form Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-5 space-y-4 border border-gray-300 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-blue-700" />
                <span>Subir Nuevo Formulario PDF Oficial</span>
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Selector de Tipo de Formulario */}
              <div>
                <label className="block font-bold text-gray-800 mb-1.5">
                  ¿Qué tipo de formulario estás subiendo?:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                      uploadTipo === 'fijo_juntos'
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="uploadTipo"
                      value="fijo_juntos"
                      checked={uploadTipo === 'fijo_juntos'}
                      onChange={() => setUploadTipo('fijo_juntos')}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold text-amber-950 block text-xs">
                        🏫 Formulario Fijo de la Escuela (JUNTOS)
                      </span>
                      <span className="text-[10px] text-gray-600 block mt-0.5 leading-tight">
                        Formulario base institucional propio de JUNTOS. Aplica a todos los alumnos como documentación fija escolar (no depende de la obra social).
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                      uploadTipo === 'obra_social'
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="uploadTipo"
                      value="obra_social"
                      checked={uploadTipo === 'obra_social'}
                      onChange={() => setUploadTipo('obra_social')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-bold text-blue-950 block text-xs">
                        🏥 Formulario de Obra Social
                      </span>
                      <span className="text-[10px] text-gray-600 block mt-0.5 leading-tight">
                        Formulario específico exigido por una obra social particular (OSDE, IOMA, Swiss Medical, ASE, etc.).
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Si es obra social, mostrar dropdown de Obras Sociales */}
              {uploadTipo === 'obra_social' && (
                <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-200">
                  <label className="block font-bold text-blue-900 mb-1">
                    Seleccionar la Obra Social correspondiente:
                  </label>
                  <select
                    value={uploadObraSocial}
                    onChange={(e) => setUploadObraSocial(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-blue-400 rounded bg-white font-bold text-blue-950"
                  >
                    {obrasSociales.map((os) => (
                      <option key={os} value={os}>
                        {os}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Archivo PDF Oficial (Plantilla en blanco a completar):
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setUploadFile(f);
                      const detected = autoDetectarMetadatosFormulario(f.name);
                      if (!uploadNombre) setUploadNombre(f.name.replace(/\.pdf$/i, ''));
                      setUploadTipo(detected.tipoFormulario);
                      setUploadRol(detected.rolDocumento);
                      setUploadPrestacion(detected.prestacionFijo);
                      setUploadNivel(detected.nivelFijo);

                      const summaryParts: string[] = [];
                      summaryParts.push(LABELS_ROL_DOCUMENTO[detected.rolDocumento]);
                      if (detected.rolDocumento !== 'car') {
                        summaryParts.push(LABELS_PRESTACION_FIJO[detected.prestacionFijo]);
                      }
                      if (detected.nivelFijo && detected.nivelFijo !== 'todos') {
                        summaryParts.push(`Nivel: ${detected.nivelFijo}`);
                      }
                      setDetectedSummary(summaryParts.join(' • '));
                    }
                  }}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded bg-gray-50"
                />
              </div>

              {/* Si es formulario fijo institucional de JUNTOS, selectores de Rol, Prestación y Nivel */}
              {uploadTipo === 'fijo_juntos' && (
                <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-300 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-amber-950 mb-1">
                        Tipo de Documento Oficial (Rol):
                      </label>
                      <select
                        value={uploadRol}
                        onChange={(e) => setUploadRol(e.target.value as RolDocumentoFijo)}
                        className="w-full px-2 py-1.5 border border-amber-400 rounded bg-white font-bold text-amber-950"
                      >
                        <option value="presupuesto">📄 Presupuesto Oficial</option>
                        <option value="plan_trabajo">📋 Plan de Trabajo Anual</option>
                        <option value="car">🎓 Constancia Alumno Regular (CAR)</option>
                        <option value="general">📁 Otro Documento Institucional</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-amber-950 mb-1">
                        Prestación / Modalidad a la que aplica:
                      </label>
                      <select
                        disabled={uploadRol === 'car'}
                        value={uploadRol === 'car' ? 'todas' : uploadPrestacion}
                        onChange={(e) => {
                          const val = e.target.value as PrestacionFijo;
                          setUploadPrestacion(val);
                          if (val !== 'integracion' && val !== 'ae' && val !== 'integracion_ae') {
                            setUploadNivel('todos');
                          }
                        }}
                        className="w-full px-2 py-1.5 border border-amber-400 rounded bg-white font-bold text-amber-950 disabled:bg-gray-100 disabled:opacity-60"
                      >
                        <option value="integracion">🤝 Integración Escolar (Con Equipo)</option>
                        <option value="ae">🧑‍🏫 Modalidad AE (Apoyo Educativo)</option>
                        <option value="egb_js">🏫 Primaria JS (EGB JS)</option>
                        <option value="egb_jd">🏫 Primaria JD (EGB JD)</option>
                        <option value="fl_js">🛠️ Formación Laboral JS (FL JS)</option>
                        <option value="fl_jd">🛠️ Formación Laboral JD (FL JD)</option>
                        <option value="inicial">🧸 Inicial JS (Jardín)</option>
                        <option value="todas">🌟 Todas las Prestaciones</option>
                      </select>
                    </div>
                  </div>

                  {uploadRol !== 'car' && uploadPrestacion === 'integracion' && (
                    <div className="bg-teal-50/90 p-2.5 rounded border border-teal-300">
                      <label className="block font-bold text-teal-950 mb-1 text-xs">
                        Nivel Integración (Exclusivo para Integración Escolar):
                      </label>
                      <select
                        value={uploadNivel}
                        onChange={(e) => setUploadNivel(e.target.value as NivelFijo)}
                        className="w-full px-2 py-1.5 border border-teal-400 rounded bg-white font-bold text-teal-950 text-xs"
                      >
                        <option value="todos">Todos los Niveles (Integración)</option>
                        <option value="Primaria">Primaria (ej. PLAN_DE_TRABAJO_PRIMARIA_INTEGRACION)</option>
                        <option value="Secundaria">Secundaria (ej. PLAN_DE_TRABAJO_SECUNDARIA_INTEGRACION)</option>
                        <option value="Inicial">Inicial (ej. PLAN_DE_TRABAJO_INICIAL_INTEGRACION)</option>
                        <option value="Formación Integral">Formación Integral / CFI (Integración)</option>
                      </select>
                    </div>
                  )}

                  {uploadRol !== 'car' && uploadPrestacion === 'ae' && (
                    <div className="bg-purple-50/90 p-2.5 rounded border border-purple-300">
                      <label className="block font-bold text-purple-950 mb-1 text-xs">
                        Nivel AE (Exclusivo para Modalidad AE):
                      </label>
                      <select
                        value={uploadNivel}
                        onChange={(e) => setUploadNivel(e.target.value as NivelFijo)}
                        className="w-full px-2 py-1.5 border border-purple-400 rounded bg-white font-bold text-purple-950 text-xs"
                      >
                        <option value="todos">Todos los Niveles (AE)</option>
                        <option value="Primaria">Primaria (ej. PLAN_DE_TRABAJO_PRIMARIA_AE)</option>
                        <option value="Secundaria">Secundaria (ej. PLAN_DE_TRABAJO_SECUNDARIA_AE)</option>
                        <option value="Inicial">Inicial (ej. PLAN_DE_TRABAJO_INICIAL_AE)</option>
                        <option value="Formación Integral">Formación Integral / CFI (AE)</option>
                      </select>
                    </div>
                  )}

                  {uploadRol !== 'car' && uploadPrestacion === 'integracion_ae' && (
                    <div>
                      <label className="block font-bold text-amber-950 mb-1">
                        Nivel Escolar:
                      </label>
                      <select
                        value={uploadNivel}
                        onChange={(e) => setUploadNivel(e.target.value as NivelFijo)}
                        className="w-full px-2 py-1.5 border border-amber-400 rounded bg-white font-bold text-amber-950"
                      >
                        <option value="todos">Todos los Niveles</option>
                        <option value="Primaria">Primaria</option>
                        <option value="Secundaria">Secundaria</option>
                        <option value="Inicial">Inicial</option>
                        <option value="Formación Integral">Formación Integral / CFI</option>
                      </select>
                    </div>
                  )}

                  {detectedSummary && (
                    <div className="p-2 bg-emerald-50 border border-emerald-300 rounded text-[11px] text-emerald-900 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>⚡ Auto-detectado: <b>{detectedSummary}</b></span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Nombre descriptivo del formulario:
                </label>
                <input
                  type="text"
                  value={uploadNombre}
                  onChange={(e) => setUploadNombre(e.target.value)}
                  placeholder={
                    uploadTipo === 'fijo_juntos'
                      ? 'Ej. PRESUPUESTO_EGB_JS / PLAN_DE_TRABAJO_PRIMARIA_AE / CAR'
                      : 'Ej. Solicitud Cobertura Anexo OSDE'
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!uploadFile}
                onClick={handleConfirmUpload}
                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded font-bold shadow-xs"
              >
                Cargar en el Diseñador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Delete a Form */}
      {formToDelete && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-rose-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-full shrink-0 shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  ¿Eliminar este formulario PDF?
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  Estás a punto de borrar de forma permanente la siguiente plantilla:
                </p>

                <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-3 space-y-1.5 text-xs">
                  <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <span>📄</span>
                    <span className="truncate">{formToDelete.nombre}</span>
                  </div>
                  <div className="text-gray-700 flex items-center gap-2">
                    <span className="font-medium text-[11px] text-gray-500">Destino:</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10.5px] ${
                        formToDelete.tipoFormulario === 'fijo_juntos' || formToDelete.obraSocial.includes('JUNTOS')
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-blue-100 text-blue-900 border border-blue-300'
                      }`}
                    >
                      {formToDelete.tipoFormulario === 'fijo_juntos' || formToDelete.obraSocial.includes('JUNTOS')
                        ? '🏫 Formulario Fijo JUNTOS'
                        : `🏥 Obra Social ${formToDelete.obraSocial}`}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-600 flex items-center justify-between pt-1 border-t border-rose-200/60">
                    <span>Casilleros configurados: <b>{formToDelete.campos.length}</b></span>
                    {formToDelete.fechaSubida && <span>Subido el: {formToDelete.fechaSubida}</span>}
                  </div>
                </div>

                <div className="flex items-start gap-1.5 mt-3 text-rose-700 text-[11px] font-medium leading-relaxed">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>
                    Esta acción no se puede deshacer. Se eliminarán tanto el documento PDF cargado como todas las etiquetas y coordenadas asociadas.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setFormToDelete(null)}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteForm}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold shadow-xs transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar Formulario</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage All Forms Modal */}
      {showManageFormsModal && (
        <div className="fixed inset-0 z-65 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-5 border border-gray-300 flex flex-col max-h-[85vh] text-xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    Gestor y Administración de Formularios PDF
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Tenés <strong>{formularios.length}</strong> formulario(s) cargado(s) en la aplicación
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManageFormsModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs in Management Modal */}
            <div className="flex items-center gap-1.5 py-2 border-b border-gray-200 overflow-x-auto shrink-0">
              {[
                { id: 'todos', label: `Todos (${formularios.length})` },
                {
                  id: 'presupuesto',
                  label: `📄 Presupuestos (${
                    formularios.filter(
                      (f) =>
                        (f.tipoFormulario === 'fijo_juntos' || f.obraSocial.includes('JUNTOS')) &&
                        getFormularioEffectiveMeta(f).rolDocumento === 'presupuesto'
                    ).length
                  })`,
                },
                {
                  id: 'plan_trabajo',
                  label: `📋 Planes de Trabajo (${
                    formularios.filter(
                      (f) =>
                        (f.tipoFormulario === 'fijo_juntos' || f.obraSocial.includes('JUNTOS')) &&
                        getFormularioEffectiveMeta(f).rolDocumento === 'plan_trabajo'
                    ).length
                  })`,
                },
                {
                  id: 'car',
                  label: `🎓 CAR (${
                    formularios.filter(
                      (f) =>
                        (f.tipoFormulario === 'fijo_juntos' || f.obraSocial.includes('JUNTOS')) &&
                        getFormularioEffectiveMeta(f).rolDocumento === 'car'
                    ).length
                  })`,
                },
                {
                  id: 'obra_social',
                  label: `🏥 Obras Sociales (${
                    formularios.filter(
                      (f) => f.tipoFormulario !== 'fijo_juntos' && !f.obraSocial.includes('JUNTOS')
                    ).length
                  })`,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFiltroGestionRol(tab.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition shrink-0 ${
                    filtroGestionRol === tab.id
                      ? 'bg-blue-700 text-white shadow-2xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List of Forms */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {formularios.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500 font-medium">No hay ningún formulario cargado actualmente.</p>
                </div>
              ) : (
                formularios
                  .filter((f) => {
                    if (filtroGestionRol === 'todos') return true;
                    if (filtroGestionRol === 'obra_social') {
                      return f.tipoFormulario !== 'fijo_juntos' && !f.obraSocial.includes('JUNTOS');
                    }
                    const isFijo = f.tipoFormulario === 'fijo_juntos' || f.obraSocial.includes('JUNTOS');
                    if (!isFijo) return false;
                    const meta = getFormularioEffectiveMeta(f);
                    return meta.rolDocumento === filtroGestionRol;
                  })
                  .map((form) => {
                  const isCurrent = form.id === currentForm?.id;
                  const isFijo = form.tipoFormulario === 'fijo_juntos' || form.obraSocial.includes('JUNTOS');
                  const meta = getFormularioEffectiveMeta(form);
                  const aplica = formularioAplicaAAlumno(form, config);

                  return (
                    <div
                      key={form.id}
                      className={`p-3 rounded-lg border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-300'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-gray-900 text-sm truncate">
                            {form.nombre}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 bg-blue-700 text-white font-bold text-[10px] rounded">
                              En edición
                            </span>
                          )}
                          {isFijo ? (
                            <>
                              <span className="px-2 py-0.5 rounded font-bold text-[10.5px] bg-amber-100 text-amber-900 border border-amber-300">
                                {LABELS_ROL_DOCUMENTO[meta.rolDocumento]}
                              </span>
                              {meta.rolDocumento !== 'car' && (
                                <span className="px-2 py-0.5 rounded font-bold text-[10.5px] bg-indigo-100 text-indigo-900 border border-indigo-300">
                                  {LABELS_PRESTACION_FIJO[meta.prestacionFijo]}
                                </span>
                              )}
                              {meta.rolDocumento !== 'car' && meta.nivelFijo && meta.nivelFijo !== 'todos' && (
                                <span className="px-2 py-0.5 rounded font-bold text-[10.5px] bg-purple-100 text-purple-900 border border-purple-300">
                                  Nivel: {meta.nivelFijo}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="px-2 py-0.5 rounded font-bold text-[10.5px] bg-blue-100 text-blue-900 border border-blue-300">
                              🏥 {form.obraSocial}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-gray-500 flex items-center gap-3 flex-wrap">
                          <span>Casilleros colocados: <b>{form.campos.length}</b></span>
                          {form.fechaSubida && <span>• Subido: {form.fechaSubida}</span>}
                          {aplica ? (
                            <span className="text-emerald-700 font-semibold">• ✓ Aplica al alumno actual</span>
                          ) : (
                            <span className="text-gray-400">• Para otra prestación/nivel</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFormId(form.id);
                            setCurrentForm({ ...form });
                            setShowManageFormsModal(false);
                          }}
                          className={`px-3 py-1.5 rounded text-xs font-semibold shadow-2xs transition ${
                            isCurrent
                              ? 'bg-blue-700 text-white'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {isCurrent ? 'Editando ahora' : 'Abrir y Diseñar'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormToDelete(form)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded transition border border-rose-200"
                          title={`Eliminar el formulario "${form.nombre}"`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowManageFormsModal(false);
                  setShowUploadModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Subir Otro Formulario PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setShowManageFormsModal(false)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-semibold transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
