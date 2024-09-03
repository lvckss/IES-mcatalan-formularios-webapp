import { query } from "../db";
import type { Certificado } from "../models/certificado";

export const getCertificados = async () => {
    return await query('SELECT * FROM certificados');
};

export const createCertificado = async (certificado: Certificado) => {
    return await query(
        'INSERT INTO certificados (id_alumno, fecha_expedicion, tipo_certificado, nota_media, estado_titulo, observaciones, requisito_academico) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [certificado.id_alumno, certificado.fecha_expedicion, certificado.tipo_certificado, certificado.nota_media, certificado.estado_titulo, certificado.observaciones, certificado.requisito_academico]
    );
};

export const getCertificadoById = async (id: number) => {
    return await query('SELECT * FROM certificados WHERE id_certificado = $1', [id]);
};

export const deleteCertificado = async (id: number) => {
    return await query('DELETE FROM certificados WHERE id_certificado = $1 RETURNING *', [id]);
};
