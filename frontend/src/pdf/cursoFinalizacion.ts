import type { NotaEnum, NotasMasAltasPorCicloReturn } from '@/types';

export function isAprobada(nota: NotaEnum | null): boolean {
  if (!nota) return false;
  if (nota === 'APTO' || nota === 'EX' || nota === 'CV') return true;
  if (nota === '10-MH' || nota === '10-Matr. Honor') return true;

  const valor = nota.startsWith('CV-') || nota.startsWith('TRAS-')
    ? Number(nota.split('-')[1])
    : Number(nota);

  return Number.isFinite(valor) && valor >= 5;
}

export function getCursoFinalizacion(
  modulos: NotasMasAltasPorCicloReturn[]
): string | null {
  if (modulos.length === 0) return null;

  let ultimoInicio = 0;
  let ultimoFin = 0;

  for (const modulo of modulos) {
    const { mejor_nota: nota, mejor_ano_inicio: inicio, mejor_ano_fin: fin } = modulo;

    // No se puede acreditar la finalización con módulos pendientes o años incompletos.
    if (!isAprobada(nota) || inicio == null || fin == null ||
        !Number.isInteger(inicio) || !Number.isInteger(fin) ||
        inicio <= 0 || fin !== inicio + 1) {
      return null;
    }

    if (fin > ultimoFin) {
      ultimoInicio = inicio;
      ultimoFin = fin;
    }
  }

  return `${ultimoInicio}/${ultimoFin}`;
}
