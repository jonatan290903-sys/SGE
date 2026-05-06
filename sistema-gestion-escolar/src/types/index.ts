export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: 'estudiante' | 'docente' | 'padre' | 'administrativo' | 'directivo';
  phone: string;
  address: string;
  profile_image: string | null;
  created_at: string;
}

export interface Curso {
  id: number;
  nombre: string;
  nivel: 'inicial' | 'primaria' | 'secundaria';
  cantidad_secciones: number;
  periodo: string;
  estado: boolean;
}

export interface Estudiante {
  id: number;
  user: User;
  numero_expediente: string;
  documento: string;
  fecha_nacimiento: string;
  curso: Curso | null;
  estado: 'activo' | 'inactivo' | 'retirado' | 'egresado';
  created_at: string;
}

export interface Docente {
  id: number;
  user: User;
  documento: string;
  especialidad: string;
  titulo_profesional: string;
  fecha_contratacion: string;
  estado: 'activo' | 'inactivo';
}

export interface Materia {
  id: number;
  nombre: string;
  codigo: string;
  curso: Curso;
  docente: Docente | null;
  descripcion: string;
  numero_horas: number;
  creditos: number;
  estado: boolean;
}

export interface Inscripcion {
  id: number;
  estudiante: Estudiante;
  curso: Curso;
  fecha_inscripcion: string;
  estado: 'activo' | 'retirado' | 'culminado';
  registrada_por: string | null;
}

export interface Actividad {
  id: number;
  materia: number | null;
  nombre: string;
  descripcion: string;
  tipo: 'tarea' | 'examen' | 'proyecto' | 'participacion' | 'otro';
  trimestre: 'T1' | 'T2' | 'T3';
  fecha: string | null;
  es_plantilla: boolean;
  creada_por: number | null;
  created_at: string;
}

export interface Calificacion {
  id: number;
  estudiante: number;
  actividad: number;
  nota: number | null;
  fecha_modificacion: string;
  estudiante_nombre: string;
  actividad_nombre: string;
}

export type EstadoAsistencia = 'P' | 'F' | 'L';

export interface Asistencia {
  id: number;
  estudiante: number;
  materia: number;
  fecha: string;
  estado: EstadoAsistencia;
  motivo: string;
  registrada_por: number | null;
  fecha_registro: string;
  estudiante_nombre: string;
}

export interface ResumenAsistencia {
  estudiante_id: number;
  nombre: string;
  presentes: number;
  faltas: number;
  licencias: number;
}

export interface CentroNotasRow {
  estudiante_id: number;
  nombre: string;
  notas: Record<string, number | null>;
}

export interface CentroNotas {
  actividades: Actividad[];
  filas: CentroNotasRow[];
}

export interface Pago {
  id: number;
  estudiante_info: Estudiante;
  monto: string;
  concepto: 'matricula' | 'pension' | 'matricula_pension' | 'actividades' | 'otros';
  fecha_vencimiento: string;
  fecha_pago: string | null;
  estado: 'pendiente' | 'pagado' | 'vencido' | 'parcial' | 'cancelado';
  numero_comprobante: string;
  metodo_pago: string;
  referencia_pago: string;
  notas: string;
  dias_vencido: number;
  created_at: string;
}

export interface ClaseHorario {
  id: number;
  dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';
  materia: number | null;
  materia_nombre: string | null;
}

export interface PeriodoHorario {
  id: number;
  orden: number;
  hora_inicio: string;
  hora_fin: string;
  clases: ClaseHorario[];
}

export interface HorarioCurso {
  id: number;
  curso: number;
  periodos: PeriodoHorario[];
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}
