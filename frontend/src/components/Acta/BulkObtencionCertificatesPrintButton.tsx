import React from "react";
import { pdf } from "@react-pdf/renderer";
import { Loader2, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  CertificadosObtencionLoteDocument,
  type CertificateData,
} from "@/pdf/certificadoObtencionTituloDocument";
import type {
  Cycle,
  Directivo,
  FullStudentData,
  NotasMasAltasPorCicloReturn,
} from "@/types";

async function getCyclesByCode(codigo: string): Promise<Cycle[]> {
  const response = await api.cycles.code[":codigo"].$get({ param: { codigo } });
  if (!response.ok) throw new Error("No se pudo cargar el ciclo del acta.");

  const data = await response.json();
  return Array.isArray(data.ciclo) ? data.ciclo : [];
}

async function getDirectivoByCargo(cargo: string): Promise<Directivo> {
  const response = await api.directivos[":cargo"].$get({ param: { cargo } });
  if (!response.ok) throw new Error(`No se pudo cargar el cargo ${cargo}.`);

  const data = await response.json();
  return data.directivo;
}

async function getStudentDataByCycleCode(
  studentId: number,
  cycleCode: string
): Promise<FullStudentData> {
  const response = await api.students.fullInfo[":id"].cycle[":cycle_code"].$get({
    param: { id: String(studentId), cycle_code: cycleCode },
  });
  const data = await response.json();

  if (!response.ok || "error" in data) {
    throw new Error("No se pudieron cargar los datos de uno de los alumnos.");
  }

  const raw = data.fullInfo;

  return {
    student: {
      ...raw.student,
      fecha_nac: new Date(raw.student.fecha_nac),
    },
    records: raw.records.map((record) => ({
      ...record,
      fecha_pago_titulo: record.fecha_pago_titulo
        ? new Date(record.fecha_pago_titulo)
        : undefined,
    })),
  };
}

async function getHighestGrades(
  studentId: number,
  cycleId: number
): Promise<NotasMasAltasPorCicloReturn[]> {
  const response = await api.enrollments.notasAltas[":id_estudiante"][":id_ciclo"].$get({
    param: { id_estudiante: String(studentId), id_ciclo: String(cycleId) },
  });
  if (!response.ok) {
    throw new Error("No se pudieron cargar las calificaciones de uno de los alumnos.");
  }

  const data = await response.json();
  return data.result as NotasMasAltasPorCicloReturn[];
}

function preparePrintWindow(): Window | null {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return null;

  printWindow.document.title = "Preparando certificados";
  printWindow.document.body.style.cssText =
    "margin:0;display:grid;place-items:center;min-height:100vh;font-family:Arial,sans-serif;color:#334155";

  const message = printWindow.document.createElement("p");
  message.textContent = "Preparando certificados para impresión...";
  printWindow.document.body.replaceChildren(message);

  return printWindow;
}

function showPrintPreview(printWindow: Window, blob: Blob) {
  const pdfUrl = URL.createObjectURL(blob);
  const doc = printWindow.document;

  doc.title = "Certificados de obtención del título";
  doc.body.style.cssText = "margin:0;height:100vh;display:flex;flex-direction:column;font-family:Arial,sans-serif";

  const toolbar = doc.createElement("div");
  toolbar.style.cssText =
    "display:flex;align-items:center;gap:12px;padding:10px 14px;background:#f8fafc;border-bottom:1px solid #cbd5e1;color:#334155;font-size:14px";

  const message = doc.createElement("span");
  message.textContent = "Si el diálogo de impresión no se abre automáticamente, pulsa Imprimir.";

  const printButton = doc.createElement("button");
  printButton.type = "button";
  printButton.textContent = "Imprimir";
  printButton.style.cssText =
    "margin-left:auto;padding:7px 14px;border:1px solid #94a3b8;border-radius:6px;background:white;cursor:pointer;font-weight:600";

  const iframe = doc.createElement("iframe");
  iframe.title = "Certificados de obtención del título";
  iframe.src = pdfUrl;
  iframe.style.cssText = "width:100%;flex:1;border:0";

  const requestPrint = () => {
    try {
      if (!iframe.contentWindow) {
        printWindow.focus();
        printWindow.print();
        return;
      }

      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch {
      printWindow.focus();
      printWindow.print();
    }
  };

  printButton.addEventListener("click", requestPrint);
  iframe.addEventListener("load", () => {
    window.setTimeout(requestPrint, 500);
  }, { once: true });

  toolbar.append(message, printButton);
  doc.body.replaceChildren(toolbar, iframe);

  let revoked = false;
  const revokePdfUrl = () => {
    if (revoked) return;
    URL.revokeObjectURL(pdfUrl);
    revoked = true;
  };

  printWindow.addEventListener("beforeunload", revokePdfUrl, { once: true });
  window.setTimeout(revokePdfUrl, 10 * 60 * 1000);
}

type BulkObtencionCertificatesPrintButtonProps = {
  studentIds: number[];
  cycleCode: string;
  cycleId?: number | null;
  disabled?: boolean;
};

const BulkObtencionCertificatesPrintButton: React.FC<BulkObtencionCertificatesPrintButtonProps> = ({
  studentIds,
  cycleCode,
  cycleId,
  disabled,
}) => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [loadedCount, setLoadedCount] = React.useState(0);

  const uniqueStudentIds = React.useMemo(
    () => Array.from(new Set(studentIds.filter((id) => Number.isFinite(id)))),
    [studentIds]
  );

  const handlePrint = async () => {
    const printWindow = preparePrintWindow();
    if (!printWindow) {
      toast.error("El navegador ha bloqueado la pestaña de impresión. Permite las ventanas emergentes e inténtalo de nuevo.");
      return;
    }

    setIsGenerating(true);
    setLoadedCount(0);

    try {
      const [cycles, director, secretario] = await Promise.all([
        getCyclesByCode(cycleCode),
        getDirectivoByCargo("Director"),
        getDirectivoByCargo("Secretario"),
      ]);

      const cycle = cycles.find((item) => item.id_ciclo === cycleId) ?? cycles[0];
      if (!cycle) throw new Error("No se encontró el ciclo seleccionado.");

      const certificates: CertificateData[] = [];
      const batchSize = 5;

      for (let index = 0; index < uniqueStudentIds.length; index += batchSize) {
        const batch = uniqueStudentIds.slice(index, index + batchSize);
        const batchCertificates = await Promise.all(
          batch.map(async (studentId): Promise<CertificateData> => {
            const [studentData, highestGrades] = await Promise.all([
              getStudentDataByCycleCode(studentId, cycleCode),
              getHighestGrades(studentId, cycle.id_ciclo),
            ]);

            return {
              student_data: studentData,
              cycle_data: cycle,
              director_data: director,
              secretario_data: secretario,
              merged_enrollments: highestGrades,
            };
          })
        );

        certificates.push(...batchCertificates);
        setLoadedCount(certificates.length);
      }

      if (printWindow.closed) {
        throw new Error("La pestaña de impresión se cerró antes de terminar.");
      }

      const blob = await pdf(
        <CertificadosObtencionLoteDocument certificates={certificates} />
      ).toBlob();

      showPrintPreview(printWindow, blob);
      toast.success(`${certificates.length} certificados preparados para impresión.`);
    } catch (error) {
      printWindow.close();
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudieron preparar los certificados."
      );
    } finally {
      setIsGenerating(false);
      setLoadedCount(0);
    }
  };

  const isDisabled =
    disabled ||
    isGenerating ||
    !cycleCode ||
    uniqueStudentIds.length === 0;

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handlePrint}
      disabled={isDisabled}
      title="Genera un único PDF con las calificaciones guardadas y abre el diálogo de impresión"
      className="w-full sm:w-auto"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Printer className="h-4 w-4" />
      )}
      <span className="ml-1">
        {isGenerating
          ? `Preparando certificados ${loadedCount}/${uniqueStudentIds.length}`
          : `Imprimir certificados (${uniqueStudentIds.length})`}
      </span>
    </Button>
  );
};

export default BulkObtencionCertificatesPrintButton;
