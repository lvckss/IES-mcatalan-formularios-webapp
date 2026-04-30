import type { NotaEnum, NotasMasAltasPorCicloReturn } from "../models/Cycle";

export function notaToNumber(nota: NotaEnum | null): number | null {
    if (nota == null) return null;

    const s = String(nota);

    // No cuentan en la media
    if (s === "APTO" || s === "EX" || s === "NO APTO") return null;

    // Cuentan como 0
    if (s === "NE" || s === "RC") return 0;

    // 10 especiales
    if (s === "10-MH" || s === "10-Matr. Honor") return 10;

    // Convalidaciones sin nota numérica: aprobadas, pero fuera de la media
    if (s === "CV") return null;
    if (s.startsWith("CV-")) {
        const n = Number(s.split("-")[1]);
        return Number.isFinite(n) ? n : null;
    }

    // Traslados
    if (s.startsWith("TRAS-")) {
        const n = Number(s.split("-")[1]);
        return Number.isFinite(n) ? n : null;
    }

    // Numéricas "0".."10"
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}

export function isNotaAprobada(nota: NotaEnum | null): boolean {
    if (!nota) return false;

    const s = String(nota);

    if (s === "APTO" || s === "EX") return true;
    if (s === "NO APTO" || s === "NE" || s === "RC") return false;
    if (s === "10-MH" || s === "10-Matr. Honor") return true;

    if (s === "CV") return true;

    if (s.startsWith("CV-") || s.startsWith("TRAS-")) {
        const n = Number(s.split("-")[1]);
        return Number.isFinite(n) && n >= 5;
    }

    const n = Number(s);
    return Number.isFinite(n) && n >= 5;
}

export function calcularResumenNotasCiclo(notas: NotasMasAltasPorCicloReturn[]) {
    const notasNumericas = notas
        .map((m) => notaToNumber(m.mejor_nota))
        .filter((n): n is number => typeof n === "number");

    const media =
        notasNumericas.length > 0
            ? notasNumericas.reduce((sum, n) => sum + n, 0) / notasNumericas.length
            : null;

    const todasAprobadas =
        notas.length > 0 && notas.every((m) => isNotaAprobada(m.mejor_nota));

    return {
        media,
        media_formateada: media !== null ? media.toFixed(2) : null,
        todas_aprobadas: todasAprobadas,
        total_modulos: notas.length,
        modulos_con_nota_numerica: notasNumericas.length,
    };
}
