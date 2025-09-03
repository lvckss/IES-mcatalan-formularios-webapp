import React from "react";


import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { Directivo, FullStudentData } from "@/types";

import { toast } from "sonner";

import { FileUser } from "lucide-react";

import { Button } from "@/components/ui/button"

import { CertificadoObtencionDocument } from "@/pdf/certificadoObtencionTituloDocument";
import { CertificadoTrasladoDocument } from "@/pdf/certificadoTrasladoDocument";

import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';

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
  mejor_ano_inicio: number | null;
  mejor_ano_fin: number | null;
  convocatoria: number | null;
};

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

    // cicloData puede ser objeto o array; unifica:
    const cicloList = React.useMemo(() => {
        if (!cicloData) return [];
        return Array.isArray(cicloData) ? cicloData : [cicloData];
    }, [cicloData]);

    // el ciclo “base” que usarás para la query (si tu endpoint espera un único id_ciclo):
    const cicloForQuery = cicloList[0]; // si tu API ya hace el merge por 'código', con 1 basta

    const { data: mergedEnrollments } = useQuery({
        queryKey: ["notas-altas", studentId, cicloForQuery?.id_ciclo],
        queryFn: () => getNotasAltasEstudiantePorCiclo(studentId, cicloForQuery!.id_ciclo),
        enabled: Boolean(studentId && cicloForQuery?.id_ciclo),
        staleTime: 5 * 60 * 1000,
    });

    // botón deshabilitado si faltan datos
    const handleGenerate = async () => {
        if (!secretarioData || !directorData || !cicloForQuery || !mergedEnrollments || mergedEnrollments.length === 0) {
            toast.error("Faltan datos para generar el certificado.");
            return;
        }

        // 👇 NUNCA es null aquí; TS lo sabe por el guard de arriba
        const certificateData = {
            student_data,
            cycle_data: cicloForQuery,
            director_data: directorData,
            secretario_data: secretarioData,
            merged_enrollments: mergedEnrollments,
        };

        try {
            const blob = await pdf(<CertificadoTrasladoDocument data={certificateData} />).toBlob();
            saveAs(blob, "certificado-prueba.pdf");
        } catch (err) {
            console.error("❌ Error generando PDF:", err);
            toast.error("No se pudo generar el PDF.");
        }
    };

    return (
        <Button variant="outline" onClick={handleGenerate}>
            <FileUser className="mr-1.5 h-6 w-6" /> Generar certificado
        </Button>
    )
}

export default PdfCertificateGeneratorButton;
