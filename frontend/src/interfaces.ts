export type Certificado = {
    id_certificado: number;
    id_alumno: number;
    fecha_expedicion: string;
    tipo_certificado: string;
    nota_media: string;
    estado_titulo: string;
    observaciones: string;
    requisito_academico: boolean;
}

export type Calificacion = {
    id_calificacion: number;
    id_alumno: number;
    id_modulo: number;
    calificacion: number;
    convocatoria: number;
    curso_escolar: string;
    estado_modulo: string;
    ano_escolar: string;
}

export type Modulo = {
    id_modulo: number;
    nombre: string;
    id_ciclo: number;
    curso: string;
}

export type CicloFormativo = {
    id_ciclo: number;
    nombre_ciclo: string;
    nivel: string;
}

export type Student = {
    id_estudiante: number;
    apellido_1: string;
    apellido_2: string;
    nombre: string;
    id_legal: string;
    fecha_nac: string;
}