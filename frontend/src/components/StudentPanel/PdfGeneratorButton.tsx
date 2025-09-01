import React from "react";


import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { Directivo, FullStudentData, Cycle } from "@/types";

import { FileUser } from "lucide-react";

import { Button } from "@/components/ui/button"

import { CertificadoDocument } from "@/pdf/certificadoDocument";
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { number } from "zod";

type NotaEnum =
    | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
    | '10-MH'
    | 'CV' | 'CV-5' | 'CV-6' | 'CV-7' | 'CV-8' | 'CV-9' | 'CV-10'
    | 'AM' | 'RC' | 'NE' | 'APTO' | 'NO APTO';

type NotasMasAltasPorCicloReturn = {
    id_ciclo: number;     // curso concreto (1º o 2º) dentro del ciclo
    id_modulo: number;
    modulo: string;
    codigo_modulo: string;
    mejor_nota: NotaEnum | null;
};

interface certificate_data {
    student_data: FullStudentData;
    cycle_data: Cycle;
    director_data: Directivo;
    secretario_data: Directivo;
}

// Fetch ciclos formativos data from API
async function getCicloByCodigo({ codigo }: { codigo: string }) {
    const response = await api.cycles.code[':codigo'].$get({
        param: { codigo }
    });

    if (!response) {
        throw new Error("server error");
    }

    const data = await response.json();      // { ciclo: … }
    return data.ciclo;
}

async function getDirectivoDataByCargo(cargo: string): Promise<Directivo> {
    const response = await api.directivos[':cargo'].$get({ param: { cargo: cargo } });
    const data = await response.json();
    const raw = data.directivo;

    return raw;
}

interface PdfCertificateGeneratorButtonProps {
    student_data: FullStudentData;
    cycle_code: string;
}

// Fetch las notas finales del estudiante en todo el ciclo (pilla las más altas)
async function getNotasAltasEstudiantePorCiclo(id_estudiante: number, id_ciclo: number): Promise<NotasMasAltasPorCicloReturn[]> {
    const response = await api.enrollments.notasAltas[":id_estudiante"][":id_ciclo"].$get({
        param: { id_estudiante: String(id_estudiante), id_ciclo: String(id_ciclo) },
    });
    if (!response.ok) throw new Error("Error obteniendo las notas más altas del estudiante.")

    const data = await response.json();
    return data.result as NotasMasAltasPorCicloReturn[];
}

const PdfCertificateGeneratorButton: React.FC<PdfCertificateGeneratorButtonProps> = ({ student_data, cycle_code }) => {

    const studentId = student_data.student.id_estudiante;

    const {
        data: secretarioData,            // objeto/array devuelto por la API
    } = useQuery({
        queryKey: ['secretario', "Secretario"],
        queryFn: () => getDirectivoDataByCargo("Secretario"),
        staleTime: 5 * 60 * 1000,               // 5 min de frescura
    });

    const {
        data: directorData,            // objeto/array devuelto por la API
    } = useQuery({
        queryKey: ['director', "Director"],
        queryFn: () => getDirectivoDataByCargo("Director"),
        staleTime: 5 * 60 * 1000,               // 5 min de frescura
    });

    const {
        data: cicloData,            // objeto/array devuelto por la API
    } = useQuery({
        queryKey: ['ciclo', cycle_code],            // <‑‑ clave de caché
        queryFn: ({ queryKey }) => {
            const [_key, cycleCode] = queryKey;
            return getCicloByCodigo({ codigo: cycleCode as string })
        },
        enabled: Boolean(cycle_code),               // solo dispara si hay código
        staleTime: 5 * 60 * 1000,               // 5 min de frescura
    });

    const firstCiclo = Array.isArray(cicloData) ? cicloData[0] : undefined;

    const { data: mergedEnrollments } = useQuery({
        queryKey: ["notas-altas", studentId, firstCiclo?.id_ciclo],
        queryFn: () =>
            getNotasAltasEstudiantePorCiclo(studentId, firstCiclo!.id_ciclo),
        enabled: Boolean(studentId && firstCiclo?.id_ciclo),
        staleTime: 5 * 60 * 1000,
    });

    const certificateData: certificate_data = {
        student_data: student_data,
        cycle_data: firstCiclo!,
        director_data: directorData!,
        secretario_data: secretarioData!,
        merged_enrollments: mergedEnrollments!
    }

    const canGenerate = Boolean(secretarioData && directorData && firstCiclo && mergedEnrollments);

    const handleGenerate = async () => {
        if (!canGenerate) return;
        try {
            // 1. Render to a Blob in memory
            const blob = await pdf(
                <CertificadoDocument data={certificateData} />
            ).toBlob();                              // web-only helper

            // 2. Trigger a download
            saveAs(blob, 'certificado-prueba.pdf');
            console.log('✅ PDF generado');
        } catch (err) {
            console.error('❌ Error generando PDF:', err);
        }
    };

    return (
        <Button variant="outline" onClick={handleGenerate}>
            <FileUser className="mr-1.5 h-6 w-6" /> Generar certificado
        </Button>
    )
}

export default PdfCertificateGeneratorButton;
