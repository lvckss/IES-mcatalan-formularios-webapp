export interface Certificado {
    id_certificado: number;
    id_alumno: number;
    fecha_expedicion: string;
    tipo_certificado: string;
    nota_media: string;
    estado_titulo: string;
    observaciones: string;
    requisito_academico: boolean;
}

export interface Calificacion {
    id_calificacion: number;
    id_alumno: number;
    id_modulo: number;
    calificacion: number;
    convocatoria: number;
    curso_escolar: string;
    estado_modulo: string;
    ano_escolar: string;
}

export interface Modulo {
    id_modulo: number;
    codigo_modulo: string;
    nombre_modulo: string;
    ciclo_asignado: number;
    duracion: number;
}

export interface CicloFormativo {
    id_ciclo: number;
    nombre_ciclo: string;
    nivel: string;
}

export interface Student {
    id_alumno: number;
    apellido1: string;
    apellido2: string;
    nombre: string;
    id_legal: string;
    fecha_nacimiento: string;
    code_expediente: string;
    certificados?: Certificado[];
    calificaciones?: Calificacion[];
    modulos?: Modulo[];
    ciclo_formativo?: CicloFormativo;
}