export interface AlumnoData {
  id?: string;
  apellidoNombre: string;
  dni: string;
  edad: number | string;
  fechaNacimiento: string;
  numAfiliado: string;
  diagnostico: string;
  escuelaComun: string;
  direccionEscuela: string;
  grado: string;
  turno: 'Mañana' | 'Tarde' | 'Jornada Completa' | 'Doble Escolaridad';
  
  // Titular
  nombreTitular: string;
  dniTitular: string;
  parentesco: 'Madre' | 'Padre' | 'Tutor/a Legal' | 'Abuelo/a' | 'Otro';
  numAfiliadoTitular: string;
}

export interface DiaHorario {
  desde: string;
  hasta: string;
  activo: boolean;
}

export interface CronogramaSemanal {
  lunes: DiaHorario;
  martes: DiaHorario;
  miercoles: DiaHorario;
  jueves: DiaHorario;
  viernes: DiaHorario;
}

export interface ConfiguracionLegajo {
  obraSocial: string;
  modalidad: string;
  nivel: 'Inicial' | 'Primaria' | 'Secundaria' | 'Formación Integral';
  anio: string;
  emisionLugar: string;
  emisionFecha: string;
  periodoDesde: string;
  periodoHasta: string;
  matriculaCuota: number;
  resolucionMes: string;
  incluirFirmaDigital: boolean;
}

export interface DocumentosSeleccionados {
  ficha: boolean;
  presupuesto: boolean;
  consentimiento: boolean;
  planTrabajo: boolean;
  car: boolean;
  docColegio: boolean;
  actaAcuerdo: boolean;
  planillasAsistencia: boolean;
  planillaFacturacion: boolean;
  formulariosFijosJuntos?: boolean;
  formulariosObraSocial?: boolean;
}

export type FormatoFinal = 'unificado' | 'separados';

export interface AdjuntoDoc {
  id: string;
  nombre: string;
  tipo: 'informe' | 'dni_carnet' | 'cud' | 'otro';
  fileDataUrl: string; // base64
  fileType: string;
}

export interface PresupuestoHistorialItem {
  id: string;
  fechaGeneracion: string;
  alumnoNombre: string;
  alumnoDni: string;
  alumnoAfiliado: string;
  obraSocial: string;
  modalidad: string;
  escuelaComun: string;
  grado: string;
  turno: string;
  periodo: string;
  anio: string;
  montoCuota: number;
  montoLetras: string;
  resolucion: string;
  titularNombre: string;
  titularDni: string;
  documentosIncluidos: string[];
}

export interface CampoEtiqueta {
  id: string;
  etiqueta: string; // ej. '{APELLIDO_NOMBRE}'
  nombreHumano: string;
  x: number;
  y: number;
  pageIndex: number;
  fontSize: number;
}

export type RolDocumentoFijo = 'presupuesto' | 'plan_trabajo' | 'car' | 'general';

export type PrestacionFijo =
  | 'todas'
  | 'egb_js'
  | 'egb_jd'
  | 'fl_js'
  | 'fl_jd'
  | 'inicial'
  | 'integracion'
  | 'ae'
  | 'integracion_ae';

export type NivelFijo = 'todos' | 'Inicial' | 'Primaria' | 'Secundaria' | 'Formación Integral';

export interface FormularioCustomModel {
  id: string;
  nombre: string;
  obraSocial: string;
  tipoFormulario?: 'fijo_juntos' | 'obra_social';
  rolDocumento?: RolDocumentoFijo;
  prestacionFijo?: PrestacionFijo;
  nivelFijo?: NivelFijo;
  descripcion: string;
  pdfBase64: string; // original PDF data
  campos: CampoEtiqueta[];
  fechaSubida: string;
}

export interface EscuelaConfig {
  nombreInstitucion: string;
  razonSocial?: string;
  numeroInstitucion: string;
  cuit: string;
  direccion: string;
  localidad: string;
  provincia: string;
  telefono: string;
  email: string;
  nombreDirectora: string;
  cargoDirectora: string;
  resolucionHabilitacion: string;
  firmaSelloBase64?: string; // Optional digital seal/signature
}

export type UserRole = 'admin' | 'operador';
