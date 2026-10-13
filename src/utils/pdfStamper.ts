import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { AlumnoData, ConfiguracionLegajo } from '../types';

export interface StampField {
  id: string;
  label: string;
  dataKey: keyof AlumnoData | keyof ConfiguracionLegajo | 'fechaCompleta' | 'montoLetras' | 'montoNumero';
  pageIndex: number;
  x: number;
  y: number;
  fontSize: number;
  colorHex?: string;
}

export interface PdfTemplateModel {
  id: string;
  nombre: string;
  obraSocial: string;
  descripcion: string;
  campos: StampField[];
}

// Plantillas preconfiguradas de ejemplo para rellenado directo de PDF
export const PLANTILLAS_PREDEFINIDAS: PdfTemplateModel[] = [
  {
    id: 'ase_solicitud_apoyo',
    nombre: 'ASE - Solicitud de Cobertura de Discapacidad',
    obraSocial: 'ASE',
    descripcion: 'Formulario de presentación anual para Integración Escolar (ASE)',
    campos: [
      { id: '1', label: 'Apellido y Nombres', dataKey: 'apellidoNombre', pageIndex: 0, x: 120, y: 710, fontSize: 9 },
      { id: '2', label: 'D.N.I.', dataKey: 'dni', pageIndex: 0, x: 420, y: 710, fontSize: 9 },
      { id: '3', label: 'N° de Afiliado', dataKey: 'numAfiliado', pageIndex: 0, x: 120, y: 680, fontSize: 9 },
      { id: '4', label: 'Fecha Nacimiento', dataKey: 'fechaNacimiento', pageIndex: 0, x: 340, y: 680, fontSize: 9 },
      { id: '5', label: 'Diagnóstico', dataKey: 'diagnostico', pageIndex: 0, x: 120, y: 650, fontSize: 8.5 },
      { id: '6', label: 'Escuela Común', dataKey: 'escuelaComun', pageIndex: 0, x: 120, y: 590, fontSize: 9 },
      { id: '7', label: 'Grado / Turno', dataKey: 'grado', pageIndex: 0, x: 380, y: 590, fontSize: 9 },
      { id: '8', label: 'Titular a Cargo', dataKey: 'nombreTitular', pageIndex: 0, x: 120, y: 530, fontSize: 9 },
      { id: '9', label: 'DNI Titular', dataKey: 'dniTitular', pageIndex: 0, x: 420, y: 530, fontSize: 9 },
      { id: '10', label: 'Valor Mensual', dataKey: 'montoNumero', pageIndex: 0, x: 140, y: 440, fontSize: 9.5 },
      { id: '11', label: 'En Letras', dataKey: 'montoLetras', pageIndex: 0, x: 140, y: 415, fontSize: 7.5 },
    ],
  },
  {
    id: 'osde_anexo_integracion',
    nombre: 'OSDE - Anexo II Planilla de Solicitud de Prestación',
    obraSocial: 'OSDE Binario',
    descripcion: 'Anexo normativo de integración escolar para prestadores',
    campos: [
      { id: '1', label: 'Socio / Alumno', dataKey: 'apellidoNombre', pageIndex: 0, x: 130, y: 720, fontSize: 9 },
      { id: '2', label: 'N° Socio', dataKey: 'numAfiliado', pageIndex: 0, x: 440, y: 720, fontSize: 9 },
      { id: '3', label: 'DNI', dataKey: 'dni', pageIndex: 0, x: 130, y: 690, fontSize: 9 },
      { id: '4', label: 'Colegio', dataKey: 'escuelaComun', pageIndex: 0, x: 130, y: 640, fontSize: 9 },
      { id: '5', label: 'Importe Cuota', dataKey: 'montoNumero', pageIndex: 0, x: 150, y: 500, fontSize: 9 },
    ],
  },
];

/**
 * Superpone datos directamente sobre un PDF existente sin convertir a Word
 */
export async function rellenarPdfExistente(
  pdfBytesOriginal: Uint8Array,
  campos: StampField[],
  alumno: AlumnoData,
  config: ConfiguracionLegajo,
  montoLetras: string,
  montoFormateado: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytesOriginal);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();

  for (const campo of campos) {
    if (campo.pageIndex >= pages.length) continue;
    const page = pages[campo.pageIndex];

    let valor = '';
    if (campo.dataKey === 'montoLetras') {
      valor = montoLetras;
    } else if (campo.dataKey === 'montoNumero') {
      valor = montoFormateado;
    } else if (campo.dataKey === 'fechaCompleta') {
      valor = `${config.emisionLugar}, ${config.emisionFecha}`;
    } else if (campo.dataKey in alumno) {
      valor = String((alumno as any)[campo.dataKey] || '');
    } else if (campo.dataKey in config) {
      valor = String((config as any)[campo.dataKey] || '');
    }

    if (!valor) continue;

    page.drawText(valor, {
      x: campo.x,
      y: campo.y,
      size: campo.fontSize || 9,
      font: campo.dataKey === 'montoNumero' ? font : fontRegular,
      color: rgb(0.05, 0.15, 0.4), // Azul profesional típico de llenado
    });
  }

  // Also check if the PDF has native interactive Form Fields (AcroForms) and fill them automatically!
  try {
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    for (const field of fields) {
      const fieldName = field.getName().toLowerCase();
      try {
        if (field.constructor.name === 'PDFTextField') {
          const textField = form.getTextField(field.getName());
          if (fieldName.includes('nombre') || fieldName.includes('alumno')) {
            textField.setText(alumno.apellidoNombre);
          } else if (fieldName.includes('dni')) {
            textField.setText(alumno.dni);
          } else if (fieldName.includes('afiliado') || fieldName.includes('socio')) {
            textField.setText(alumno.numAfiliado);
          } else if (fieldName.includes('diagnostico')) {
            textField.setText(alumno.diagnostico);
          } else if (fieldName.includes('escuela') || fieldName.includes('colegio')) {
            textField.setText(alumno.escuelaComun);
          } else if (fieldName.includes('monto') || fieldName.includes('arancel') || fieldName.includes('cuota')) {
            textField.setText(montoFormateado);
          }
        }
      } catch (err) {
        // Skip individual unhandled field types
      }
    }
  } catch {
    // PDF didn't have AcroForms, coordinate stamping was already performed!
  }

  return await pdfDoc.save();
}
