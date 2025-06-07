import type { Student } from "../Student";
import type { Enrollment } from "../Enrollment";
import type { Record } from "../Record";

import { z } from "zod";

export type EnrollmentExtended = Omit<Enrollment, "id_expediente"> & {
    nombre_modulo: string;
    codigo_modulo: string;
}

export type RecordExtended = Omit<Record, "id_estudiante"> & {
    ciclo_nombre: string;
    ciclo_codigo: string;
    enrollments: EnrollmentExtended[];
}

export type FullStudentData = {
    student: Student;
    records: RecordExtended[];
}

// ----------------------------- RAW DATA TYPE

type StudentRecord = {
    id_estudiante: number;
    student_nombre: string;
    student_apellido1: string;
    student_apellido2: string;
    student_id_legal: string;
    student_fecha_nac: Date; // ISO date string
    student_num_tfno: string;
    id_expediente: number;
    ano_inicio: number;
    ano_fin: number;
    estado: string;
    record_id_ciclo: number;
    record_ciclo_nombre: string;
    ciclo_codigo: string;
    record_curso: string;
    id_matricula: number;
    status: string;
    turno: string;
    fecha_pago_titulo: Date | undefined;
    completion_status: string;
    id_modulo: number;
    module_nombre: string;
    codigo_modulo: string;
    module_id_ciclo: number;
    module_ciclo_nombre: string;
    module_curso: string;
  };
  
export type FullRawStudentData = {
    fullInfo: StudentRecord[];
};

const StudentRecordSchema = z.object({
  id_estudiante: z.number(),
  student_nombre: z.string(),
  student_apellido1: z.string(),
  student_apellido2: z.string().optional().nullable().optional(),
  student_id_legal: z.string(),
  student_fecha_nac: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) {
      const date = new Date(arg);
      if (!isNaN(date.getTime())) return date;
    }
    return arg;
  }, z.date()), // ISO date string, consider using z.date() if converting
  student_num_tfno: z.string().max(20).optional().nullable().optional(),
  id_expediente: z.number(),
  ano_inicio: z.number(),
  ano_fin: z.number(),
  estado: z.string(),
  turno: z.enum(['Diurno', 'Vespertino', 'Nocturno', 'Distancia']),
  fecha_pago_titulo: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) {
      const date = new Date(arg);
      if (!isNaN(date.getTime())) return date;
    }
    return arg;
  }, z.date().optional()),
  record_id_ciclo: z.number(),
  record_ciclo_nombre: z.string(),
  ciclo_codigo: z.string(),
  record_curso: z.string(),
  id_matricula: z.number(),
  status: z.string(),
  completion_status: z.string(),
  id_modulo: z.number(),
  codigo_modulo: z.string(),
  module_nombre: z.string(),
  module_id_ciclo: z.number(),
  module_ciclo_nombre: z.string(),
  module_curso: z.string(),
});

export const FullRawStudentDataSchema = z.object({
  fullInfo: z.array(StudentRecordSchema),
});
  