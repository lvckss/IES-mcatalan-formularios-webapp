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
  try {
    const results = await sql`
    INSERT INTO Estudiantes (nombre, apellido_1, apellido_2, sexo, id_legal, tipo_id_legal, fecha_nac, num_tfno, observaciones)
    VALUES (${student.nombre}, ${student.apellido_1}, ${student.apellido_2 ?? null}, ${student.sexo}, ${student.id_legal}, ${student.tipo_id_legal}, ${student.fecha_nac}, ${student.num_tfno ?? null}, ${student.observaciones ?? null})
    RETURNING *
  `;
    return StudentSchema.parse(results[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      throw new Error('UNIQUE_VIOLATION')
    }
    throw error
  }
};

export const getStudentById = async (id: number): Promise<Student> => {
  const results = await sql`SELECT * FROM Estudiantes WHERE id_estudiante = ${id}`;
  return StudentSchema.parse(results[0]);
};

export const getStudentByLegalId = async (legal_id: string): Promise<Student> => {
  const results = await sql`SELECT * FROM Estudiantes WHERE id_legal = ${legal_id}`;
  return StudentSchema.parse(results[0]);
}

export const deleteStudent = async (id: number): Promise<Student> => {
  const results = await sql`DELETE FROM Estudiantes WHERE id_estudiante = ${id} RETURNING *`;
  return StudentSchema.parse(results[0]);
};

export const updateStudentObservaciones = async (id: number, observaciones: string): Promise<Student> => {
  const results = await sql`
    UPDATE Estudiantes
    SET observaciones = ${observaciones}
    WHERE id_estudiante = ${id}
    RETURNING *
  `;
  if (!results[0]) throw new Error("No such student");
  return StudentSchema.parse(results[0]);
};

export const getAllStudentsFromCycleYearCurso = async (cycle_code: string, ano_inicio: number, ano_fin: number, curso: string): Promise<Student[]> => {
  const results = await sql`
    SELECT est.*
    FROM estudiantes est
    JOIN expedientes exp ON est.id_estudiante = exp.id_estudiante
    JOIN ciclos ci ON ci.id_ciclo = exp.id_ciclo
    WHERE ci.codigo = ${cycle_code} AND exp.ano_inicio = ${ano_inicio} AND exp.ano_fin = ${ano_fin} AND ci.curso = ${curso}
    ORDER BY est.apellido_1, est.apellido_2, est.nombre
  `;
  
  return results.map((result: any) => StudentSchema.parse(result));
}

export const getStudentFullInfo = async (studentId: number): Promise<FullStudentData> => {
  const results = await sql`
    SELECT 
        est.id_estudiante,
        est.nombre AS student_nombre,
        est.apellido_1 AS student_apellido1,
        est.apellido_2 AS student_apellido2,
        est.sexo AS student_sexo,
        est.id_legal AS student_id_legal,
        est.tipo_id_legal AS student_tipo_id_legal,
        est.fecha_nac AS student_fecha_nac,
        est.num_tfno AS student_num_tfno,
        est.observaciones AS student_observaciones,
        e.id_expediente,
        e.ano_inicio,
        e.ano_fin,
        e.fecha_pago_titulo::timestamp AS fecha_pago_titulo,
        e.vino_traslado,
        e.id_ciclo AS record_id_ciclo,
        e.convocatoria AS convocatoria,
        e.turno AS turno,
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
    student_sexo,
    student_id_legal,
    student_tipo_id_legal,
    student_fecha_nac,
    student_num_tfno,
    student_observaciones
  } = rawData[0];

  const student: Student = {
    id_estudiante,
    nombre: student_nombre,
    apellido_1: student_apellido1,
    apellido_2: student_apellido2,
    sexo: student_sexo,
    id_legal: student_id_legal,
    tipo_id_legal: student_tipo_id_legal,
    fecha_nac: student_fecha_nac,
    num_tfno: student_num_tfno,
    observaciones: student_observaciones
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
        turno: rec.turno,
        fecha_pago_titulo: rec.fecha_pago_titulo ?? null,
        vino_traslado: rec.vino_traslado,
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
      id_estudiante: id_estudiante,
      nota: rec.nota ?? null,
      nombre_modulo: rec.module_nombre,
      codigo_modulo: rec.codigo_modulo
    };
    currentRecord.enrollments.push(enrollment);
  });

  const records = Array.from(expedienteMap.values()) as RecordExtended[];

  return { student, records };
};