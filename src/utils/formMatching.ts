import {
  FormularioCustomModel,
  ConfiguracionLegajo,
  RolDocumentoFijo,
  PrestacionFijo,
  NivelFijo,
} from '../types';

export const LABELS_PRESTACION_FIJO: Record<PrestacionFijo, string> = {
  todas: '🌟 Todas las Prestaciones (Común)',
  integracion: '🤝 Integración Escolar (Con Equipo)',
  ae: '🧑‍🏫 Modalidad AE (Apoyo Educativo)',
  egb_js: '🏫 Primaria Jornada Simple (EGB JS)',
  egb_jd: '🏫 Primaria Jornada Doble (EGB JD)',
  fl_js: '🛠️ Formación Laboral JS (FL JS)',
  fl_jd: '🛠️ Formación Laboral JD (FL JD)',
  inicial: '🧸 Inicial Jornada Simple (Jardín)',
  integracion_ae: '🤝 Integración / AE (General)',
};

export const LABELS_ROL_DOCUMENTO: Record<RolDocumentoFijo, string> = {
  presupuesto: '📄 Presupuesto Oficial',
  plan_trabajo: '📋 Plan de Trabajo Anual',
  car: '🎓 Constancia Alumno Regular (CAR)',
  general: '📁 Otro Documento Institucional',
};

/**
 * Detecta automáticamente el rol, la prestación y el nivel de un archivo
 * según su nombre oficial (ej. PRESUPUESTO_EGB_JS, PLAN_DE_TRABAJO_PRIMARIA_AE, CAR, etc.)
 */
export function autoDetectarMetadatosFormulario(nombreArchivo: string): {
  tipoFormulario: 'fijo_juntos' | 'obra_social';
  rolDocumento: RolDocumentoFijo;
  prestacionFijo: PrestacionFijo;
  nivelFijo: NivelFijo;
} {
  const norm = (nombreArchivo || '').toUpperCase().replace(/\.PDF$/i, '');

  let rolDocumento: RolDocumentoFijo = 'general';
  let prestacionFijo: PrestacionFijo = 'todas';
  let nivelFijo: NivelFijo = 'todos';

  // 1. Detectar Rol de Documento
  if (norm.includes('PRESUPUESTO')) {
    rolDocumento = 'presupuesto';
  } else if (
    norm.includes('PLAN_DE_TRABAJO') ||
    norm.includes('PLAN TRABAJO') ||
    norm.includes('PLAN_TRABAJO') ||
    norm.includes('PLAN DE TRABAJO')
  ) {
    rolDocumento = 'plan_trabajo';
  } else if (
    norm.includes('CAR') ||
    norm.includes('ALUMNO_REGULAR') ||
    norm.includes('ALUMNO REGULAR') ||
    norm.includes('CONSTANCIA')
  ) {
    rolDocumento = 'car';
  }

  // 2. Detectar Prestación / Modalidad
  if (
    norm.includes('EGB_JS') ||
    norm.includes('EGB JS') ||
    (norm.includes('PRIMARIA') && norm.includes('JS')) ||
    (norm.includes('PRIMARIA') && norm.includes('SIMPLE') && !norm.includes('AE') && !norm.includes('SAIE'))
  ) {
    prestacionFijo = 'egb_js';
  } else if (
    norm.includes('EGB_JD') ||
    norm.includes('EGB JD') ||
    (norm.includes('PRIMARIA') && norm.includes('JD')) ||
    (norm.includes('PRIMARIA') && norm.includes('DOBLE') && !norm.includes('AE') && !norm.includes('SAIE'))
  ) {
    prestacionFijo = 'egb_jd';
  } else if (
    norm.includes('FL_JS') ||
    norm.includes('FL JS') ||
    (norm.includes('LABORAL') && norm.includes('JS')) ||
    (norm.includes('LABORAL') && norm.includes('SIMPLE'))
  ) {
    prestacionFijo = 'fl_js';
  } else if (
    norm.includes('FL_JD') ||
    norm.includes('FL JD') ||
    (norm.includes('LABORAL') && norm.includes('JD')) ||
    (norm.includes('LABORAL') && norm.includes('DOBLE'))
  ) {
    prestacionFijo = 'fl_jd';
  } else if (
    (norm.includes('INICIAL') && !norm.includes('AE') && !norm.includes('SAIE') && !norm.includes('INTEGRA')) ||
    norm.includes('PRESUPUESTO_INICIAL')
  ) {
    prestacionFijo = 'inicial';
  } else if (
    norm.includes('_AE') ||
    norm.includes(' AE') ||
    norm.includes('MODALIDAD_AE') ||
    norm.includes('MODALIDAD AE') ||
    norm.includes('APOYO_EDUCATIVO') ||
    norm.includes('APOYO EDUCATIVO')
  ) {
    prestacionFijo = 'ae';
  } else if (
    norm.includes('INTEGRACION') ||
    norm.includes('INTEGRACIÓN') ||
    norm.includes('CON_EQUIPO') ||
    norm.includes('CON EQUIPO') ||
    norm.includes('SAIE')
  ) {
    prestacionFijo = 'integracion';
  }

  // 3. Detectar Nivel Escolar (aplica para Planes de Trabajo de Integración Escolar o Modalidad AE)
  if (
    (prestacionFijo === 'integracion' || prestacionFijo === 'ae') &&
    rolDocumento === 'plan_trabajo'
  ) {
    if (norm.includes('INICIAL')) {
      nivelFijo = 'Inicial';
    } else if (norm.includes('SECUNDARIA')) {
      nivelFijo = 'Secundaria';
    } else if (norm.includes('PRIMARIA') || norm.includes('EGB')) {
      nivelFijo = 'Primaria';
    } else if (norm.includes('LABORAL') || norm.includes('CFI') || norm.includes('INTEGRAL')) {
      nivelFijo = 'Formación Integral';
    } else {
      nivelFijo = 'todos';
    }
  } else {
    // Para EGB JS, EGB JD, FL JS, FL JD, Inicial, Presupuestos y CAR, la prestación define todo
    nivelFijo = 'todos';
  }

  return {
    tipoFormulario: 'fijo_juntos',
    rolDocumento,
    prestacionFijo,
    nivelFijo,
  };
}

export function getPrestacionKeyFromModalidad(modalidad: string): PrestacionFijo {
  const m = (modalidad || '').toUpperCase();
  if (
    m.includes('MODALIDAD AE') ||
    m.includes('(MODALIDAD AE)') ||
    m.includes('APOYO EDUCATIVO') ||
    m.includes('_AE') ||
    m.endsWith(' AE') ||
    m.includes(' AE ') ||
    m.includes('A.E.')
  ) {
    return 'ae';
  }
  if (
    m.includes('INTEGRACION') ||
    m.includes('INTEGRACIÓN') ||
    m.includes('CON EQUIPO') ||
    m.includes('SAIE') ||
    m.includes('APOYO A LA INTEGRACION')
  ) {
    return 'integracion';
  }
  if (m.includes('PRIMARIA') && (m.includes('SIMPLE') || m.includes('JS'))) return 'egb_js';
  if (m.includes('PRIMARIA') && (m.includes('DOBLE') || m.includes('JD'))) return 'egb_jd';
  if (m.includes('LABORAL') && (m.includes('SIMPLE') || m.includes('JS'))) return 'fl_js';
  if (m.includes('LABORAL') && (m.includes('DOBLE') || m.includes('JD'))) return 'fl_jd';
  if (m.includes('INICIAL')) return 'inicial';
  return 'todas';
}

export function getFormularioEffectiveMeta(form: FormularioCustomModel): {
  rolDocumento: RolDocumentoFijo;
  prestacionFijo: PrestacionFijo;
  nivelFijo: NivelFijo;
} {
  const detected = autoDetectarMetadatosFormulario(form.nombre);
  const rolDocumento = form.rolDocumento || detected.rolDocumento;
  const prestacionFijo = form.prestacionFijo || detected.prestacionFijo;
  // El nivel escolar sólo aplica a Planes de Trabajo de Integración Escolar o Modalidad AE
  const nivelFijo =
    (prestacionFijo === 'integracion' || prestacionFijo === 'ae' || prestacionFijo === 'integracion_ae') &&
    rolDocumento === 'plan_trabajo'
      ? form.nivelFijo || detected.nivelFijo
      : 'todos';

  return {
    rolDocumento,
    prestacionFijo,
    nivelFijo,
  };
}

/**
 * Determina si un formulario guardado aplica al alumno según su configuración (obra social, modalidad y nivel)
 */
export function formularioAplicaAAlumno(
  form: FormularioCustomModel,
  config: ConfiguracionLegajo
): boolean {
  const meta = getFormularioEffectiveMeta(form);
  const prestacionAlumno = getPrestacionKeyFromModalidad(config.modalidad);

  // 1. Determinar si es un formulario institucional de la escuela (Fijo JUNTOS)
  const esInstitucional =
    form.tipoFormulario === 'fijo_juntos' ||
    (form.obraSocial || '').toUpperCase().includes('JUNTOS') ||
    (form.obraSocial || '').toUpperCase().includes('ESCUELA');

  if (esInstitucional) {
    // CAR (Constancia de Alumno Regular) aplica a todos los alumnos de la institución
    if (meta.rolDocumento === 'car') {
      return true;
    }

    // Si la prestación está fijada a "todas", aplica
    if (meta.prestacionFijo === 'todas') {
      return true;
    }

    // Verificar coincidencia de prestación (con retrocompatibilidad para integracion_ae)
    const coincidePrestacion =
      meta.prestacionFijo === prestacionAlumno ||
      (meta.prestacionFijo === 'integracion_ae' &&
        (prestacionAlumno === 'integracion' || prestacionAlumno === 'ae'));

    if (!coincidePrestacion) {
      return false;
    }

    // Si es Plan de Trabajo de integración o AE, discriminar por nivel escolar
    if (
      (prestacionAlumno === 'integracion' ||
        prestacionAlumno === 'ae' ||
        prestacionAlumno === 'integracion_ae') &&
      meta.rolDocumento === 'plan_trabajo'
    ) {
      if (meta.nivelFijo && meta.nivelFijo !== 'todos') {
        const nivelAlumno = (config.nivel || 'Primaria').toLowerCase();
        const nivelForm = meta.nivelFijo.toLowerCase();
        if (!nivelAlumno.includes(nivelForm) && !nivelForm.includes(nivelAlumno)) {
          return false;
        }
      }
    }

    return true;
  }

  // 2. Formulario de Obra Social (específico para esa obra social)
  const osForm = (form.obraSocial || '').toUpperCase().trim();
  const osAlumno = (config.obraSocial || '').toUpperCase().trim();
  const osCoincide =
    osForm === osAlumno ||
    (osForm.length > 2 && osAlumno.includes(osForm)) ||
    (osAlumno.length > 2 && osForm.includes(osAlumno));

  if (!osCoincide) {
    return false;
  }

  // Si el formulario de obra social tiene una prestación específica asignada (no "todas")
  if (meta.prestacionFijo && meta.prestacionFijo !== 'todas') {
    const coincidePrestacion =
      meta.prestacionFijo === prestacionAlumno ||
      (meta.prestacionFijo === 'integracion_ae' &&
        (prestacionAlumno === 'integracion' || prestacionAlumno === 'ae'));
    if (!coincidePrestacion) {
      return false;
    }
  }

  // Si tiene un nivel escolar específico asignado (no "todos")
  if (meta.nivelFijo && meta.nivelFijo !== 'todos') {
    const nivelAlumno = (config.nivel || 'Primaria').toLowerCase();
    const nivelForm = meta.nivelFijo.toLowerCase();
    if (!nivelAlumno.includes(nivelForm) && !nivelForm.includes(nivelAlumno)) {
      return false;
    }
  }

  return true;
}
