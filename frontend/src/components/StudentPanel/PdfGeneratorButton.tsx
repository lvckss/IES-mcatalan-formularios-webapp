import React, { useState } from "react";

import { BlobProvider } from '@react-pdf/renderer';

import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { Directivo, FullStudentData, Cycle } from "@/types";

import { FileUser } from "lucide-react";

import { Button } from "@/components/ui/button"

import { CertificadoDocument } from "@/pdf/certificadoDocument";
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';

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

async function getDirectivoDataByCargo(cargo : string): Promise<Directivo> {
    const response = await api.directivos[':cargo'].$get({param: {cargo: cargo}});
    const data = await response.json();
    const raw = data.directivo;

    return raw;
}

interface PdfCertificateGeneratorButtonProps {
    student_data: FullStudentData;
    cycle_code: string;
}

const PdfCertificateGeneratorButton: React.FC<PdfCertificateGeneratorButtonProps> = ({ student_data, cycle_code }) => {

    const {
        data: secretarioData,            // objeto/array devuelto por la API
        isFetching: secretarioFetching,
        error: secretarioError,
    } = useQuery({
        queryKey: ['secretario', "Secretario"],
        queryFn: () => getDirectivoDataByCargo("Secretario"),
        staleTime: 5 * 60 * 1000,               // 5 min de frescura
    });

    const {
        data: directorData,            // objeto/array devuelto por la API
        isFetching: directorFetching,
        error: directorError,
    } = useQuery({
        queryKey: ['director', "Director"],
        queryFn: () => getDirectivoDataByCargo("Director"),
        staleTime: 5 * 60 * 1000,               // 5 min de frescura
    });

    const {
        data: cicloData,            // objeto/array devuelto por la API
        isFetching: cicloFetching,
        error: cicloError,
        status,
    } = useQuery({
        queryKey: ['ciclo', cycle_code],            // <‑‑ clave de caché
        queryFn: ({ queryKey }) => {
            const [_key, cycleCode] = queryKey;
            return getCicloByCodigo({ codigo: cycleCode as string })
        },
        enabled: Boolean(cycle_code),               // solo dispara si hay código
        staleTime: 5 * 60 * 1000,               // 5 min de frescura
    });

    const safeData = cicloData ?? [];
    const firstCiclo = safeData[0];

    const certificateData: certificate_data = {
        student_data: student_data,
        cycle_data: firstCiclo,
        director_data: directorData!,
        secretario_data: secretarioData!
    }

    const handleGenerate = async () => {
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

    console.log(certificateData)

    return (
        <Button variant="outline" onClick={handleGenerate}>
            <FileUser className="mr-1.5 h-6 w-6"/> Generar certificado
        </Button>
    )
}

export default PdfCertificateGeneratorButton;
