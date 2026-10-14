import * as XLSX from 'xlsx';
import { AlumnoData, PresupuestoHistorialItem } from '../types';

export interface ResolucionItem {
  id: string;
  resolucion: string;
  mes: string;
  anio: string;
  prestacion: string;
  arancel: number;
}

// 0. EXPORTAR TODOS LOS PRESUPUESTOS Y LEGAJOS REALIZADOS A EXCEL
export function exportarHistorialPresupuestosAExcel(historial: PresupuestoHistorialItem[]): void {
  const data = historial.map((h, index) => ({
    'N°': index + 1,
    'Fecha Emisión': h.fechaGeneracion,
    'Alumno (Apellido y Nombre)': h.alumnoNombre,
    'DNI Alumno': h.alumnoDni,
    'N° Afiliado': h.alumnoAfiliado,
    'Obra Social': h.obraSocial,
    'Prestación Solicitada': h.modalidad,
    'Escuela Común': h.escuelaComun,
    'Grado / Turno': `${h.grado} (${h.turno})`,
    'Período Cobertura': h.periodo,
    'Ciclo Lectivo': h.anio,
    'Valor Mensual / Cuota ($)': h.montoCuota,
    'Importe en Letras': h.montoLetras,
    'Resolución Aplicada': h.resolucion,
    'Titular / Responsable': h.titularNombre,
    'DNI Titular': h.titularDni,
    'Documentación Emitida': h.documentosIncluidos.join(', '),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 5 },  // N°
    { wch: 14 }, // Fecha
    { wch: 32 }, // Alumno
    { wch: 14 }, // DNI
    { wch: 18 }, // Afiliado
    { wch: 20 }, // Obra Social
    { wch: 36 }, // Prestacion
    { wch: 28 }, // Escuela Comun
    { wch: 18 }, // Grado
    { wch: 24 }, // Periodo
    { wch: 12 }, // Anio
    { wch: 18 }, // Monto
    { wch: 55 }, // Letras
    { wch: 24 }, // Resolucion
    { wch: 28 }, // Titular
    { wch: 14 }, // DNI Titular
    { wch: 45 }, // Documentos
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial Presupuestos');

  const fechaHoy = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Historial_General_Presupuestos_Legajos_${fechaHoy}.xlsx`);
}

// 1. EXPORTAR ALUMNOS A EXCEL (.xlsx)
export function exportarAlumnosAExcel(alumnos: AlumnoData[]): void {
  const data = alumnos.map((a, index) => ({
    'N°': index + 1,
    'Apellido y Nombre': a.apellidoNombre,
    'DNI Alumno': a.dni,
    'Edad': a.edad,
    'Fecha de Nacimiento': a.fechaNacimiento,
    'N° Afiliado / Credencial': a.numAfiliado,
    'Diagnóstico (CUD / CIE-10)': a.diagnostico,
    'Escuela Común': a.escuelaComun,
    'Dirección Escuela Común': a.direccionEscuela,
    'Grado / Sala': a.grado,
    'Turno': a.turno,
    'Nombre Titular / Responsable': a.nombreTitular,
    'DNI Titular': a.dniTitular,
    'Parentesco': a.parentesco,
    'N° Afiliado Titular': a.numAfiliadoTitular,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-fit column widths
  const colWidths = [
    { wch: 5 },  // N°
    { wch: 32 }, // Apellido y Nombre
    { wch: 14 }, // DNI
    { wch: 8 },  // Edad
    { wch: 14 }, // Fecha Nacimiento
    { wch: 22 }, // Afiliado
    { wch: 40 }, // Diagnostico
    { wch: 30 }, // Escuela Comun
    { wch: 30 }, // Direccion
    { wch: 12 }, // Grado
    { wch: 14 }, // Turno
    { wch: 28 }, // Titular
    { wch: 14 }, // DNI Titular
    { wch: 14 }, // Parentesco
    { wch: 20 }, // Afiliado Titular
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumnos Escuela Especial');

  const fechaHoy = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Directorio_Alumnos_Escuela_Especial_${fechaHoy}.xlsx`);
}

// 2. DESCARGAR PLANTILLA EXCEL PARA ALUMNOS
export function descargarPlantillaExcelAlumnos(): void {
  const ejemplo = [
    {
      'Apellido y Nombre': 'PÉREZ, Juan Manuel',
      'DNI Alumno': '49.882.112',
      'Edad': 8,
      'Fecha de Nacimiento': '2018-05-14',
      'N° Afiliado / Credencial': '01-49882112/02',
      'Diagnóstico (CUD / CIE-10)': 'Trastorno del Espectro Autista (F84.0)',
      'Escuela Común': 'Colegio Mariano Moreno (EP N° 5)',
      'Dirección Escuela Común': 'Av. San Martín 1230',
      'Grado / Sala': '3° Grado',
      'Turno': 'Mañana',
      'Nombre Titular / Responsable': 'PÉREZ, Carlos Alberto',
      'DNI Titular': '31.220.445',
      'Parentesco': 'Padre',
      'N° Afiliado Titular': '01-49882112/00',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(ejemplo);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla Alumnos');
  XLSX.writeFile(workbook, 'Plantilla_Carga_Alumnos_Escuela.xlsx');
}

// 3. IMPORTAR ALUMNOS DESDE EXCEL (.xlsx / .csv)
export function importarAlumnosDesdeExcel(file: File): Promise<AlumnoData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        const alumnosParsed: AlumnoData[] = rawJson.map((row, idx) => {
          // Flexible key lookup
          const getVal = (...keys: string[]) => {
            for (const k of keys) {
              for (const rowKey of Object.keys(row)) {
                if (rowKey.trim().toLowerCase() === k.toLowerCase()) {
                  return String(row[rowKey] || '').trim();
                }
              }
            }
            return '';
          };

          const apellidoNombre = getVal('apellido y nombre', 'nombre y apellido', 'alumno', 'nombre') || `Alumno ${idx + 1}`;
          const dni = getVal('dni alumno', 'dni', 'documento', 'nro documento') || '';
          const edad = parseInt(getVal('edad'), 10) || '';
          const fechaNacimiento = getVal('fecha de nacimiento', 'fecha nacimiento', 'nacimiento') || '';
          const numAfiliado = getVal('n° afiliado / credencial', 'n° afiliado', 'afiliado', 'socio', 'credencial') || '';
          const diagnostico = getVal('diagnóstico (cud / cie-10)', 'diagnostico', 'cud', 'diagnóstico') || 'CUD Vigente';
          const escuelaComun = getVal('escuela común', 'escuela comun', 'escuela', 'colegio') || '';
          const direccionEscuela = getVal('dirección escuela común', 'direccion escuela', 'direccion') || '';
          const grado = getVal('grado / sala', 'grado', 'año', 'curso') || '';
          const turnoRaw = getVal('turno');
          const turno = turnoRaw.toLowerCase().includes('tarde')
            ? 'Tarde'
            : turnoRaw.toLowerCase().includes('doble')
            ? 'Doble Escolaridad'
            : turnoRaw.toLowerCase().includes('completa')
            ? 'Jornada Completa'
            : 'Mañana';

          const nombreTitular = getVal('nombre titular / responsable', 'nombre titular', 'titular', 'responsable', 'padre', 'madre') || '';
          const dniTitular = getVal('dni titular', 'dni responsable') || '';
          const parentescoRaw = getVal('parentesco');
          const parentesco = parentescoRaw.toLowerCase().includes('padre')
            ? 'Padre'
            : parentescoRaw.toLowerCase().includes('tutor')
            ? 'Tutor/a Legal'
            : parentescoRaw.toLowerCase().includes('abuel')
            ? 'Abuelo/a'
            : 'Madre';
          const numAfiliadoTitular = getVal('n° afiliado titular', 'afiliado titular') || numAfiliado;

          return {
            id: 'imp-' + Date.now() + '-' + idx,
            apellidoNombre,
            dni,
            edad,
            fechaNacimiento,
            numAfiliado,
            diagnostico,
            escuelaComun,
            direccionEscuela,
            grado,
            turno,
            nombreTitular,
            dniTitular,
            parentesco,
            numAfiliadoTitular,
          };
        });

        resolve(alumnosParsed);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// 4. PARSEAR EXCEL DE RESOLUCIONES Y ARANCELES
export function importarResolucionesDesdeExcel(file: File): Promise<ResolucionItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        const items: ResolucionItem[] = rawJson.map((row, idx) => {
          const getVal = (...keys: string[]) => {
            for (const k of keys) {
              for (const rowKey of Object.keys(row)) {
                if (rowKey.trim().toLowerCase().includes(k.toLowerCase())) {
                  return row[rowKey];
                }
              }
            }
            return '';
          };

          const resolucion = String(getVal('resolucion', 'resolución', 'norma') || 'Res. General').trim();
          const mes = String(getVal('mes', 'periodo', 'período') || '').trim();
          const anio = String(getVal('año', 'anio', 'ejercicio') || '2026').trim();
          const prestacion = String(getVal('prestacion', 'prestación', 'modalidad', 'modulo') || '').trim();
          const arancelNum = parseFloat(String(getVal('arancel', 'cuota', 'monto', 'valor', 'arancel cuota')).replace(/[^0-9.]/g, '')) || 0;

          return {
            id: 'res-' + idx + '-' + Date.now(),
            resolucion,
            mes,
            anio,
            prestacion,
            arancel: arancelNum,
          };
        });

        resolve(items);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// 5. DESCARGAR PLANTILLA EXCEL DE RESOLUCIONES
export function descargarPlantillaExcelResoluciones(): void {
  const datosEjemplo = [
    {
      'Resolución': '3487/2026',
      'Mes': 'SEPTIEMBRE',
      'Año': '2026',
      'Prestación': 'MÓDULO DE APOYO A LA INTEGRACIÓN ESCOLAR (CON EQUIPO)',
      'Valor Cuota': 770043.58,
    },
    {
      'Resolución': '3487/2026',
      'Mes': 'SEPTIEMBRE',
      'Año': '2026',
      'Prestación': 'MÓDULO DE APOYO A LA INTEGRACIÓN ESCOLAR (MODALIDAD AE)',
      'Valor Cuota': 620450.00,
    },
    {
      'Resolución': '3487/2026',
      'Mes': 'SEPTIEMBRE',
      'Año': '2026',
      'Prestación': 'ESCOLARIDAD ESPECIAL PRIMARIA JORNADA DOBLE',
      'Valor Cuota': 895200.00,
    },
    {
      'Resolución': '3487/2026',
      'Mes': 'SEPTIEMBRE',
      'Año': '2026',
      'Prestación': 'ESCOLARIDAD ESPECIAL PRIMARIA JORNADA SIMPLE',
      'Valor Cuota': 510300.00,
    },
    {
      'Resolución': '3487/2026',
      'Mes': 'SEPTIEMBRE',
      'Año': '2026',
      'Prestación': 'ESCOLARIDAD ESPECIAL INICIAL JORNADA SIMPLE',
      'Valor Cuota': 495000.00,
    },
    {
      'Resolución': '3487/2026',
      'Mes': 'SEPTIEMBRE',
      'Año': '2026',
      'Prestación': 'ESCOLARIDAD FORMACION LABORAL JORNADA DOBLE',
      'Valor Cuota': 895200.00,
    },
    {
      'Resolución': '3487/2026',
      'Mes': 'SEPTIEMBRE',
      'Año': '2026',
      'Prestación': 'ESCOLARIDAD FORMACION LABORAL JORNADA SIMPLE',
      'Valor Cuota': 510300.00,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(datosEjemplo);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Resoluciones Nomenclador');
  XLSX.writeFile(workbook, 'Plantilla_Resoluciones_Nomenclador_Discapacidad.xlsx');
}
