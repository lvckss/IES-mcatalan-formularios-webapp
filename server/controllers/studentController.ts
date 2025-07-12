import sql from '../db/db'
import { type PostStudent, type Student, StudentSchema } from "../models/Student";
// Types para la obtención de todos los datos
import {
  type FullRawStudentData,
  type FullStudentData,
  FullRawStudentDataSchema,
  type RecordExtended,
  type EnrollmentExtended
} from '../models/custom/FullStudentData';

export const getStudents = async (): Promise<Student[]> => {
  const results = await sql`SELECT * FROM Estudiantes`;
  return results.map((result: any) => StudentSchema.parse(result));
};

export const createStudent = async (student: PostStudent): Promise<Student> => {
  const results = await sql`
    INSERT INTO Estudiantes (nombre, apellido_1, apellido_2, id_legal, tipo_id_legal, fecha_nac, num_tfno, num_expediente)
    VALUES (${student.nombre}, ${student.apellido_1}, ${student.apellido_2 ?? null}, ${student.id_legal}, ${student.tipo_id_legal}, ${student.fecha_nac}, ${student.num_tfno ?? null}, ${student.num_expediente})
    RETURNING *
  `;
  return StudentSchema.parse(results[0]);
};

export const getStudentById = async (id: number): Promise<Student> => {
  const results = await sql`SELECT * FROM Estudiantes WHERE id_estudiante = ${id}`;
  return StudentSchema.parse(results[0]);
};

export const deleteStudent = async (id: number): Promise<Student> => {
  const results = await sql`DELETE FROM Estudiantes WHERE id_estudiante = ${id} RETURNING *`;
  return StudentSchema.parse(results[0]);
};

export const getStudentFullInfo = async (studentId: number): Promise<FullStudentData> => {
  const results = await sql`
    SELECT 
        est.id_estudiante,
        est.nombre AS student_nombre,
        est.apellido_1 AS student_apellido1,
        est.apellido_2 AS student_apellido2,
        est.id_legal AS student_id_legal,
        est.tipo_id_legal AS student_tipo_id_legal,
        est.fecha_nac AS student_fecha_nac,
        est.num_tfno AS student_num_tfno,
        est.num_expediente AS student_num_expediente,
        e.id_expediente,
        e.ano_inicio,
        e.ano_fin,
        e.fecha_pago_titulo::timestamp AS fecha_pago_titulo,
        e.id_ciclo AS record_id_ciclo,
        e.convocatoria AS convocatoria,
        c_record.nombre AS record_ciclo_nombre,
        c_record.codigo AS ciclo_codigo,
        mat.id_matricula,
        mat.nota AS nota,
        m.id_modulo,
        m.nombre AS module_nombre,
        m.codigo_modulo,
        m.id_ciclo AS module_id_ciclo,
        c_module.nombre AS module_ciclo_nombre,
        m.curso AS module_curso
    FROM 
        estudiantes est
    JOIN 
        expedientes e ON est.id_estudiante = e.id_estudiante
    JOIN 
        ciclos c_record ON e.id_ciclo = c_record.id_ciclo
    LEFT JOIN 
        matriculas mat ON e.id_expediente = mat.id_expediente
    LEFT JOIN 
        modulos m ON mat.id_modulo = m.id_modulo
    LEFT JOIN 
        ciclos c_module ON m.id_ciclo = c_module.id_ciclo
    WHERE 
        est.id_estudiante = ${studentId}
    ORDER BY 
        e.id_expediente, m.id_modulo;
  `;

  // Parse raw results with Zod schema
  const rawData = FullRawStudentDataSchema.parse({ fullInfo: results }).fullInfo;

  // Build student info from first record
  const {
    id_estudiante,
    student_nombre,
    student_apellido1,
    student_apellido2,
    student_id_legal,
    student_tipo_id_legal,
    student_fecha_nac,
    student_num_tfno,
    student_num_expediente
  } = rawData[0];

  const student: Student = {
    id_estudiante,
    nombre: student_nombre,
    apellido_1: student_apellido1,
    apellido_2: student_apellido2,
    id_legal: student_id_legal,
    tipo_id_legal: student_tipo_id_legal,
    fecha_nac: student_fecha_nac,
    num_expediente: student_num_expediente,
    num_tfno: student_num_tfno
  };

  // Group rows by expediente
  const expedienteMap = new Map<number, RecordExtended>();

  rawData.forEach(rec => {
    const expId = rec.id_expediente;

    if (!expedienteMap.has(expId)) {
      expedienteMap.set(expId, {
        id_expediente: expId,
        ano_inicio: rec.ano_inicio,
        ano_fin: rec.ano_fin,
        convocatoria: rec.convocatoria as RecordExtended['convocatoria'],
        fecha_pago_titulo: rec.fecha_pago_titulo ?? null,
        id_ciclo: rec.record_id_ciclo,
        ciclo_codigo: rec.ciclo_codigo,
        ciclo_nombre: rec.record_ciclo_nombre,
        enrollments: []
      });
    }

    const currentRecord = expedienteMap.get(expId)!;

    const enrollment: EnrollmentExtended = {
      id_matricula: rec.id_matricula!,
      id_modulo: rec.id_modulo,
      nota: rec.nota ?? null,
      nombre_modulo: rec.module_nombre,
      codigo_modulo: rec.codigo_modulo
    };

    currentRecord.enrollments.push(enrollment);
  });

  const records = Array.from(expedienteMap.values()) as RecordExtended[];

  return { student, records };
};