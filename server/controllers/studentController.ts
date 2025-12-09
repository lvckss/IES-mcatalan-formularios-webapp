import sql from '../db/db';
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
    INSERT INTO Estudiantes (nombre, apellido_1, apellido_2, sexo, id_legal, tipo_id_legal, fecha_nac, num_tfno, observaciones, requisito_academico)
    VALUES (${student.nombre}, ${student.apellido_1}, ${student.apellido_2 ?? null}, ${student.sexo}, ${student.id_legal}, ${student.tipo_id_legal}, ${student.fecha_nac}, ${student.num_tfno ?? null}, ${student.observaciones ?? null}, ${student.requisito_academico ?? true})
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

const u2n = <T>(v: T | undefined): T | null => (v === undefined ? null : v);

export const updateStudent = async (
  id: number,
  changes: Partial<PostStudent>
): Promise<Student> => {
  // Load current row so we never send undefined
  const current = await getStudentById(id);
  if (!current) throw new Error("NOT_FOUND");

  // Normalize everything to concrete values (string | null, boolean, Date)
  const merged = {
    nombre: changes.nombre ?? current.nombre,
    apellido_1: changes.apellido_1 ?? current.apellido_1,
    apellido_2: u2n(changes.apellido_2 ?? current.apellido_2 ?? null),
    sexo: changes.sexo ?? current.sexo,
    num_tfno: u2n(changes.num_tfno ?? current.num_tfno ?? null),
    id_legal: changes.id_legal ?? current.id_legal,
    tipo_id_legal: changes.tipo_id_legal ?? current.tipo_id_legal,
    // Ensure a Date instance (your Zod preprocess already handles string→Date)
    fecha_nac: changes.fecha_nac ?? current.fecha_nac,
    observaciones: u2n(changes.observaciones ?? current.observaciones ?? null),
    requisito_academico:
      changes.requisito_academico ?? current.requisito_academico,
  };

  try {
    const rows = await sql`
      UPDATE Estudiantes
      SET
        nombre = ${merged.nombre},
        apellido_1 = ${merged.apellido_1},
        apellido_2 = ${merged.apellido_2},
        sexo = ${merged.sexo},
        num_tfno = ${merged.num_tfno},
        id_legal = ${merged.id_legal},
        tipo_id_legal = ${merged.tipo_id_legal},
        fecha_nac = ${merged.fecha_nac},
        observaciones = ${merged.observaciones},
        requisito_academico = ${merged.requisito_academico}
      WHERE id_estudiante = ${id}
      RETURNING *
    `;
    if (!rows[0]) throw new Error("NOT_FOUND");
    return StudentSchema.parse(rows[0]);
  } catch (error: any) {
    // 23505 = unique_violation
    if (error?.code === '23505') throw new Error('UNIQUE_VIOLATION');
    throw error;
  }
};

// Tipo de retorno sugerido
type StudentWithExpediente = Student & {
  expediente_id: number;
  convocatoria: 'Ordinaria' | 'Extraordinaria';
  dado_baja: boolean;
};

export const getAllStudentsFromCycleYearCursoTurnoConvocatoria = async (
  cycle_code: string,
  ano_inicio: number,
  ano_fin: number,
  curso: string,
  turno: string,
  convocatoria: string
): Promise<StudentWithExpediente[]> => {

  const rows = await sql`
    WITH picked AS (
      SELECT DISTINCT ON (est.id_estudiante)
        est.*,
        exp.id_expediente AS expediente_id,
        exp.convocatoria,
        exp.dado_baja
      FROM estudiantes est
      JOIN expedientes exp ON est.id_estudiante = exp.id_estudiante
      JOIN ciclos ci ON ci.id_ciclo = exp.id_ciclo
      WHERE ci.codigo = ${cycle_code}
        AND exp.ano_inicio = ${ano_inicio}
        AND exp.ano_fin = ${ano_fin}
        AND ci.curso = ${curso}
        AND exp.turno ILIKE ${turno}
        AND exp.convocatoria ILIKE ${convocatoria}
      ORDER BY
        est.id_estudiante,
        exp.id_expediente DESC 
    )
    SELECT * FROM picked
    ORDER BY apellido_1, apellido_2, nombre
  `;

  return rows.map((r): StudentWithExpediente => {
    const base: Student = StudentSchema.parse({
      ...r,
      fecha_nac: new Date(r.fecha_nac),
    });
    return {
      ...base,
      expediente_id: Number(r.expediente_id),
      convocatoria: r.convocatoria,
      dado_baja: r.dado_baja
    };
  });
};

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
        est.requisito_academico AS student_requisito_academico,
        e.id_expediente,
        e.ano_inicio,
        e.ano_fin,
        e.fecha_pago_titulo::timestamp AS fecha_pago_titulo,
        e.vino_traslado,
        e.dado_baja,
        e.id_ciclo AS record_id_ciclo,
        e.convocatoria AS convocatoria,
        e.turno AS turno,
        c_record.nombre AS record_ciclo_nombre,
        c_record.codigo AS ciclo_codigo,
        c_record.tipo_ciclo AS record_ciclo_tipo_ciclo,
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
    student_observaciones,
    student_requisito_academico
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
    observaciones: student_observaciones,
    requisito_academico: student_requisito_academico
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
        dado_baja: rec.dado_baja,
        id_ciclo: rec.record_id_ciclo,
        ciclo_codigo: rec.ciclo_codigo,
        ciclo_nombre: rec.record_ciclo_nombre,
        enrollments: []
      });
    }

    const currentRecord = expedienteMap.get(expId)!;

    if (rec.id_matricula == null || rec.id_modulo == null) {
      return;
    }

    const enrollment: EnrollmentExtended = {
      id_matricula: rec.id_matricula!,
      id_modulo: rec.id_modulo,
      id_estudiante: id_estudiante,
      nota: rec.nota ?? null,
      nombre_modulo: rec.module_nombre,
      codigo_modulo: rec.codigo_modulo,
      module_curso: rec.module_curso
    };
    currentRecord.enrollments.push(enrollment);
  });

  const records = Array.from(expedienteMap.values()) as RecordExtended[];

  return { student, records };
};

export const getAllStudentsFullInfo = async (): Promise<FullStudentData[]> => {
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
        est.requisito_academico AS student_requisito_academico,

        e.id_expediente,
        e.ano_inicio,
        e.ano_fin,
        e.fecha_pago_titulo::timestamp AS fecha_pago_titulo,
        e.vino_traslado,
        e.dado_baja,
        e.id_ciclo AS record_id_ciclo,
        e.convocatoria AS convocatoria,
        e.turno AS turno,

        c_record.nombre AS record_ciclo_nombre,
        c_record.codigo AS ciclo_codigo,
        c_record.tipo_ciclo AS record_ciclo_tipo_ciclo,
        c_module.tipo_ciclo AS module_ciclo_tipo_ciclo,

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
    ORDER BY 
        est.id_estudiante, e.id_expediente, m.id_modulo;
  `;

  // Igual que en tu función: parseamos con el mismo esquema
  const rawData = FullRawStudentDataSchema.parse({ fullInfo: results }).fullInfo;

  // Mapa por estudiante; cada uno lleva su propio expedienteMap
  const studentsMap = new Map<number, { student: Student; expedienteMap: Map<number, RecordExtended> }>();

  rawData.forEach(rec => {
    const sid = rec.id_estudiante;

    // 1) Crear el objeto student la primera vez
    if (!studentsMap.has(sid)) {
      const student: Student = {
        id_estudiante: rec.id_estudiante,
        nombre: rec.student_nombre,
        apellido_1: rec.student_apellido1,
        apellido_2: rec.student_apellido2,
        sexo: rec.student_sexo,
        id_legal: rec.student_id_legal,
        tipo_id_legal: rec.student_tipo_id_legal,
        fecha_nac: rec.student_fecha_nac,
        num_tfno: rec.student_num_tfno,
        observaciones: rec.student_observaciones,
        requisito_academico: rec.student_requisito_academico
      };

      studentsMap.set(sid, {
        student,
        expedienteMap: new Map<number, RecordExtended>()
      });
    }

    const sEntry = studentsMap.get(sid)!;

    // 2) Agrupar por expediente (mismo patrón que usas con Map)
    const expId = rec.id_expediente;
    if (!sEntry.expedienteMap.has(expId)) {
      sEntry.expedienteMap.set(expId, {
        id_expediente: expId,
        ano_inicio: rec.ano_inicio,
        ano_fin: rec.ano_fin,
        convocatoria: rec.convocatoria as RecordExtended['convocatoria'],
        turno: rec.turno,
        fecha_pago_titulo: rec.fecha_pago_titulo ?? null,
        vino_traslado: rec.vino_traslado,
        dado_baja: rec.dado_baja,
        id_ciclo: rec.record_id_ciclo,
        ciclo_codigo: rec.ciclo_codigo,
        ciclo_nombre: rec.record_ciclo_nombre,
        enrollments: []
      });
    }

    const currentRecord = sEntry.expedienteMap.get(expId)!;

    if (rec.id_matricula == null || rec.id_modulo == null) {
      return;
    }

    // 3) Enrollment (mantenemos el mismo estilo que usas)
    const enrollment: EnrollmentExtended = {
      id_matricula: rec.id_matricula!, // mismo non-null assertion que ya usas
      id_modulo: rec.id_modulo,
      id_estudiante: sid,
      nota: rec.nota ?? null,
      nombre_modulo: rec.module_nombre,
      codigo_modulo: rec.codigo_modulo,
      module_curso: rec.codigo_modulo
    };

    currentRecord.enrollments.push(enrollment);
  });

  // 4) Convertimos los Maps a arrays y devolvemos el mismo shape
  const all: FullStudentData[] = Array.from(studentsMap.values()).map(({ student, expedienteMap }) => ({
    student,
    records: Array.from(expedienteMap.values()) as RecordExtended[]
  }));

  return all;
};

export const getStudentFullInfoByCycleCode = async (
  studentId: number,
  cycleCode: string
): Promise<FullStudentData> => {
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
        est.requisito_academico AS student_requisito_academico,

        e.id_expediente,
        e.ano_inicio,
        e.ano_fin,
        e.fecha_pago_titulo::timestamp AS fecha_pago_titulo,
        e.vino_traslado,
        e.dado_baja,
        e.id_ciclo AS record_id_ciclo,
        e.convocatoria AS convocatoria,
        e.turno AS turno,

        c_record.nombre AS record_ciclo_nombre,
        c_record.codigo AS ciclo_codigo,
        c_record.tipo_ciclo AS record_ciclo_tipo_ciclo,

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
        AND c_record.codigo = ${cycleCode}  -- AQUÍ ES DONDE FILTRAMOS POR CYCLE_CODE
    ORDER BY 
        e.id_expediente, m.id_modulo;
  `;

  if (results.length === 0) {
    throw new Error("NO_RECORDS_FOR_STUDENT_AND_CYCLE");
  }

  const rawData = FullRawStudentDataSchema.parse({ fullInfo: results }).fullInfo;

  // ---- Misma lógica que en getStudentFullInfo ----

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
    student_observaciones,
    student_requisito_academico
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
    observaciones: student_observaciones,
    requisito_academico: student_requisito_academico
  };

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
        dado_baja: rec.dado_baja,
        id_ciclo: rec.record_id_ciclo,
        ciclo_codigo: rec.ciclo_codigo,
        ciclo_nombre: rec.record_ciclo_nombre,
        enrollments: []
      });
    }

    const currentRecord = expedienteMap.get(expId)!;

    if (rec.id_matricula == null || rec.id_modulo == null) {
      return;
    }

    const enrollment: EnrollmentExtended = {
      id_matricula: rec.id_matricula!,
      id_modulo: rec.id_modulo,
      id_estudiante: id_estudiante,
      nota: rec.nota ?? null,
      nombre_modulo: rec.module_nombre,
      codigo_modulo: rec.codigo_modulo,
      module_curso: rec.module_curso
    };

    currentRecord.enrollments.push(enrollment);
  });

  const records = Array.from(expedienteMap.values()) as RecordExtended[];

  return { student, records };
};