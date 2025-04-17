import sql from '../db/db'
import { type PostStudent, type Student, StudentSchema } from "../models/Student";
// Type para la obtención de todos los datos
import { type FullRawStudentData, type FullStudentData, FullRawStudentDataSchema } from '../models/custom/FullStudentData';

export const getStudents = async (): Promise<Student[]> => {
  const results = await sql`SELECT * FROM Estudiantes`;
  return results.map((result: any) => StudentSchema.parse(result));
};

export const createStudent = async (student: PostStudent): Promise<Student> => {
  const results = await sql`
    INSERT INTO Estudiantes (nombre, apellido_1, apellido_2, id_legal, fecha_nac, num_tfno)
    VALUES (${student.nombre}, ${student.apellido_1}, ${student.apellido_2 ?? null}, ${student.id_legal}, ${student.fecha_nac}, ${student.num_tfno ?? null})
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
        est.fecha_nac AS student_fecha_nac,
        est.num_tfno AS student_num_tfno,
        e.id_expediente,
        e.ano_inicio,
        e.ano_fin,
        e.estado,
        e.turno,
        e.fecha_pago_titulo,
        e.id_ciclo AS record_id_ciclo,
        c_record.nombre AS record_ciclo_nombre,
        c_record.codigo AS ciclo_codigo,
        e.curso AS record_curso,
        mat.id_matricula,
        mat.status,
        mat.completion_status,
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

  const results_parsed = FullRawStudentDataSchema.parse({ fullInfo: results }).fullInfo;
  const firstRecord = results_parsed[0]
  const student = {
    id_estudiante: firstRecord.id_estudiante,
    nombre: firstRecord.student_nombre,
    apellido_1: firstRecord.student_apellido1,
    apellido_2: firstRecord.student_apellido2,
    id_legal: firstRecord.student_id_legal,
    fecha_nac: firstRecord.student_fecha_nac,
    num_tfno: firstRecord.student_num_tfno
  };

  const recordGroup = {
    id_expediente: firstRecord.id_expediente,
    ano_inicio: firstRecord.ano_inicio,
    ano_fin: firstRecord.ano_fin,
    estado: firstRecord.estado as "Activo" | "Finalizado" | "Abandonado" | "En pausa",
    id_ciclo: firstRecord.record_id_ciclo,
    ciclo_codigo: firstRecord.ciclo_codigo,
    ciclo_nombre: firstRecord.record_ciclo_nombre,
    curso: firstRecord.record_curso,
    turno: firstRecord.turno,
    fecha_pago_titulo: firstRecord.fecha_pago_titulo,
    enrollments: results_parsed.map(rec => ({
      id_matricula: rec.id_matricula,
      status: rec.status as 'Matricula' | 'Convalidada'| 'Exenta' | 'Trasladada',
      completion_status: rec.completion_status as 'En proceso' | 'Completado' | 'Fallido' | 'Retirado',
      id_modulo: rec.id_modulo,
      nombre_modulo: rec.module_nombre,
      codigo_modulo: rec.codigo_modulo,
    }))
  };

  const fullStudentData = {
    student,
    records: [recordGroup]
  };

  return fullStudentData;
};
