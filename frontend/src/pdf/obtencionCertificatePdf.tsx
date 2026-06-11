import { pdf } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";

import {
  CertificadoObtencionDocument,
  CertificadosObtencionLoteDocument,
  type CertificateData,
} from "@/pdf/certificadoObtencionTituloDocument";
import { getCompetenciasPdfUrl } from "@/pdf/competencias/competenciasRegistry";

const competenciasBytesCache = new Map<string, Promise<ArrayBuffer>>();

async function getCompetenciasBytes(url: string): Promise<ArrayBuffer> {
  let request = competenciasBytesCache.get(url);

  if (!request) {
    request = fetch(url).then((response) => {
      if (!response.ok) {
        throw new Error(`No se pudo cargar el anexo de competencias (${response.status}).`);
      }

      return response.arrayBuffer();
    });
    competenciasBytesCache.set(url, request);
  }

  try {
    return await request;
  } catch (error) {
    competenciasBytesCache.delete(url);
    throw error;
  }
}

function createPdfBlob(bytes: Uint8Array): Blob {
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;

  return new Blob([buffer], { type: "application/pdf" });
}

async function appendCompetencias(
  certificateBlob: Blob,
  codigoCiclo: string
): Promise<Blob> {
  const competenciasUrl = getCompetenciasPdfUrl(codigoCiclo);
  if (!competenciasUrl) return certificateBlob;

  const [certificateBytes, competenciasBytes] = await Promise.all([
    certificateBlob.arrayBuffer(),
    getCompetenciasBytes(competenciasUrl),
  ]);

  const certificateDocument = await PDFDocument.load(certificateBytes);
  const competenciasDocument = await PDFDocument.load(competenciasBytes);
  const competenciasPages = await certificateDocument.copyPages(
    competenciasDocument,
    competenciasDocument.getPageIndices()
  );

  competenciasPages.forEach((page) => certificateDocument.addPage(page));

  return createPdfBlob(await certificateDocument.save());
}

export async function generateObtencionCertificatePdf(
  data: CertificateData
): Promise<Blob> {
  const certificateBlob = await pdf(
    <CertificadoObtencionDocument data={data} />
  ).toBlob();

  return appendCompetencias(certificateBlob, data.cycle_data.codigo);
}

export async function generateObtencionCertificatesPdf(
  certificates: CertificateData[]
): Promise<Blob> {
  const certificateBlob = await pdf(
    <CertificadosObtencionLoteDocument certificates={certificates} />
  ).toBlob();
  const competenciasUrls = certificates.map((certificate) =>
    getCompetenciasPdfUrl(certificate.cycle_data.codigo)
  );

  if (competenciasUrls.every((url) => url === undefined)) {
    return certificateBlob;
  }

  const certificateDocument = await PDFDocument.load(
    await certificateBlob.arrayBuffer()
  );

  if (certificateDocument.getPageCount() !== certificates.length) {
    throw new Error(
      "No se pueden intercalar las competencias porque un certificado ocupa más de una página."
    );
  }

  const competenciasDocuments = new Map<string, PDFDocument>();
  const uniqueUrls = Array.from(
    new Set(competenciasUrls.filter((url): url is string => Boolean(url)))
  );

  await Promise.all(
    uniqueUrls.map(async (url) => {
      const document = await PDFDocument.load(await getCompetenciasBytes(url));
      competenciasDocuments.set(url, document);
    })
  );

  const mergedDocument = await PDFDocument.create();

  for (let index = 0; index < certificates.length; index += 1) {
    const [certificatePage] = await mergedDocument.copyPages(
      certificateDocument,
      [index]
    );
    mergedDocument.addPage(certificatePage);

    const competenciasUrl = competenciasUrls[index];
    if (!competenciasUrl) continue;

    const competenciasDocument = competenciasDocuments.get(competenciasUrl);
    if (!competenciasDocument) {
      throw new Error("No se encontró el anexo de competencias del ciclo.");
    }

    const competenciasPages = await mergedDocument.copyPages(
      competenciasDocument,
      competenciasDocument.getPageIndices()
    );
    competenciasPages.forEach((page) => mergedDocument.addPage(page));
  }

  return createPdfBlob(await mergedDocument.save());
}
