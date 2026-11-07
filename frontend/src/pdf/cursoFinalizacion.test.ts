import { describe, expect, test } from 'bun:test';
import type { NotaEnum, NotasMasAltasPorCicloReturn } from '@/types';
import { getCursoFinalizacion } from './cursoFinalizacion';

function modulo(
  overrides: Partial<NotasMasAltasPorCicloReturn> = {}
): NotasMasAltasPorCicloReturn {
  return {
    id_ciclo: 1,
    id_modulo: 1,
    modulo: 'Módulo de prueba (1º)',
    codigo_modulo: '1347',
    mejor_nota: '9',
    mejor_ano_inicio: 2024,
    mejor_ano_fin: 2025,
    convocatoria: 1,
    ...overrides,
  };
}

describe('curso de finalización del ciclo', () => {
  test('incluye la FCT aprobada después de los módulos de primero y segundo', () => {
    const modulos = [
      modulo({ mejor_ano_inicio: 2025, mejor_ano_fin: 2026 }),
      modulo(),
      modulo({
        modulo: 'Formación en centros de trabajo (2º)',
        mejor_nota: 'APTO',
        mejor_ano_inicio: 2026,
        mejor_ano_fin: 2027,
      }),
    ];

    expect(getCursoFinalizacion(modulos)).toBe('2026/2027');
    expect(getCursoFinalizacion([...modulos].reverse())).toBe('2026/2027');
  });

  test.each<NotaEnum>([
    '5', '6', '7', '8', '9', '10', '10-MH', '10-Matr. Honor',
    'APTO', 'EX', 'CV', 'CV-5', 'CV-10', 'CV-10-MH',
    'TRAS-5', 'TRAS-10', 'TRAS-10-MH',
  ])('considera superado un módulo con %s', (nota) => {
    expect(getCursoFinalizacion([modulo({ mejor_nota: nota })])).toBe('2024/2025');
  });

  test.each<NotaEnum | null>([
    null, '0', '1', '2', '3', '4', 'NO APTO', 'NE', 'RC',
  ])('no indica finalización si queda un módulo con %s', (nota) => {
    expect(getCursoFinalizacion([modulo(), modulo({ mejor_nota: nota })])).toBeNull();
  });

  test('no indica finalización sin módulos', () => {
    expect(getCursoFinalizacion([])).toBeNull();
  });

  test.each([
    [null, 2026], [2025, null], [null, null],
    [2025, 2025], [2025, 2027], [2025.5, 2026.5], [0, 1],
  ])('no inventa un curso cuando un módulo tiene los años %s/%s', (inicio, fin) => {
    expect(getCursoFinalizacion([
      modulo({ mejor_ano_inicio: inicio, mejor_ano_fin: fin }),
      modulo({ mejor_ano_inicio: 2026, mejor_ano_fin: 2027 }),
    ])).toBeNull();
  });
});
