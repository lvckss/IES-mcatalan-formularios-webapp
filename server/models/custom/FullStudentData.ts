import type { Student } from "../Student";
import type { Enrollment } from "../Enrollment";
import type { Record } from "../Record";
import { z } from "zod";

export type EnrollmentExtended = Omit<Enrollment, "id_expediente"> & {
  nombre_modulo: string | null;
  codigo_modulo: string | null;
  module_curso: string | null;
};

export type RecordExtended = Omit<Record, "id_estudiante"> & {
  ciclo_nombre: string;
  ciclo_codigo: string;
  tipo_ciclo?: "GM" | "GS";
  enrollments: EnrollmentExtended[];
};

export type FullStudentData = {
  student: Student;
  records: RecordExtended[];
};

// ----------------------------- RAW DATA TYPE

type StudentRecord = {
  id_estudiante: number;
  student_nombre: string;
  student_apellido1: string;
  student_apellido2: string | null;
  student_sexo: string;
  student_id_legal: string;
  student_tipo_id_legal: string;
  student_fecha_nac: Date;
  student_num_tfno: string | null;
  student_observaciones: string | null;
  student_requisito_academico: boolean;

  id_expediente: number;
  ano_inicio: number;
  ano_fin: number;
  record_id_ciclo: number;
  turno: string;
  convocatoria: string;

  record_ciclo_nombre: string;
  ciclo_codigo: string;
  record_ciclo_tipo_ciclo: "GM" | "GS";

  id_matricula: number | null;
  fecha_pago_titulo: Date | null;
  vino_traslado: boolean;
  dado_baja: boolean;

  id_modulo: number | null;
  module_nombre: string | null;
  codigo_modulo: string | null;
  module_id_ciclo: number | null;
  module_ciclo_nombre: string | null;
  module_ciclo_tipo_ciclo: "GM" | "GS" | null;
  module_curso: string | null;
};

export type FullRawStudentData = {
  fullInfo: StudentRecord[];
};

const StudentRecordSchema = z.object({
  id_estudiante: z.number(),
  student_nombre: z.string(),
  student_apellido1: z.string(),
  student_apellido2: z.string().nullable().optional(),
  student_sexo: z.enum(["Masculino", "Femenino", "Indefinido"]),
  student_id_legal: z.string(),
  student_tipo_id_legal: z.string(),
  student_fecha_nac: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) {
      const date = new Date(arg);
      if (!isNaN(date.getTime())) return date;
    }
    return arg;
  }, z.date()),
  student_num_tfno: z.string().max(20).nullable().optional(),
  student_observaciones: z.string().max(5000).nullable().optional(),
  student_requisito_academico: z.boolean().default(true),

  id_expediente: z.number(),
  ano_inicio: z.number(),
  ano_fin: z.number(),
  fecha_pago_titulo: z
    .preprocess((arg) => {
      if (typeof arg === "string" || arg instanceof Date) {
        const date = new Date(arg);
        if (!isNaN(date.getTime())) return date;
      }
      return arg;
    }, z.date().optional())
    .nullable(),
  vino_traslado: z.boolean().default(false),
  dado_baja: z.boolean().default(false),
  record_id_ciclo: z.number(),
  turno: z.enum(["Diurno", "Vespertino", "Nocturno", "A distancia"]),
  convocatoria: z.enum(["Ordinaria", "Extraordinaria"]),

  record_ciclo_nombre: z.string(),
  ciclo_codigo: z.string(),
  record_ciclo_tipo_ciclo: z.enum(["GM", "GS"]), // <- viene de c_record.tipo_ciclo

  id_matricula: z.number().nullable(),
  nota: z
    .enum([
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "10-MH",
      "10-Matr. Honor",
      "CV",
      "CV-5",
      "CV-6",
      "CV-7",
      "CV-8",
      "CV-9",
      "CV-10",
      "CV-10-MH",
      "TRAS-5",
      "TRAS-6",
      "TRAS-7",
      "TRAS-8",
      "TRAS-9",
      "TRAS-10",
      "TRAS-10-MH",
      "RC",
      "NE",
      "APTO",
      "NO APTO",
      "EX",
    ])
    .nullable(),

  id_modulo: z.number().nullable(),
  codigo_modulo: z.string().nullable(),
  module_nombre: z.string().nullable(),
  module_id_ciclo: z.number().nullable(),
  module_ciclo_nombre: z.string().nullable(),
  module_ciclo_tipo_ciclo: z.enum(["GM", "GS"]).nullable().optional(),
  module_curso: z.string().nullable(),
});

export const FullRawStudentDataSchema = z.object({
  fullInfo: z.array(StudentRecordSchema),
});