import * as XLSX from "xlsx";
import sql from "../db/db";

type Sexo = "Masculino" | "Femenino" | "Indefinido";
type Turno = "Diurno" | "Vespertino" | "Nocturno" | "A distancia";
type TipoDocumento = "DNI" | "NIE" | "PASAPORTE";

type ImportStudentsResult = {
    importedCount: number;
    rejectedCount: number;
    rejectedReport: string | null;
};

type ParsedRow = {
    tipoDocumento: TipoDocumento;
    documento: string;
    nombre: string;
    apellido1: string;
    apellido2: string | null;
    sexo: Sexo;
    telefono: string | null;
    fechaNacimiento: string; // YYYY-MM-DD
    ley: string;
    codigoCiclo: string;
    anoInicio: number;
    anoFin: number;
    turno: Turno;
};

const INTERNAL_HEADER_ALIASES: Record<string, string[]> = {
    tipoDocumento: ["TIPODEDOCUMENTO"],
    documento: ["DOCUMENTO", "IDLEGAL", "NUMERODOCUMENTO", "NUMDOCUMENTO"],
    nombre: ["NOMBRE"],
    apellido1: ["APE1", "APELLIDO1", "PRIMERAPELLIDO"],
    apellido2: ["APE2", "APELLIDO2", "SEGUNDOAPELLIDO"],
    sexo: ["SEXO"],
    telefono: ["TELEFONO", "TFNO", "NUMTFNO"],
    fechaNacimiento: ["FECHANACIMIENTO", "FECHANAC"],
    ley: ["LEY"],
    codigoCiclo: ["CODIGOCICLO", "CODIGO"],
    anoEscolar: ["ANOESCOLAR", "CURSOESCOLAR"],
    turno: ["TURNO"],
};

function formatRawRowLabel(
    rawRow: Record<string, unknown>,
    headerMap: Record<string, string>
): string {
    const normalizedRow: Record<string, unknown> = {};

    for (const [rawKey, value] of Object.entries(rawRow)) {
        const normalizedKey = normalizeHeader(rawKey);
        const internalKey = headerMap[normalizedKey];
        if (internalKey) {
            normalizedRow[internalKey] = value;
        }
    }

    const nombre = cleanString(normalizedRow.nombre);
    const apellido1 = cleanString(normalizedRow.apellido1);
    const apellido2 = cleanString(normalizedRow.apellido2);
    const documento = cleanString(normalizedRow.documento);

    const fullName = [nombre, apellido1, apellido2].filter(Boolean).join(" ");
    const doc = documento ? ` [${documento}]` : "";

    return `${fullName || "Alumno sin nombre"}${doc}`;
}

function normalizeText(value: string): string {
    return value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .trim()
        .toUpperCase();
}

function normalizeHeader(value: string): string {
    return normalizeText(value).replace(/[^A-Z0-9]/g, "");
}

function cleanString(value: unknown): string {
    if (value == null) return "";
    return String(value).trim();
}

function normalizeOptionalString(value: unknown): string | null {
    const s = cleanString(value);
    return s === "" ? null : s;
}

function parseTipoDocumento(value: unknown): TipoDocumento {
    const v = normalizeText(cleanString(value));
    if (v === "DNI" || v === "NIF") return "DNI";
    if (v === "NIE") return "NIE";
    if (v === "PASAPORTE" || v === "PASSPORT") return "PASAPORTE";
    throw new Error(`Tipo de documento inválido: "${cleanString(value)}"`);
}

function parseSexo(value: unknown): Sexo {
    const v = normalizeText(cleanString(value));
    if (["MASCULINO", "HOMBRE", "M"].includes(v)) return "Masculino";
    if (["FEMENINO", "MUJER", "F"].includes(v)) return "Femenino";
    if (["INDEFINIDO", "OTRO", "X"].includes(v)) return "Indefinido";
    throw new Error(`Sexo inválido: "${cleanString(value)}"`);
}

function parseTurno(value: unknown): Turno {
    const v = normalizeText(cleanString(value));
    if (v === "DIURNO") return "Diurno";
    if (v === "VESPERTINO") return "Vespertino";
    if (v === "NOCTURNO") return "Nocturno";
    if (v === "ADISTANCIA" || v === "A DISTANCIA") return "A distancia";
    throw new Error(`Turno inválido: "${cleanString(value)}"`);
}

function parseAnoEscolar(value: unknown): { anoInicio: number; anoFin: number } {
    const raw = cleanString(value);
    const match = raw.match(/^(\d{4})\s*[-/]\s*(\d{4})$/);

    if (!match) {
        throw new Error(`AÑO ESCOLAR inválido: "${raw}"`);
    }

    const anoInicio = Number(match[1]);
    const anoFin = Number(match[2]);

    if (anoFin !== anoInicio + 1) {
        throw new Error(`AÑO ESCOLAR inválido: "${raw}"`);
    }

    return { anoInicio, anoFin };
}

function excelSerialToISO(value: number): string | null {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    const date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
    return date.toISOString().slice(0, 10);
}

function parseDateToISO(value: unknown): string {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }

    if (typeof value === "number") {
        const iso = excelSerialToISO(value);
        if (iso) return iso;
    }

    const raw = cleanString(value);

    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) return raw;

    const esMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (esMatch) {
        const dd = esMatch[1].padStart(2, "0");
        const mm = esMatch[2].padStart(2, "0");
        const yyyy = esMatch[3];
        return `${yyyy}-${mm}-${dd}`;
    }

    throw new Error(`FECHA NACIMIENTO inválida: "${raw}"`);
}

const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

function validateDNI(dni: string): boolean {
    const value = dni.replace(/[\s-]/g, "").toUpperCase();
    if (!/^\d{8}[A-Z]$/.test(value)) return false;
    const number = Number(value.slice(0, 8));
    const letter = value[8];
    return DNI_LETTERS[number % 23] === letter;
}

function validateNIE(nie: string): boolean {
    const value = nie.replace(/[\s-]/g, "").toUpperCase();
    if (!/^[XYZ]\d{7}[A-Z]$/.test(value)) return false;

    const prefixMap: Record<string, string> = { X: "0", Y: "1", Z: "2" };
    const numeric = prefixMap[value[0]] + value.slice(1, 8);
    const letter = value[8];

    return DNI_LETTERS[Number(numeric) % 23] === letter;
}

function validatePassport(passport: string): boolean {
    const value = passport.replace(/\s+/g, "").toUpperCase();
    return /^[A-Z0-9]{3,20}$/.test(value);
}

function normalizeDocument(value: string): string {
    return value.replace(/[\s-]/g, "").toUpperCase();
}

function assertValidDocument(tipo: TipoDocumento, documento: string): string {
    const normalized = normalizeDocument(documento);

    if (tipo === "DNI" && !validateDNI(normalized)) {
        throw new Error(`DNI inválido: "${documento}"`);
    }

    if (tipo === "NIE" && !validateNIE(normalized)) {
        throw new Error(`NIE inválido: "${documento}"`);
    }

    if (tipo === "PASAPORTE" && !validatePassport(normalized)) {
        throw new Error(`Pasaporte inválido: "${documento}"`);
    }

    return normalized;
}

function buildHeaderMap(headers: string[]): Record<string, string> {
    const map: Record<string, string> = {};

    for (const header of headers) {
        const normalized = normalizeHeader(header);

        for (const [internalKey, aliases] of Object.entries(INTERNAL_HEADER_ALIASES)) {
            if (aliases.includes(normalized)) {
                map[normalized] = internalKey;
            }
        }
    }

    return map;
}

function ensureHeaders(headers: string[]): void {
    const normalizedHeaders = headers.map((h) => normalizeHeader(h));
    const internalFound = new Set<string>();

    for (const normalized of normalizedHeaders) {
        for (const [internalKey, aliases] of Object.entries(INTERNAL_HEADER_ALIASES)) {
            if (aliases.includes(normalized)) {
                internalFound.add(internalKey);
            }
        }
    }

    const required = [
        "tipoDocumento",
        "documento",
        "nombre",
        "apellido1",
        "sexo",
        "fechaNacimiento",
        "ley",
        "codigoCiclo",
        "anoEscolar",
        "turno",
    ];

    const missing = required.filter((k) => !internalFound.has(k));
    if (missing.length > 0) {
        throw new Error(
            `Faltan columnas obligatorias en el Excel: ${missing.join(", ")}`
        );
    }
}

function rowIsEmpty(row: Record<string, unknown>): boolean {
    return Object.values(row).every((v) => cleanString(v) === "");
}

function parseRow(
    rawRow: Record<string, unknown>,
    _rowNumber: number,
    headerMap: Record<string, string>,
    seenDocuments: Set<string>
): ParsedRow {
    const row: Record<string, unknown> = {};

    for (const [rawKey, value] of Object.entries(rawRow)) {
        const normalizedKey = normalizeHeader(rawKey);
        const internalKey = headerMap[normalizedKey];
        if (internalKey) row[internalKey] = value;
    }

    const tipoDocumento = parseTipoDocumento(row.tipoDocumento);
    const documento = assertValidDocument(tipoDocumento, cleanString(row.documento));

    if (seenDocuments.has(documento)) {
        throw new Error(`Documento duplicado dentro del Excel: "${documento}"`);
    }
    seenDocuments.add(documento);

    const nombre = cleanString(row.nombre);
    const apellido1 = cleanString(row.apellido1);

    if (!nombre) throw new Error("NOMBRE vacío");
    if (!apellido1) throw new Error("APE1 vacío");

    const apellido2 = normalizeOptionalString(row.apellido2);
    const telefono = normalizeOptionalString(row.telefono);
    const sexo = parseSexo(row.sexo);
    const fechaNacimiento = parseDateToISO(row.fechaNacimiento);

    const ley = cleanString(row.ley);
    const codigoCiclo = cleanString(row.codigoCiclo);
    if (!ley) throw new Error("LEY vacía");
    if (!codigoCiclo) throw new Error("CODIGO CICLO vacío");

    const { anoInicio, anoFin } = parseAnoEscolar(row.anoEscolar);
    const turno = parseTurno(row.turno);

    return {
        tipoDocumento,
        documento,
        nombre,
        apellido1,
        apellido2,
        sexo,
        telefono,
        fechaNacimiento,
        ley,
        codigoCiclo,
        anoInicio,
        anoFin,
        turno,
    };
}

function formatStudentLabel(row: Partial<ParsedRow>): string {
    const fullName = [row.nombre, row.apellido1, row.apellido2].filter(Boolean).join(" ");
    const doc = row.documento ? ` [${row.documento}]` : "";
    return `${fullName || "Alumno sin nombre"}${doc}`;
}

export async function importStudentsFromExcel(file: File): Promise<ImportStudentsResult> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
        throw new Error("El Excel no contiene hojas.");
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const headerRows = XLSX.utils.sheet_to_json<string[]>(worksheet, {
        header: 1,
        blankrows: false,
    });

    const headers = (headerRows[0] ?? []).map((x) => String(x ?? ""));
    ensureHeaders(headers);

    const headerMap = buildHeaderMap(headers);

    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: "",
        raw: true,
        blankrows: false,
    });

    const rejectedLines: string[] = [];
    const seenDocuments = new Set<string>();
    let importedCount = 0;

    for (let i = 0; i < rawRows.length; i++) {
        const rawRow = rawRows[i];
        const excelRowNumber = i + 2;
        let parsedRow: ParsedRow | null = null;

        try {
            if (rowIsEmpty(rawRow)) continue;

            parsedRow = parseRow(rawRow, excelRowNumber, headerMap, seenDocuments);
            const row = parsedRow;

            await sql.begin(async (tx) => {
                const existingStudents = await tx<{ id_estudiante: number }[]>`
          SELECT id_estudiante
          FROM Estudiantes
          WHERE UPPER(id_legal) = UPPER(${row.documento})
          LIMIT 1
        `;

                if (existingStudents.length > 0) {
                    throw new Error("El estudiante ya existe en la base de datos");
                }

                const ciclos = await tx<{
                    id_ciclo: number;
                    nombre: string;
                    nombre_ley: string;
                }[]>`
          SELECT
            c.id_ciclo,
            c.nombre,
            l.nombre_ley
          FROM Ciclos c
          JOIN Leyes l ON l.id_ley = c.ley
          WHERE UPPER(TRIM(c.codigo)) = UPPER(TRIM(${row.codigoCiclo}))
            AND UPPER(TRIM(l.nombre_ley)) = UPPER(TRIM(${row.ley}))
            AND TRIM(c.curso) = '1'
          LIMIT 2
        `;

                if (ciclos.length === 0) {
                    throw new Error(
                        `No existe un ciclo de 1º con código "${row.codigoCiclo}" y ley "${row.ley}"`
                    );
                }

                if (ciclos.length > 1) {
                    throw new Error(
                        `Hay más de un ciclo de 1º para código "${row.codigoCiclo}" y ley "${row.ley}"`
                    );
                }

                const ciclo = ciclos[0];

                const modules = await tx<{ id_modulo: number }[]>`
                    SELECT id_modulo
                    FROM Modulos
                    WHERE id_ciclo = ${ciclo.id_ciclo}
                        AND TRIM(curso) = '1º'
                    ORDER BY id_modulo
                    `;

                if (modules.length === 0) {
                    throw new Error("El ciclo no tiene módulos de 1º asociados");
                }

                const insertedStudents = await tx<{ id_estudiante: number }[]>`
          INSERT INTO Estudiantes (
            nombre,
            apellido_1,
            apellido_2,
            sexo,
            num_tfno,
            id_legal,
            tipo_id_legal,
            fecha_nac
          )
          VALUES (
            ${row.nombre},
            ${row.apellido1},
            ${row.apellido2},
            ${row.sexo},
            ${row.telefono},
            ${row.documento},
            ${row.tipoDocumento},
            ${row.fechaNacimiento}
          )
          RETURNING id_estudiante
        `;

                const student = insertedStudents[0];

                const insertedExpedientes = await tx<{ id_expediente: number }[]>`
          INSERT INTO Expedientes (
            id_estudiante,
            ano_inicio,
            ano_fin,
            id_ciclo,
            turno,
            convocatoria,
            vino_traslado,
            dado_baja
          )
          VALUES (
            ${student.id_estudiante},
            ${row.anoInicio},
            ${row.anoFin},
            ${ciclo.id_ciclo},
            ${row.turno},
            'Ordinaria',
            false,
            false
          )
          RETURNING id_expediente
        `;

                const expediente = insertedExpedientes[0];

                for (const mod of modules) {
                    await tx`
            INSERT INTO Matriculas (
              id_expediente,
              id_modulo,
              id_estudiante,
              nota
            )
            VALUES (
              ${expediente.id_expediente},
              ${mod.id_modulo},
              ${student.id_estudiante},
              ${null}
            )
          `;
                }
            });

            importedCount++;
        } catch (error) {
            const reason =
                error instanceof Error ? error.message : "Error desconocido";
            const label = parsedRow
                ? formatStudentLabel(parsedRow)
                : formatRawRowLabel(rawRow, headerMap);

            rejectedLines.push(`Fila ${excelRowNumber} - ${label}: ${reason}`);
        }
    }

    const rejectedCount = rejectedLines.length;
    const rejectedReport =
        rejectedCount > 0
            ? [
                "RESULTADO DE IMPORTACIÓN MASIVA DE ESTUDIANTES",
                `Importados: ${importedCount}`,
                `Rechazados: ${rejectedCount}`,
                "",
                "DETALLE DE ERRORES:",
                ...rejectedLines,
            ].join("\n")
            : null;

    return {
        importedCount,
        rejectedCount,
        rejectedReport,
    };
}