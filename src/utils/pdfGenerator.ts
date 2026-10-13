import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import {
  AlumnoData,
  ConfiguracionLegajo,
  CronogramaSemanal,
  EscuelaConfig,
  DocumentosSeleccionados,
  FormularioCustomModel,
} from '../types';
import { numeroALetras, formatearMoneda } from './numberToWords';
import { getFormulariosCustom, ensureFormulariosLoaded } from './storage';
import { TODAS_LAS_ETIQUETAS } from '../components/FormulariosManagerModal';
import { formularioAplicaAAlumno, getFormularioEffectiveMeta } from './formMatching';

export function cleanWinAnsi(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2026]/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ');
}

export interface GeneratedDocument {
  id: string;
  nombre: string;
  blob: Blob;
  pdfBytes: Uint8Array;
}

// Helpers for drawing on PDF pages
function drawHeader(page: PDFPage, fontBold: any, fontRegular: any, escuela: EscuelaConfig, tituloDoc: string) {
  const { width, height } = page.getSize();
  const margin = 40;

  // Header Box
  page.drawRectangle({
    x: margin,
    y: height - 85,
    width: width - margin * 2,
    height: 60,
    borderColor: rgb(0.2, 0.35, 0.25),
    borderWidth: 1.5,
    color: rgb(0.96, 0.98, 0.96),
  });

  // Institution title
  page.drawText(escuela.nombreInstitucion.toUpperCase(), {
    x: margin + 12,
    y: height - 45,
    size: 11,
    font: fontBold,
    color: rgb(0.12, 0.28, 0.16),
  });

  // Institution subtitle & registry
  const subText = `${escuela.numeroInstitucion} | CUIT: ${escuela.cuit} | Tel: ${escuela.telefono}`;
  page.drawText(subText, {
    x: margin + 12,
    y: height - 60,
    size: 8,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  const legalText = `${escuela.direccion}, ${escuela.localidad} - ${escuela.resolucionHabilitacion}`;
  page.drawText(legalText, {
    x: margin + 12,
    y: height - 73,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Document Title Banner
  page.drawRectangle({
    x: margin,
    y: height - 118,
    width: width - margin * 2,
    height: 26,
    color: rgb(0.15, 0.4, 0.22),
  });

  page.drawText(tituloDoc.toUpperCase(), {
    x: margin + 14,
    y: height - 102,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
}

function drawFooter(page: PDFPage, fontRegular: any, fontBold: any, escuela: EscuelaConfig, incluirFirma: boolean) {
  const { width } = page.getSize();
  const margin = 40;

  if (incluirFirma) {
    // Director Signature Box
    const sigX = width - margin - 180;
    const sigY = 70;

    // Draw dotted line for signature
    page.drawLine({
      start: { x: sigX, y: sigY + 30 },
      end: { x: sigX + 170, y: sigY + 30 },
      thickness: 1,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Stamp circle placeholder / seal
    page.drawEllipse({
      x: sigX + 25,
      y: sigY + 38,
      xScale: 20,
      yScale: 15,
      borderColor: rgb(0.2, 0.3, 0.6),
      borderWidth: 1,
      color: rgb(0.93, 0.95, 1),
    });

    page.drawText('SELLO', {
      x: sigX + 13,
      y: sigY + 35,
      size: 6.5,
      font: fontBold,
      color: rgb(0.2, 0.3, 0.6),
    });

    page.drawText(escuela.nombreDirectora, {
      x: sigX,
      y: sigY + 18,
      size: 8,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(escuela.cargoDirectora, {
      x: sigX,
      y: sigY + 8,
      size: 6.5,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  // Bottom footer text
  page.drawLine({
    start: { x: margin, y: 35 },
    end: { x: width - margin, y: 35 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });

  page.drawText(`Documentación Institucional de Legajo Oficial - Ciclo Lectivo | Generado automáticamente con validez escolar`, {
    x: margin,
    y: 22,
    size: 7,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });
}

function drawSectionTitle(page: PDFPage, y: number, title: string, fontBold: any, width: number, margin: number) {
  page.drawRectangle({
    x: margin,
    y: y,
    width: width - margin * 2,
    height: 18,
    color: rgb(0.9, 0.94, 0.91),
    borderColor: rgb(0.7, 0.82, 0.73),
    borderWidth: 0.8,
  });

  page.drawText(title, {
    x: margin + 8,
    y: y + 4.5,
    size: 8.5,
    font: fontBold,
    color: rgb(0.1, 0.3, 0.15),
  });
}

function drawLabeledField(
  page: PDFPage,
  fontBold: any,
  fontRegular: any,
  label: string,
  value: string,
  x: number,
  y: number,
  maxWidth: number = 240
) {
  page.drawText(`${label}:`, {
    x,
    y,
    size: 8,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  const labelWidth = fontBold.widthOfTextAtSize(`${label}: `, 8);
  const cleanVal = (value || '-').toString().slice(0, 55);

  page.drawText(cleanVal, {
    x: x + labelWidth + 2,
    y,
    size: 8,
    font: fontRegular,
    color: rgb(0.05, 0.05, 0.05),
    maxWidth: maxWidth - labelWidth,
  });
}

// 1. FICHA DEL ALUMNO / AFILIADO
export async function generarFichaAlumnoPdf(
  alumno: AlumnoData,
  config: ConfiguracionLegajo,
  escuela: EscuelaConfig,
  cronograma: CronogramaSemanal
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();
  const margin = 40;

  drawHeader(page, fontBold, fontRegular, escuela, 'Ficha Integral de Admisión y Datos del Afiliado');

  let curY = 700;

  // 1. Datos del Alumno
  drawSectionTitle(page, curY, '1. DATOS IDENTIFICATORIOS DEL ALUMNO / BENEFICIARIO', fontBold, width, margin);
  curY -= 22;

  drawLabeledField(page, fontBold, fontRegular, 'Apellido y Nombres', alumno.apellidoNombre, margin + 8, curY, 260);
  drawLabeledField(page, fontBold, fontRegular, 'D.N.I.', alumno.dni, margin + 280, curY, 120);
  drawLabeledField(page, fontBold, fontRegular, 'Edad', `${alumno.edad} años`, margin + 410, curY, 100);
  curY -= 16;

  drawLabeledField(page, fontBold, fontRegular, 'Fecha de Nacimiento', alumno.fechaNacimiento, margin + 8, curY, 220);
  drawLabeledField(page, fontBold, fontRegular, 'N° de Afiliado / Socio', alumno.numAfiliado, margin + 280, curY, 220);
  curY -= 16;

  drawLabeledField(page, fontBold, fontRegular, 'Diagnóstico Clínico', alumno.diagnostico, margin + 8, curY, 500);
  curY -= 26;

  // 2. Datos del Titular
  drawSectionTitle(page, curY, '2. DATOS DEL TITULAR A CARGO / RESPONSABLE PARENTAL', fontBold, width, margin);
  curY -= 22;

  drawLabeledField(page, fontBold, fontRegular, 'Nombre del Titular', alumno.nombreTitular, margin + 8, curY, 260);
  drawLabeledField(page, fontBold, fontRegular, 'D.N.I. Titular', alumno.dniTitular, margin + 280, curY, 120);
  drawLabeledField(page, fontBold, fontRegular, 'Parentesco', alumno.parentesco, margin + 410, curY, 100);
  curY -= 16;

  drawLabeledField(page, fontBold, fontRegular, 'N° Afiliado Titular', alumno.numAfiliadoTitular, margin + 8, curY, 260);
  drawLabeledField(page, fontBold, fontRegular, 'Obra Social / Prepaga', config.obraSocial, margin + 280, curY, 220);
  curY -= 26;

  // 3. Escuela Común
  drawSectionTitle(page, curY, '3. ESCUELA COMÚN DE INCLUSIÓN', fontBold, width, margin);
  curY -= 22;

  drawLabeledField(page, fontBold, fontRegular, 'Establecimiento Común', alumno.escuelaComun, margin + 8, curY, 260);
  drawLabeledField(page, fontBold, fontRegular, 'Nivel / Modalidad', config.nivel, margin + 280, curY, 120);
  drawLabeledField(page, fontBold, fontRegular, 'Grado / Turno', `${alumno.grado} - Turno ${alumno.turno}`, margin + 410, curY, 100);
  curY -= 16;

  drawLabeledField(page, fontBold, fontRegular, 'Dirección Establecimiento', alumno.direccionEscuela, margin + 8, curY, 500);
  curY -= 26;

  // 4. Modalidad y Cobertura
  drawSectionTitle(page, curY, '4. PRESTACIÓN Y PERÍODO DE COBERTURA SOLICITADO', fontBold, width, margin);
  curY -= 22;

  drawLabeledField(page, fontBold, fontRegular, 'Modalidad Solicitada', config.modalidad, margin + 8, curY, 260);
  drawLabeledField(page, fontBold, fontRegular, 'Ciclo Lectivo', config.anio, margin + 280, curY, 120);
  curY -= 16;

  drawLabeledField(page, fontBold, fontRegular, 'Período Solicitado', `Desde ${config.periodoDesde} hasta ${config.periodoHasta}`, margin + 8, curY, 260);
  drawLabeledField(page, fontBold, fontRegular, 'Lugar y Fecha Emisión', `${config.emisionLugar}, ${config.emisionFecha}`, margin + 280, curY, 220);
  curY -= 26;

  // 5. Cronograma Semanal
  drawSectionTitle(page, curY, '5. CRONOGRAMA HORARIO DE INTEGRACIÓN', fontBold, width, margin);
  curY -= 20;

  const dias = [
    { nombre: 'LUNES', h: cronograma.lunes },
    { nombre: 'MARTES', h: cronograma.martes },
    { nombre: 'MIÉRCOLES', h: cronograma.miercoles },
    { nombre: 'JUEVES', h: cronograma.jueves },
    { nombre: 'VIERNES', h: cronograma.viernes },
  ];

  const colW = (width - margin * 2) / 5;
  dias.forEach((d, idx) => {
    const colX = margin + idx * colW;
    page.drawRectangle({
      x: colX,
      y: curY - 26,
      width: colW - 4,
      height: 30,
      color: rgb(0.97, 0.97, 0.97),
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 0.5,
    });

    page.drawText(d.nombre, {
      x: colX + 6,
      y: curY - 10,
      size: 7.5,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    const horarioStr = d.h.activo ? `${d.h.desde} a ${d.h.hasta}` : 'Sin Asistencia';
    page.drawText(horarioStr, {
      x: colX + 6,
      y: curY - 22,
      size: 7,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });
  });

  drawFooter(page, fontRegular, fontBold, escuela, config.incluirFirmaDigital);

  return await pdfDoc.save();
}

// 2. PRESUPUESTO OFICIAL (Resolución Ministerial y Nomenclador de Discapacidad)
export async function generarPresupuestoPdf(
  alumno: AlumnoData,
  config: ConfiguracionLegajo,
  escuela: EscuelaConfig
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const { width } = page.getSize();
  const margin = 40;

  drawHeader(page, fontBold, fontRegular, escuela, 'Presupuesto Oficial de Prestaciones Básicas');

  let curY = 700;

  // Ref Box
  page.drawText(`Lugar y Fecha: ${config.emisionLugar}, ${config.emisionFecha}`, {
    x: width - margin - 220,
    y: curY,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });
  curY -= 18;

  page.drawText(`Señores`, { x: margin + 8, y: curY, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  curY -= 12;
  page.drawText(`${config.obraSocial.toUpperCase()} - Auditoría Médica y Discapacidad`, {
    x: margin + 8,
    y: curY,
    size: 10,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.3),
  });
  curY -= 20;

  // Intro text
  const intro = `Por medio de la presente, nos dirigimos a Uds. a fin de presupuestar el servicio correspondiente a la prestación de apoyo e inclusión escolar según Nomenclador de Prestaciones Básicas para Personas con Discapacidad (Ley 24.901).`;
  page.drawText(intro, {
    x: margin + 8,
    y: curY,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
    maxWidth: width - margin * 2 - 16,
  });
  curY -= 32;

  // Tabla Beneficiario
  drawSectionTitle(page, curY, 'DATOS DEL BENEFICIARIO Y PLAN', fontBold, width, margin);
  curY -= 22;
  drawLabeledField(page, fontBold, fontRegular, 'Beneficiario', alumno.apellidoNombre, margin + 8, curY, 260);
  drawLabeledField(page, fontBold, fontRegular, 'DNI', alumno.dni, margin + 280, curY, 120);
  drawLabeledField(page, fontBold, fontRegular, 'Afiliado N°', alumno.numAfiliado, margin + 410, curY, 100);
  curY -= 16;
  drawLabeledField(page, fontBold, fontRegular, 'Titular', `${alumno.nombreTitular} (${alumno.parentesco})`, margin + 8, curY, 260);
  drawLabeledField(page, fontBold, fontRegular, 'Diagnóstico', alumno.diagnostico, margin + 280, curY, 230);
  curY -= 28;

  // Detalle Arancelario Cuadro
  drawSectionTitle(page, curY, 'DETALLE ARANCELARIO - RESOLUCIÓN MINISTERIAL VIGENTE', fontBold, width, margin);
  curY -= 24;

  const boxW = width - margin * 2;
  page.drawRectangle({
    x: margin,
    y: curY - 100,
    width: boxW,
    height: 100,
    borderColor: rgb(0.2, 0.4, 0.25),
    borderWidth: 1.2,
    color: rgb(0.98, 0.99, 0.98),
  });

  page.drawText(`PRESTACIÓN: ${config.modalidad.toUpperCase()}`, {
    x: margin + 14,
    y: curY - 20,
    size: 9.5,
    font: fontBold,
    color: rgb(0.1, 0.25, 0.15),
  });

  page.drawText(`RESOLUCIÓN APLICABLE: ${config.resolucionMes}`, {
    x: margin + 14,
    y: curY - 36,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText(`PERÍODO DE COBERTURA: ${config.periodoDesde} A ${config.periodoHasta} (${config.anio})`, {
    x: margin + 14,
    y: curY - 50,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  const cuotaFormateada = formatearMoneda(config.matriculaCuota);
  const letrasMonto = numeroALetras(config.matriculaCuota);

  page.drawText(`VALOR MENSUAL / MATRÍCULA: ${cuotaFormateada}`, {
    x: margin + 14,
    y: curY - 72,
    size: 11,
    font: fontBold,
    color: rgb(0.05, 0.2, 0.6),
  });

  page.drawText(`SON: (${letrasMonto})`, {
    x: margin + 14,
    y: curY - 88,
    size: 7.5,
    font: fontOblique,
    color: rgb(0.1, 0.2, 0.5),
    maxWidth: boxW - 28,
  });

  curY -= 125;

  // Condiciones de Prestación
  page.drawText('CONDICIONES GENERALES DE FACTURACIÓN Y PRESTACIÓN:', {
    x: margin + 8,
    y: curY,
    size: 8,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  curY -= 14;

  const condiciones = [
    '1. La facturación se efectuará mensualmente a mes vencido conforme al Nomenclador de Prestaciones Básicas para Personas con Discapacidad.',
    '2. Los aranceles se ajustarán automáticamente a las resoluciones emitidas por el Ministerio de Salud / ANDIS para el sector discapacidad.',
    '3. Se adjuntará planilla de asistencia mensual firmada por la familia y la escuela común como constancia de prestación.',
    '4. La institución no percibe coseguro ni canon adicional a lo reglamentado por el Sistema Único de Prestaciones Básicas.',
  ];

  condiciones.forEach((c) => {
    page.drawText(c, {
      x: margin + 12,
      y: curY,
      size: 7.2,
      font: fontRegular,
      color: rgb(0.35, 0.35, 0.35),
    });
    curY -= 12;
  });

  drawFooter(page, fontRegular, fontBold, escuela, config.incluirFirmaDigital);

  return await pdfDoc.save();
}

// 3. PLAN DE TRABAJO PEDAGÓGICO DE LA ESCUELA ESPECIAL
export async function generarPlanTrabajoPdf(
  alumno: AlumnoData,
  config: ConfiguracionLegajo,
  escuela: EscuelaConfig,
  cronograma: CronogramaSemanal
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();
  const margin = 40;

  const isAE = config.modalidad.includes('MODALIDAD AE');
  const isConEquipo = config.modalidad.includes('CON EQUIPO');
  const isPrimaria = config.modalidad.includes('PRIMARIA');
  const isInicial = config.modalidad.includes('INICIAL');
  const isLaboral = config.modalidad.includes('LABORAL');

  let tituloDoc = 'Plan de Trabajo y Proyecto Pedagógico Individual';
  if (isAE) {
    tituloDoc = 'Plan de Trabajo - Módulo de Apoyo a la Integración (Modalidad AE)';
  } else if (isConEquipo) {
    tituloDoc = 'Plan de Trabajo - Módulo Apoyo a la Integración (Con Equipo)';
  } else if (isLaboral) {
    tituloDoc = 'Proyecto Formativo Laboral - Centro Formación Integral (CFI)';
  } else if (isPrimaria) {
    tituloDoc = 'Proyecto Pedagógico - Escolaridad Especial Primaria';
  } else if (isInicial) {
    tituloDoc = 'Proyecto Pedagógico - Escolaridad Especial Inicial';
  }

  drawHeader(page, fontBold, fontRegular, escuela, tituloDoc);

  let curY = 700;

  drawSectionTitle(page, curY, '1. SÍNTESIS DIAGNÓSTICA Y DATOS ESCOLARES', fontBold, width, margin);
  curY -= 20;
  drawLabeledField(page, fontBold, fontRegular, 'Alumno/a', alumno.apellidoNombre, margin + 8, curY, 260);
  drawLabeledField(page, fontBold, fontRegular, 'DNI', alumno.dni, margin + 280, curY, 120);
  drawLabeledField(page, fontBold, fontRegular, isAE || isConEquipo ? 'Escuela Inclusora' : 'Establecimiento', isAE || isConEquipo ? alumno.escuelaComun : escuela.nombreInstitucion, margin + 410, curY, 100);
  curY -= 16;
  drawLabeledField(page, fontBold, fontRegular, 'Prestación', config.modalidad, margin + 8, curY, 260);
  drawLabeledField(page, fontBold, fontRegular, 'Grado / Turno', `${alumno.grado} (${alumno.turno})`, margin + 280, curY, 120);
  curY -= 16;
  drawLabeledField(page, fontBold, fontRegular, 'Diagnóstico', alumno.diagnostico, margin + 8, curY, 500);
  curY -= 24;

  drawSectionTitle(page, curY, '2. OBJETIVOS ESPECÍFICOS DE LA PRESTACIÓN', fontBold, width, margin);
  curY -= 16;

  let objetivos: string[] = [];
  if (isAE) {
    objetivos = [
      `• Acompañamiento pedagógico y conductual directo en el aula común de ${alumno.escuelaComun} a cargo de Acompañante/Maestro de Apoyo (AE).`,
      `• Mediación de consignas didácticas, andamiaje en tiempo real y adaptación metodológica inmediata en las actividades cotidianas.`,
      `• Favorecer la permanencia, atención sostenida y autonomía gradual del estudiante en las diferentes asignaturas.`,
      `• Promover la interacción espontánea con el grupo de pares y la comunicación fluida con la docente titular de grado.`,
    ];
  } else if (isConEquipo) {
    objetivos = [
      `• Abordaje integral coordinado por el Equipo de Orientación de la Escuela Especial (Psicopedagogía, Fonoaudiología, Terapia Ocupacional y Psicología).`,
      `• Elaboración, seguimiento y actualización continua del Proyecto Pedagógico Individual (PPI) en articulación con ${alumno.escuelaComun}.`,
      `• Intervención del Maestro/a de Apoyo a la Inclusión (MAI) en el ámbito escolar y asesoramiento técnico-pedagógico al equipo directivo y docente.`,
      `• Evaluación trimestral de avances y adecuaciones curriculares de acceso y contenidos prioritarios.`,
    ];
  } else if (isLaboral) {
    objetivos = [
      `• Desarrollo de competencias pre-profesionales, técnicas y operativas en los talleres laborales del Centro de Formación Integral (CFI).`,
      `• Fomento de la autonomía personal, hábitos de puntualidad, seguridad en el trabajo y cumplimiento de pautas laborales.`,
      `• Orientación vocacional, habilidades sociales para la vida adulta e inclusión socio-comunitaria efectiva.`,
      `• Participación en proyectos productivos institucionales con rotación en áreas prácticas (gastronomía, carpintería, huerta y servicios).`,
    ];
  } else if (isPrimaria) {
    objetivos = [
      `• Desarrollo integral de aprendizajes según diseño curricular adaptado de Educación Especial de Nivel Primario.`,
      `• Consolidación de procesos de lectoescritura, cálculo, resolución de problemas y nociones del mundo social y natural.`,
      `• Estimulación psicomotriz, educación física, artes visuales y música adaptadas a las posibilidades del alumno.`,
      `• Fortalecimiento de la autoestima, habilidades de autorregulación emocional y convivencia grupal.`,
    ];
  } else {
    // Inicial
    objetivos = [
      `• Estimulación sensorio-motriz temprana, desarrollo psicomotor y organización del esquema corporal.`,
      `• Adquisición y expansión del lenguaje verbal y de sistemas aumentativos/alternativos de comunicación.`,
      `• Socialización a través del juego espontáneo, compartido y reglado en un entorno lúdico contenedor.`,
      `• Afianzamiento de hábitos de higiene, alimentación autónoma y rutinas pedagógicas iniciales.`,
    ];
  }

  objetivos.forEach((o) => {
    page.drawText(o, { x: margin + 8, y: curY, size: 7.8, font: fontRegular, color: rgb(0.2, 0.2, 0.2), maxWidth: width - margin * 2 - 16 });
    curY -= 14;
  });
  curY -= 8;

  drawSectionTitle(page, curY, '3. ESTRATEGIAS METODOLÓGICAS Y RECURSOS DIDÁCTICOS', fontBold, width, margin);
  curY -= 16;

  let estrategias: string[] = [];
  if (isAE) {
    estrategias = [
      '• Apoyo individualizado en mesa de trabajo: fraccionamiento de tareas extensas y uso de refuerzos positivos.',
      '• Anticipadores visuales y temporizadores para la transición armónica entre tareas áulicas y recreos.',
      '• Estrategias de descompresión emocional y regulación conductual dentro y fuera del salón.',
    ];
  } else if (isConEquipo) {
    estrategias = [
      '• Encuentros mensuales de articulación técnica entre la Escuela Especial, el Equipo Interdisciplinario y la Escuela Común.',
      '• Adecuación de material bibliográfico, evaluaciones diferenciadas y soportes digitales accesibles.',
      '• Orientación y pautas de acompañamiento para la familia en consonancia con los objetivos del PPI.',
    ];
  } else if (isLaboral) {
    estrategias = [
      '• Metodología de taller vivencial: aprendizaje basado en tareas prácticas, manejo seguro de herramientas y materiales.',
      '• Trabajo en equipo, división de roles y fomento de la responsabilidad laboral individual.',
      '• Talleres de formación para la vida independiente y desenvolvimiento autónomo en la vía pública.',
    ];
  } else {
    estrategias = [
      '• Material concreto multisensorial, secuencias ilustradas y apoyos visuales de alta claridad.',
      '• Rutinas escolares estructuradas con andamiaje permanente del docente de grupo.',
      '• Articulación con profesionales externos y seguimiento conjunto con el gabinete escolar.',
    ];
  }

  estrategias.forEach((e) => {
    page.drawText(e, { x: margin + 8, y: curY, size: 7.8, font: fontRegular, color: rgb(0.2, 0.2, 0.2), maxWidth: width - margin * 2 - 16 });
    curY -= 13;
  });
  curY -= 12;

  drawSectionTitle(page, curY, '4. CRONOGRAMA HORARIO DE LA PRESTACIÓN', fontBold, width, margin);
  curY -= 20;

  const dias = [
    { n: 'Lunes', h: cronograma.lunes },
    { n: 'Martes', h: cronograma.martes },
    { n: 'Miércoles', h: cronograma.miercoles },
    { n: 'Jueves', h: cronograma.jueves },
    { n: 'Viernes', h: cronograma.viernes },
  ];
  const colW = (width - margin * 2) / 5;
  dias.forEach((d, idx) => {
    const colX = margin + idx * colW;
    page.drawRectangle({
      x: colX,
      y: curY - 30,
      width: colW - 4,
      height: 32,
      color: rgb(0.96, 0.98, 0.96),
      borderColor: rgb(0.7, 0.8, 0.7),
      borderWidth: 0.5,
    });
    page.drawText(d.n.toUpperCase(), { x: colX + 6, y: curY - 12, size: 7.5, font: fontBold, color: rgb(0.15, 0.35, 0.2) });
    page.drawText(d.h.activo ? `${d.h.desde} a ${d.h.hasta}` : 'No concurre', {
      x: colX + 6,
      y: curY - 24,
      size: 7,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });
  });

  drawFooter(page, fontRegular, fontBold, escuela, config.incluirFirmaDigital);

  return await pdfDoc.save();
}

// 4. ACTA ACUERDO ENTRE ESCUELA ESPECIAL Y ESCUELA COMÚN
export async function generarActaAcuerdoPdf(
  alumno: AlumnoData,
  config: ConfiguracionLegajo,
  escuela: EscuelaConfig
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();
  const margin = 40;

  drawHeader(page, fontBold, fontRegular, escuela, 'Acta Acuerdo Interinstitucional de Inclusión');

  let curY = 700;

  page.drawText(
    `En la localidad de ${config.emisionLugar}, a los ${config.emisionFecha}, se reúnen las autoridades de los establecimientos:`,
    {
      x: margin + 8,
      y: curY,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    }
  );
  curY -= 18;

  page.drawText(`1. Por la Institución Especial Prestadora: ${escuela.nombreInstitucion} (${escuela.numeroInstitucion})`, {
    x: margin + 12,
    y: curY,
    size: 8,
    font: fontBold,
    color: rgb(0.15, 0.3, 0.2),
  });
  curY -= 14;

  page.drawText(`2. Por la Escuela Común Inclusora: ${alumno.escuelaComun} (Dirección: ${alumno.direccionEscuela})`, {
    x: margin + 12,
    y: curY,
    size: 8,
    font: fontBold,
    color: rgb(0.15, 0.3, 0.2),
  });
  curY -= 14;

  page.drawText(`3. Y el Titular / Adulto Responsable: ${alumno.nombreTitular} (DNI ${alumno.dniTitular})`, {
    x: margin + 12,
    y: curY,
    size: 8,
    font: fontBold,
    color: rgb(0.15, 0.3, 0.2),
  });
  curY -= 22;

  drawSectionTitle(page, curY, 'CLÁUSULAS DEL ACUERDO DE TRAYECTORIA EDUCATIVA', fontBold, width, margin);
  curY -= 16;

  const clausulas = [
    `PRIMERA: Ambas instituciones acuerdan el proyecto de integración e inclusión educativa del alumno/a ${alumno.apellidoNombre}, DNI ${alumno.dni}, para cursar el ${alumno.grado} durante el ciclo lectivo ${config.anio}.`,
    `SEGUNDA: La Escuela Especial proveerá el acompañamiento especializado, diseño del Proyecto Pedagógico Individual (PPI) y seguimiento del Maestro/a de Apoyo a la Inclusión (MAI).`,
    `TERCERA: La Escuela Común brindará los espacios pedagógicos y participativos requeridos, facilitando la articulación semanal con los docentes de grado y el Equipo de Orientación Escolar.`,
    `CUARTA: La familia se compromete a mantener la regularidad, la comunicación activa con ambos establecimientos y a entregar la documentación requerida por la Obra Social ${config.obraSocial}.`,
    `QUINTA: La acreditación, promoción y certificación de los aprendizajes se efectuará conforme a las normativas de Inclusión Escolar vigentes (Resolución CFE 311/16).`,
  ];

  clausulas.forEach((c) => {
    page.drawText(c, {
      x: margin + 8,
      y: curY,
      size: 7.8,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
      maxWidth: width - margin * 2 - 16,
    });
    curY -= 32;
  });

  // Three signature boxes at the bottom
  const sigY = 90;
  const colW = (width - margin * 2) / 3;

  // Sign 1: Especial
  page.drawLine({ start: { x: margin + 10, y: sigY + 30 }, end: { x: margin + colW - 20, y: sigY + 30 }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('Directora Escuela Especial', { x: margin + 10, y: sigY + 16, size: 7, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(escuela.nombreDirectora, { x: margin + 10, y: sigY + 6, size: 6.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  // Sign 2: Escuela Común
  const x2 = margin + colW;
  page.drawLine({ start: { x: x2 + 10, y: sigY + 30 }, end: { x: x2 + colW - 20, y: sigY + 30 }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('Directivo Escuela Común', { x: x2 + 10, y: sigY + 16, size: 7, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(alumno.escuelaComun.slice(0, 30), { x: x2 + 10, y: sigY + 6, size: 6.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  // Sign 3: Familia
  const x3 = margin + colW * 2;
  page.drawLine({ start: { x: x3 + 10, y: sigY + 30 }, end: { x: x3 + colW - 20, y: sigY + 30 }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('Firma Titular / Responsable', { x: x3 + 10, y: sigY + 16, size: 7, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`${alumno.nombreTitular}`, { x: x3 + 10, y: sigY + 6, size: 6.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  drawFooter(page, fontRegular, fontBold, escuela, false);

  return await pdfDoc.save();
}

// 5. CONSENTIMIENTO INFORMADO DEL TITULAR
export async function generarConsentimientoPdf(
  alumno: AlumnoData,
  config: ConfiguracionLegajo,
  escuela: EscuelaConfig
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();
  const margin = 40;

  drawHeader(page, fontBold, fontRegular, escuela, 'Consentimiento Informado del Titular');

  let curY = 700;

  drawSectionTitle(page, curY, 'DECLARACIÓN JURADA Y CONFORMIDAD FAMILIAR', fontBold, width, margin);
  curY -= 24;

  const texto1 = `Yo, ${alumno.nombreTitular.toUpperCase()}, D.N.I. N° ${alumno.dniTitular}, en mi carácter de ${alumno.parentesco.toUpperCase()} del/la menor ${alumno.apellidoNombre.toUpperCase()}, D.N.I. N° ${alumno.dni}, afiliado/a N° ${alumno.numAfiliado} ante la Obra Social / Prepaga ${config.obraSocial.toUpperCase()}:`;
  page.drawText(texto1, {
    x: margin + 8,
    y: curY,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
    maxWidth: width - margin * 2 - 16,
  });
  curY -= 40;

  const declaraciones = [
    `1. MANIFIESTO mi plena y libre conformidad para que el/la menor reciba las prestaciones de "${config.modalidad.toUpperCase()}" a cargo de la institución ${escuela.nombreInstitucion.toUpperCase()} durante el ciclo lectivo ${config.anio}.`,
    `2. AUTORIZO a la institución a presentar la documentación, informes pedagógicos y solicitudes de cobertura correspondientes ante la Obra Social ${config.obraSocial}.`,
    `3. DECLARO haber sido debidamente informado/a acerca de los alcances, objetivos, cronograma horario y modalidades de trabajo interdisciplinario a desarrollarse en ${alumno.escuelaComun}.`,
    `4. ME COMPROMETO a colaborar con las pautas del equipo profesional y a cumplimentar las planillas de asistencia mensual que certifiquen el efectivo cumplimiento de la prestación.`,
  ];

  declaraciones.forEach((d) => {
    page.drawText(d, {
      x: margin + 8,
      y: curY,
      size: 8,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
      maxWidth: width - margin * 2 - 16,
    });
    curY -= 36;
  });

  curY -= 30;
  page.drawText(`En prueba de conformidad, se suscribe la presente en ${config.emisionLugar}, a los ${config.emisionFecha}.`, {
    x: margin + 8,
    y: curY,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Signature box
  const sigX = width / 2 - 90;
  const sigY = 100;
  page.drawLine({ start: { x: sigX, y: sigY + 35 }, end: { x: sigX + 180, y: sigY + 35 }, thickness: 1, color: rgb(0.4, 0.4, 0.4) });
  page.drawText('Firma del Padre / Madre / Tutor Legal', { x: sigX + 15, y: sigY + 22, size: 7.5, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`Aclaración: ${alumno.nombreTitular}`, { x: sigX + 15, y: sigY + 10, size: 7, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`DNI: ${alumno.dniTitular}`, { x: sigX + 15, y: sigY, size: 7, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

  drawFooter(page, fontRegular, fontBold, escuela, false);

  return await pdfDoc.save();
}

// 6. CONSTANCIA DE ATENCIÓN Y RECEPCIÓN (CAR)
export async function generarCarPdf(
  alumno: AlumnoData,
  config: ConfiguracionLegajo,
  escuela: EscuelaConfig
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();
  const margin = 40;

  drawHeader(page, fontBold, fontRegular, escuela, 'Constancia de Atención y Recepción (CAR) - Cobertura');

  let curY = 700;

  drawSectionTitle(page, curY, 'IDENTIFICACIÓN DEL SERVICIO Y BENEFICIARIO', fontBold, width, margin);
  curY -= 20;

  drawLabeledField(page, fontBold, fontRegular, 'Obra Social / Financiador', config.obraSocial, margin + 8, curY, 260);
  drawLabeledField(page, fontBold, fontRegular, 'Período', `${config.periodoDesde} a ${config.periodoHasta} (${config.anio})`, margin + 280, curY, 220);
  curY -= 16;
  drawLabeledField(page, fontBold, fontRegular, 'Beneficiario/a', alumno.apellidoNombre, margin + 8, curY, 260);
  drawLabeledField(page, fontBold, fontRegular, 'N° Afiliado', alumno.numAfiliado, margin + 280, curY, 220);
  curY -= 16;
  drawLabeledField(page, fontBold, fontRegular, 'Titular', alumno.nombreTitular, margin + 8, curY, 260);
  drawLabeledField(page, fontBold, fontRegular, 'Prestación', config.modalidad, margin + 280, curY, 220);
  curY -= 28;

  drawSectionTitle(page, curY, 'CONFORMIDAD MENSUAL DE PRESTACIONES BRINDADAS', fontBold, width, margin);
  curY -= 20;

  const meses = ['Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const tableW = width - margin * 2;
  const rowH = 22;

  // Header row
  page.drawRectangle({
    x: margin,
    y: curY - rowH,
    width: tableW,
    height: rowH,
    color: rgb(0.2, 0.4, 0.25),
  });

  page.drawText('MES', { x: margin + 10, y: curY - 15, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('MODALIDAD / JORNADA', { x: margin + 80, y: curY - 15, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('CANT. HORAS/DÍAS', { x: margin + 260, y: curY - 15, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('FIRMA Y ACLARACIÓN DEL TITULAR / FAMILIAR', { x: margin + 370, y: curY - 15, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
  curY -= rowH;

  meses.forEach((mes, idx) => {
    const isAlt = idx % 2 === 1;
    page.drawRectangle({
      x: margin,
      y: curY - rowH,
      width: tableW,
      height: rowH,
      color: isAlt ? rgb(0.97, 0.98, 0.97) : rgb(1, 1, 1),
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 0.5,
    });

    page.drawText(mes, { x: margin + 10, y: curY - 14, size: 7.5, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(config.modalidad.slice(0, 32), { x: margin + 80, y: curY - 14, size: 7, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('Según cronograma', { x: margin + 260, y: curY - 14, size: 7, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

    // signature line inside cell
    page.drawLine({
      start: { x: margin + 375, y: curY - 18 },
      end: { x: margin + tableW - 15, y: curY - 18 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    curY -= rowH;
  });

  // Note: By rule, CAR requires handwritten family signature (not automatic digital signature)
  drawFooter(page, fontRegular, fontBold, escuela, false);

  return await pdfDoc.save();
}

// 7. PLANILLA ANUAL DE ASISTENCIA Y CONFORMIDAD
export async function generarPlanillaAsistenciaPdf(
  alumno: AlumnoData,
  config: ConfiguracionLegajo,
  escuela: EscuelaConfig
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();
  const margin = 40;

  drawHeader(page, fontBold, fontRegular, escuela, 'Planilla de Control y Asistencia Semanal');

  let curY = 700;
  drawLabeledField(page, fontBold, fontRegular, 'Alumno', alumno.apellidoNombre, margin + 8, curY, 260);
  drawLabeledField(page, fontBold, fontRegular, 'DNI', alumno.dni, margin + 280, curY, 120);
  drawLabeledField(page, fontBold, fontRegular, 'Ciclo Lectivo', config.anio, margin + 410, curY, 100);
  curY -= 16;
  drawLabeledField(page, fontBold, fontRegular, 'Escuela Común', alumno.escuelaComun, margin + 8, curY, 260);
  drawLabeledField(page, fontBold, fontRegular, 'Obra Social', config.obraSocial, margin + 280, curY, 220);
  curY -= 24;

  drawSectionTitle(page, curY, 'GRILLA DE FIRMAS SEMANALES POR SEMESTRE', fontBold, width, margin);
  curY -= 18;

  const semanas = [
    'Semana 1', 'Semana 2', 'Semana 3', 'Semana 4',
    'Semana 5', 'Semana 6', 'Semana 7', 'Semana 8',
    'Semana 9', 'Semana 10', 'Semana 11', 'Semana 12',
    'Semana 13', 'Semana 14', 'Semana 15', 'Semana 16'
  ];

  const tableW = width - margin * 2;
  const rowH = 19;

  // Header
  page.drawRectangle({
    x: margin,
    y: curY - rowH,
    width: tableW,
    height: rowH,
    color: rgb(0.2, 0.35, 0.25),
  });

  page.drawText('PERÍODO', { x: margin + 8, y: curY - 13, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('DÍAS Y HORAS ASISTIDAS', { x: margin + 110, y: curY - 13, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('CONFORMIDAD DOCENTE COMÚN', { x: margin + 260, y: curY - 13, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('CONFORMIDAD FAMILIAR / TITULAR', { x: margin + 390, y: curY - 13, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
  curY -= rowH;

  semanas.forEach((sem, idx) => {
    const isAlt = idx % 2 === 1;
    page.drawRectangle({
      x: margin,
      y: curY - rowH,
      width: tableW,
      height: rowH,
      color: isAlt ? rgb(0.97, 0.98, 0.97) : rgb(1, 1, 1),
      borderColor: rgb(0.85, 0.85, 0.85),
      borderWidth: 0.5,
    });

    page.drawText(sem, { x: margin + 8, y: curY - 13, size: 7, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('Cumplido según plan', { x: margin + 110, y: curY - 13, size: 7, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    // Lines for signatures
    page.drawLine({ start: { x: margin + 265, y: curY - 14 }, end: { x: margin + 375, y: curY - 14 }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
    page.drawLine({ start: { x: margin + 395, y: curY - 14 }, end: { x: margin + tableW - 10, y: curY - 14 }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });

    curY -= rowH;
  });

  drawFooter(page, fontRegular, fontBold, escuela, config.incluirFirmaDigital);

  return await pdfDoc.save();
}

// 8. PLANILLA DE FACTURACIÓN Y ADMINISTRACIÓN
export async function generarFacturacionPdf(
  alumno: AlumnoData,
  config: ConfiguracionLegajo,
  escuela: EscuelaConfig
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const { width } = page.getSize();
  const margin = 40;

  drawHeader(page, fontBold, fontRegular, escuela, 'Resumen de Facturación y Liquidación - Administración');

  let curY = 700;

  drawSectionTitle(page, curY, 'DATOS FISCALES E INSTITUCIONALES', fontBold, width, margin);
  curY -= 20;
  drawLabeledField(page, fontBold, fontRegular, 'Razón Social', escuela.nombreInstitucion, margin + 8, curY, 260);
  drawLabeledField(page, fontBold, fontRegular, 'CUIT', escuela.cuit, margin + 280, curY, 220);
  curY -= 16;
  drawLabeledField(page, fontBold, fontRegular, 'Registro SNR / Provincial', escuela.resolucionHabilitacion, margin + 8, curY, 500);
  curY -= 26;

  drawSectionTitle(page, curY, 'DATOS DEL AFILIADO Y EXPEDIENTE', fontBold, width, margin);
  curY -= 20;
  drawLabeledField(page, fontBold, fontRegular, 'Afiliado / Alumno', alumno.apellidoNombre, margin + 8, curY, 260);
  drawLabeledField(page, fontBold, fontRegular, 'DNI', alumno.dni, margin + 280, curY, 120);
  drawLabeledField(page, fontBold, fontRegular, 'N° Credencial', alumno.numAfiliado, margin + 410, curY, 100);
  curY -= 16;
  drawLabeledField(page, fontBold, fontRegular, 'Titular', alumno.nombreTitular, margin + 8, curY, 260);
  drawLabeledField(page, fontBold, fontRegular, 'Obra Social', config.obraSocial, margin + 280, curY, 220);
  curY -= 26;

  drawSectionTitle(page, curY, 'ESQUEMA DE LIQUIDACIÓN ARANCELARIA', fontBold, width, margin);
  curY -= 22;

  const boxW = width - margin * 2;
  page.drawRectangle({
    x: margin,
    y: curY - 90,
    width: boxW,
    height: 90,
    borderColor: rgb(0.2, 0.3, 0.4),
    borderWidth: 1,
    color: rgb(0.97, 0.98, 1),
  });

  page.drawText(`PRESTACIÓN: ${config.modalidad}`, { x: margin + 12, y: curY - 18, size: 9, font: fontBold, color: rgb(0.1, 0.2, 0.4) });
  page.drawText(`RESOLUCIÓN APLICABLE: ${config.resolucionMes}`, { x: margin + 12, y: curY - 32, size: 8, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`VALOR MENSUAL REGULADO: ${formatearMoneda(config.matriculaCuota)}`, { x: margin + 12, y: curY - 50, size: 10, font: fontBold, color: rgb(0.1, 0.4, 0.2) });
  page.drawText(`IMPORTE EN LETRAS: ${numeroALetras(config.matriculaCuota)}`, {
    x: margin + 12,
    y: curY - 66,
    size: 7.2,
    font: fontOblique,
    color: rgb(0.2, 0.2, 0.5),
    maxWidth: boxW - 24,
  });

  curY -= 115;
  drawFooter(page, fontRegular, fontBold, escuela, config.incluirFirmaDigital);

  return await pdfDoc.save();
}

/**
 * Estampa las etiquetas configuradas sobre la plantilla PDF base de un formulario custom
 */
export async function estamparFormularioCustom(
  form: FormularioCustomModel,
  alumno: AlumnoData,
  config: ConfiguracionLegajo,
  cronograma: CronogramaSemanal,
  escuela: EscuelaConfig
): Promise<Uint8Array> {
  if (!form.pdfBase64 || !form.pdfBase64.includes('base64,')) {
    throw new Error('El formulario no posee archivo PDF base');
  }
  const b64 = form.pdfBase64.split('base64,')[1];
  const binary = window.atob(b64);
  const pdfBytes = new Uint8Array(binary.length);
  for (let j = 0; j < binary.length; j++) {
    pdfBytes[j] = binary.charCodeAt(j);
  }

  const stampedDoc = await PDFDocument.load(pdfBytes);
  const fontRegularForm = await stampedDoc.embedFont(StandardFonts.Helvetica);
  const fontBoldForm = await stampedDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = stampedDoc.getPages();

  for (const campo of form.campos) {
    if (campo.pageIndex >= pages.length) continue;
    const page = pages[campo.pageIndex];

    const tagItem = TODAS_LAS_ETIQUETAS.find((t) => t.etiqueta === campo.etiqueta);
    let valor = '';
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

      const font = isBold ? fontBoldForm : fontRegularForm;

      page.drawText(limpio, {
        x: campo.x,
        y: campo.y,
        size: campo.fontSize,
        font: font,
        color: rgb(0.05, 0.15, 0.5),
      });
    }
  }

  return await stampedDoc.save();
}

// 9. GENERADOR MAESTRO Y UNIFICADOR DE PDF
export async function generarLegajoCompleto(
  alumno: AlumnoData,
  config: ConfiguracionLegajo,
  escuela: EscuelaConfig,
  cronograma: CronogramaSemanal,
  docs: DocumentosSeleccionados,
  adjuntosBytes?: { nombre: string; bytes: Uint8Array }[]
): Promise<{ unificado: Uint8Array; individuales: GeneratedDocument[] }> {
  const individuales: GeneratedDocument[] = [];

  // Asegurar que IndexedDB haya cargado todos los formularios custom antes de generar
  await ensureFormulariosLoaded();

  // Obtener formularios institucionales fijos que aplican al alumno según su prestación y nivel
  const customForms = getFormulariosCustom();
  const fijosJuntos = customForms.filter(
    (f) =>
      (f.tipoFormulario === 'fijo_juntos' ||
        (f.obraSocial || '').toUpperCase().includes('JUNTOS') ||
        (f.obraSocial || '').toUpperCase().includes('ESCUELA')) &&
      formularioAplicaAAlumno(f, config)
  );

  // 1. Ficha del Afiliado
  if (docs.ficha) {
    const bytes = await generarFichaAlumnoPdf(alumno, config, escuela, cronograma);
    individuales.push({
      id: 'ficha',
      nombre: `01_Ficha_Afiliado_${alumno.dni.replace(/\D/g, '')}.pdf`,
      blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
      pdfBytes: bytes,
    });
  }

  // 2. Presupuesto Oficial (discrimina por prestación: EGB JS, EGB JD, FL JS, FL JD, Inicial, Integración/AE)
  if (docs.presupuesto) {
    const formPresupuesto = fijosJuntos.find(
      (f) => getFormularioEffectiveMeta(f).rolDocumento === 'presupuesto'
    );
    if (formPresupuesto) {
      try {
        const bytes = await estamparFormularioCustom(formPresupuesto, alumno, config, cronograma, escuela);
        individuales.push({
          id: `presupuesto_${formPresupuesto.id}`,
          nombre: `02_Presupuesto_Oficial_${formPresupuesto.nombre.replace(/\s+/g, '_')}_${alumno.dni.replace(/\D/g, '')}.pdf`,
          blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
          pdfBytes: bytes,
        });
      } catch (err) {
        console.warn('Error estampando presupuesto custom, usando fallback:', err);
        const bytes = await generarPresupuestoPdf(alumno, config, escuela);
        individuales.push({
          id: 'presupuesto',
          nombre: `02_Presupuesto_Oficial_${config.obraSocial.split(' ')[0]}_${alumno.dni.replace(/\D/g, '')}.pdf`,
          blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
          pdfBytes: bytes,
        });
      }
    } else {
      const bytes = await generarPresupuestoPdf(alumno, config, escuela);
      individuales.push({
        id: 'presupuesto',
        nombre: `02_Presupuesto_Oficial_${config.obraSocial.split(' ')[0]}_${alumno.dni.replace(/\D/g, '')}.pdf`,
        blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
        pdfBytes: bytes,
      });
    }
  }

  // 3. Consentimiento Informado
  if (docs.consentimiento) {
    const bytes = await generarConsentimientoPdf(alumno, config, escuela);
    individuales.push({
      id: 'consentimiento',
      nombre: `03_Consentimiento_Informado_${alumno.dni.replace(/\D/g, '')}.pdf`,
      blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
      pdfBytes: bytes,
    });
  }

  // 4. Plan de Trabajo (discrimina por prestación y nivel: EGB JS, EGB JD, FL JS, FL JD, Inicial, o AE Primaria/Secundaria/Inicial)
  if (docs.planTrabajo) {
    const formPlanTrabajo = fijosJuntos.find(
      (f) => getFormularioEffectiveMeta(f).rolDocumento === 'plan_trabajo'
    );
    if (formPlanTrabajo) {
      try {
        const bytes = await estamparFormularioCustom(formPlanTrabajo, alumno, config, cronograma, escuela);
        individuales.push({
          id: `planTrabajo_${formPlanTrabajo.id}`,
          nombre: `04_Plan_Trabajo_${formPlanTrabajo.nombre.replace(/\s+/g, '_')}_${alumno.dni.replace(/\D/g, '')}.pdf`,
          blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
          pdfBytes: bytes,
        });
      } catch (err) {
        console.warn('Error estampando plan de trabajo custom, usando fallback:', err);
        const bytes = await generarPlanTrabajoPdf(alumno, config, escuela, cronograma);
        individuales.push({
          id: 'planTrabajo',
          nombre: `04_Plan_Trabajo_PPI_${alumno.dni.replace(/\D/g, '')}.pdf`,
          blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
          pdfBytes: bytes,
        });
      }
    } else {
      const bytes = await generarPlanTrabajoPdf(alumno, config, escuela, cronograma);
      individuales.push({
        id: 'planTrabajo',
        nombre: `04_Plan_Trabajo_PPI_${alumno.dni.replace(/\D/g, '')}.pdf`,
        blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
        pdfBytes: bytes,
      });
    }
  }

  // 5. CAR (Constancia de Alumno Regular - aplica a todos los alumnos)
  if (docs.car) {
    const formCar = fijosJuntos.find(
      (f) => getFormularioEffectiveMeta(f).rolDocumento === 'car'
    );
    if (formCar) {
      try {
        const bytes = await estamparFormularioCustom(formCar, alumno, config, cronograma, escuela);
        individuales.push({
          id: `car_${formCar.id}`,
          nombre: `05_Constancia_CAR_${formCar.nombre.replace(/\s+/g, '_')}_${alumno.dni.replace(/\D/g, '')}.pdf`,
          blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
          pdfBytes: bytes,
        });
      } catch (err) {
        console.warn('Error estampando CAR custom, usando fallback:', err);
        const bytes = await generarCarPdf(alumno, config, escuela);
        individuales.push({
          id: 'car',
          nombre: `05_Constancia_CAR_${config.obraSocial.split(' ')[0]}_${alumno.dni.replace(/\D/g, '')}.pdf`,
          blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
          pdfBytes: bytes,
        });
      }
    } else {
      const bytes = await generarCarPdf(alumno, config, escuela);
      individuales.push({
        id: 'car',
        nombre: `05_Constancia_CAR_${config.obraSocial.split(' ')[0]}_${alumno.dni.replace(/\D/g, '')}.pdf`,
        blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
        pdfBytes: bytes,
      });
    }
  }

  // 6. Acta Acuerdo Escuela Común
  if (docs.actaAcuerdo) {
    const bytes = await generarActaAcuerdoPdf(alumno, config, escuela);
    individuales.push({
      id: 'actaAcuerdo',
      nombre: `06_Acta_Acuerdo_EscuelaComun_${alumno.dni.replace(/\D/g, '')}.pdf`,
      blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
      pdfBytes: bytes,
    });
  }

  // 7. Planillas Anuales de Asistencia
  if (docs.planillasAsistencia) {
    const bytes = await generarPlanillaAsistenciaPdf(alumno, config, escuela);
    individuales.push({
      id: 'planillasAsistencia',
      nombre: `07_Planilla_Asistencia_Anual_${alumno.dni.replace(/\D/g, '')}.pdf`,
      blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
      pdfBytes: bytes,
    });
  }

  // 8. Planilla de Facturación Administrativa
  if (docs.planillaFacturacion) {
    const bytes = await generarFacturacionPdf(alumno, config, escuela);
    individuales.push({
      id: 'planillaFacturacion',
      nombre: `08_Planilla_Facturacion_Admin_${alumno.dni.replace(/\D/g, '')}.pdf`,
      blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
      pdfBytes: bytes,
    });
  }

  // 9. Otros Formularios Fijos Institucionales (categoría general)
  if (docs.formulariosFijosJuntos !== false) {
    const otrosFijos = fijosJuntos.filter((f) => {
      const meta = getFormularioEffectiveMeta(f);
      return meta.rolDocumento === 'general';
    });

    for (const form of otrosFijos) {
      try {
        const bytes = await estamparFormularioCustom(form, alumno, config, cronograma, escuela);
        individuales.push({
          id: `fijo_juntos_${form.id}`,
          nombre: `09_Formulario_Institucional_${form.nombre.replace(/\s+/g, '_')}_${alumno.dni.replace(/\D/g, '')}.pdf`,
          blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
          pdfBytes: bytes,
        });
      } catch (err) {
        console.warn('Error estampando formulario institucional fijo:', form.nombre, err);
      }
    }
  }

  // 10. Formularios Oficiales por Obra Social (Complementan la documentación fija escolar)
  if (docs.formulariosObraSocial !== false) {
    try {
      const formsOs = customForms.filter(
        (f) =>
          f.tipoFormulario !== 'fijo_juntos' &&
          !(f.obraSocial || '').toUpperCase().includes('JUNTOS') &&
          !(f.obraSocial || '').toUpperCase().includes('ESCUELA') &&
          formularioAplicaAAlumno(f, config)
      );

      for (const form of formsOs) {
        try {
          const bytes = await estamparFormularioCustom(form, alumno, config, cronograma, escuela);
          individuales.push({
            id: `os_${form.id}`,
            nombre: `10_Formulario_${(form.obraSocial || config.obraSocial).split(' ')[0]}_${form.nombre.replace(/\s+/g, '_')}_${alumno.dni.replace(/\D/g, '')}.pdf`,
            blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
            pdfBytes: bytes,
          });
        } catch (err) {
          console.warn('Error estampando formulario de obra social:', form.nombre, err);
        }
      }
    } catch (err) {
      console.warn('Error adjuntando formularios al legajo:', err);
    }
  }

  // Ahora creamos el PDF UNIFICADO copiando las páginas de todos los documentos seleccionados
  const mergedDoc = await PDFDocument.create();

  // Carátula del Legajo
  const coverPage = mergedDoc.addPage([595.28, 841.89]);
  const fontRegular = await mergedDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await mergedDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = coverPage.getSize();
  const margin = 40;

  // Carátula Header
  coverPage.drawRectangle({
    x: margin,
    y: height - 120,
    width: width - margin * 2,
    height: 80,
    color: rgb(0.12, 0.28, 0.16),
  });

  coverPage.drawText(escuela.nombreInstitucion.toUpperCase(), {
    x: margin + 20,
    y: height - 70,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  coverPage.drawText(`${escuela.numeroInstitucion} | CUIT: ${escuela.cuit} | ${escuela.localidad}`, {
    x: margin + 20,
    y: height - 90,
    size: 9,
    font: fontRegular,
    color: rgb(0.85, 0.95, 0.85),
  });

  // Central Title Box
  coverPage.drawRectangle({
    x: margin,
    y: height - 360,
    width: width - margin * 2,
    height: 200,
    borderColor: rgb(0.2, 0.4, 0.25),
    borderWidth: 2,
    color: rgb(0.97, 0.99, 0.97),
  });

  coverPage.drawText('LEGAJO ANUAL DE COBERTURA Y PRESTACIÓN', {
    x: margin + 25,
    y: height - 200,
    size: 15,
    font: fontBold,
    color: rgb(0.1, 0.3, 0.18),
  });

  coverPage.drawText(`CICLO LECTIVO ${config.anio}`, {
    x: margin + 25,
    y: height - 225,
    size: 12,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  coverPage.drawText(`ALUMNO/A: ${alumno.apellidoNombre.toUpperCase()}`, {
    x: margin + 25,
    y: height - 260,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.4),
  });

  coverPage.drawText(`D.N.I.: ${alumno.dni}   |   AFILIADO N°: ${alumno.numAfiliado}`, {
    x: margin + 25,
    y: height - 280,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  coverPage.drawText(`OBRA SOCIAL: ${config.obraSocial.toUpperCase()}`, {
    x: margin + 25,
    y: height - 300,
    size: 9.5,
    font: fontBold,
    color: rgb(0.15, 0.35, 0.2),
  });

  coverPage.drawText(`PRESTACIÓN: ${config.modalidad.toUpperCase()}`, {
    x: margin + 25,
    y: height - 320,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  coverPage.drawText(`ESCUELA COMÚN: ${alumno.escuelaComun} (${alumno.grado})`, {
    x: margin + 25,
    y: height - 340,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Índice de Contenido
  coverPage.drawText('ÍNDICE DE DOCUMENTACIÓN INCLUIDA EN ESTE LEGAJO:', {
    x: margin + 10,
    y: height - 400,
    size: 9.5,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  let indexY = height - 425;
  individuales.forEach((doc, idx) => {
    coverPage.drawText(`${idx + 1}. ${doc.nombre.replace('.pdf', '')}`, {
      x: margin + 20,
      y: indexY,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.25, 0.25, 0.25),
    });
    indexY -= 18;
  });

  if (adjuntosBytes && adjuntosBytes.length > 0) {
    adjuntosBytes.forEach((adj) => {
      coverPage.drawText(`• [DOCUMENTO ADJUNTO] ${adj.nombre}`, {
        x: margin + 20,
        y: indexY,
        size: 8.5,
        font: fontBold,
        color: rgb(0.1, 0.3, 0.5),
      });
      indexY -= 18;
    });
  }

  // Footer on cover
  coverPage.drawText(`Expediente escolar generado en ${config.emisionLugar}, el ${config.emisionFecha}`, {
    x: margin + 10,
    y: 50,
    size: 8,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Copiar páginas de cada documento generado
  for (const doc of individuales) {
    const subDoc = await PDFDocument.load(doc.pdfBytes);
    const copiedPages = await mergedDoc.copyPages(subDoc, subDoc.getPageIndices());
    copiedPages.forEach((p) => mergedDoc.addPage(p));
  }

  // Copiar páginas de adjuntos si existen y son PDFs
  if (adjuntosBytes && adjuntosBytes.length > 0) {
    for (const adj of adjuntosBytes) {
      try {
        const adjDoc = await PDFDocument.load(adj.bytes);
        const copiedAdjPages = await mergedDoc.copyPages(adjDoc, adjDoc.getPageIndices());
        copiedAdjPages.forEach((p) => mergedDoc.addPage(p));
      } catch (err) {
        console.warn('No se pudo incrustar adjunto como PDF directo:', adj.nombre, err);
      }
    }
  }

  const unificadoBytes = await mergedDoc.save();

  return {
    unificado: unificadoBytes,
    individuales,
  };
}
