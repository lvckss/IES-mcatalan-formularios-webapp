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
  student_sexo: string;
  student_id_legal: string;
  student_tipo_id_legal: string;
  student_fecha_nac: Date; // ISO date string
  student_num_tfno: string;
  id_expediente: number;
  ano_inicio: number;
  ano_fin: number;
  record_id_ciclo: number;
  turno: string;
  convocatoria: string;
  record_ciclo_nombre: string;
  ciclo_codigo: string;
  id_matricula: number;
  fecha_pago_titulo: Date | undefined;
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
  student_sexo: z.enum(['Masculino', 'Femenino', 'Indefinido']),
  student_id_legal: z.string(),
  student_tipo_id_legal: z.string(),
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
  fecha_pago_titulo: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) {
      const date = new Date(arg);
      if (!isNaN(date.getTime())) return date;
    }
    return arg;
  }, z.date().optional()).nullable(),
  record_id_ciclo: z.number(),
  turno: z.enum(['Diurno', 'Vespertino', 'Nocturno', 'A distancia']),
  convocatoria: z.enum(['Ordinaria', 'Extraordinaria']),
  record_ciclo_nombre: z.string(),
  ciclo_codigo: z.string(),
  id_matricula: z.number(),
  nota: z.enum([
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    '10-MH',
    'CV', 'CV-5', 'CV-6', 'CV-7', 'CV-8', 'CV-9', 'CV-10',
    'AM', 'RC', 'NE', 'APTO', 'NO APTO'
  ]),
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