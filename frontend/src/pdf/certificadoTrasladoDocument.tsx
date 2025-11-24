// src/components/CertificadoDocument.jsx
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';

import { Cycle, FullStudentData, Directivo } from '@/types';

type NotaEnum =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10"
  | "10-MH" | "10-Matr. Honor"
  | "CV" | "CV-5" | "CV-6" | "CV-7" | "CV-8" | "CV-9" | "CV-10" | "CV-10-MH"
  | "TRAS-5" | "TRAS-6" | "TRAS-7" | "TRAS-8" | "TRAS-9" | "TRAS-10" | "TRAS-10-MH"
  | "RC" | "NE" | "APTO" | "NO APTO" | "EX";

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

import logoGobiernoAragon from '@/pdf/pdf-imgs/logo-gobierno-aragon.png';

const styles = StyleSheet.create({
  page: { paddingBottom: 40, paddingTop: 20, paddingHorizontal: 20, fontSize: 9, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', marginBottom: 10, alignItems: 'center' },
  logo: { width: 100, position: 'absolute', marginTop: 60, marginLeft: 20 },
  govText: { marginLeft: 10, fontSize: 14, fontWeight: 'bold' },
  title: { textAlign: 'center', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { textAlign: 'center', fontSize: 10, fontWeight: 'bold' },
  subsubtitle: { textAlign: 'center', fontSize: 8, fontWeight: 'bold', marginBottom: 20 },
  paragraph: { paddingHorizontal: 25, marginBottom: 6, lineHeight: 0.7, textAlign: 'justify' },
  bold: { fontWeight: 'bold' },
  highlight: { backgroundColor: '#f0f0f0' },
  table: { /* display: 'table', */ borderWidth: 1, borderColor: '#000', marginVertical: 10 },
  tableRow: { flexDirection: 'row' },
  tableColHeader: { borderWidth: 1, borderColor: '#000', backgroundColor: '#eee', padding: 4 },
  tableCol: { width: '20%', borderWidth: 1, borderColor: '#000', padding: 4 },
  tableCellHeader: { fontWeight: 'bold', fontSize: 8.5, textAlign: 'center' },
  tableCell: { textAlign: 'center' },
  tableColCode: { fontSize: 7.5, width: '15%', borderWidth: 1, borderColor: '#000', padding: 4, justifyContent: 'center', alignItems: 'center' },
  tableColName: { fontSize: 7.5, width: '60%', borderWidth: 1, borderColor: '#000', padding: 4, flex: 3, justifyContent: 'center' },
  tableColGrade: { width: '10%', borderWidth: 1, fontSize: 9.5, borderColor: '#000', padding: 4, flex: 1, justifyContent: 'center', alignItems: 'center' },
  tableColConvocatoria: { fontSize: 9.5, width: '10%', borderWidth: 1, borderColor: '#000', padding: 4, flex: 1, justifyContent: 'center', alignItems: 'center' },
  tableColCurso: { fontSize: 9.5, width: '10%', borderWidth: 1, borderColor: '#000', padding: 4, flex: 1, justifyContent: 'center', alignItems: 'center' },
  footer: { paddingHorizontal: 25, position: 'absolute', bottom: 40 },
  anottations: { fontSize: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 45, marginBottom: 6 },
  checkbox: { width: 10, height: 10, borderWidth: 1, borderColor: '#000', marginRight: 6 },
  textoEncimaTabla: { paddingHorizontal: 25, lineHeight: 0.7, textAlign: 'justify' },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 25,   // mismo padding que tus párrafos
    marginTop: 24,
    marginBottom: 12,
  },
  signatureNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 25,   // mismo padding que tus párrafos
    marginTop: 5,
    marginBottom: 12,
  },
  signatureLeft: { width: '48%', textAlign: 'left' },
  signatureRight: { width: '48%', textAlign: 'right' },
});

export function fechaHoyES(): string {
  const hoy = new Date();

  // Formateador para español (España) con día numérico, mes largo y año numérico
  const formatter = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return formatter.format(hoy);
}

interface CertificateData {
  student_data: FullStudentData;
  cycle_data: Cycle;
  director_data: Directivo;
  secretario_data: Directivo;
  merged_enrollments: NotasMasAltasPorCicloReturn[];
}

export const CertificadoTrasladoDocument = ({ data, }: { data: CertificateData }) => {

  const notasRaw = (data?.merged_enrollments ?? []).map((m) => m.mejor_nota);

  // Convierte nota -> valor numérico para la media según las nuevas reglas
  const notaToNumber = (nota: (typeof notasRaw)[number]): number | null => {
    if (nota == null) return null;

    // Normalizamos a string para tratar todos los casos de forma uniforme
    const s = String(nota);

    // Casos que NO cuentan en la media
    if (s === "APTO" || s === "EX" || s === "NO APTO") return null;

    // Casos que cuentan como 0
    if (s === "NE" || s === "RC") return 0;

    // Casos que valen 10
    if (s === "10-MH" || s === "10-Matr. Honor") return 10;

    // Convalidaciones
    if (s === "CV") return 5;
    if (s.startsWith("CV-")) {
      // CV-5 ... CV-10, CV-10-MH -> tomar el número tras "CV-"
      const n = Number(s.split("-")[1]); // "10" de "CV-10" o "CV-10-MH"
      return Number.isFinite(n) ? n : null;
    }

    // Traslados
    if (s.startsWith("TRAS-")) {
      // TRAS-5 ... TRAS-10, TRAS-10-MH -> tomar el número tras "TRAS-"
      const n = Number(s.split("-")[1]); // "10" de "TRAS-10" o "TRAS-10-MH"
      return Number.isFinite(n) ? n : null;
    }

    // Notas numéricas directas "0".."10"
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const notaDisplay = (nota: NotaEnum | null): string => {
    if (!nota) return "—";

    if (nota == "NE") {
      return "No cursada"
    }

    if (nota.startsWith("TRAS-")) {
      const n = nota.split("-")[1];
      return `${n}*`;
    }

    return nota;
  };

  // Filtra solo las notas con valor numérico
  const notasNumericas = notasRaw
    .map(notaToNumber)
    .filter((n): n is number => typeof n === "number");


  const media =
    notasNumericas.length > 0
      ? notasNumericas.reduce((sum, n) => sum + n, 0) / notasNumericas.length
      : undefined;

  const mediaFormateada = media !== undefined ? media.toFixed(2) : '—';

  const formatConvocatoria = (n: number | null | undefined): string => {
    if (n == null) return '—';
    switch (n) {
      case 1: return '1ª';
      case 2: return '2ª';
      case 3: return '3ª';
      case 4: return '4ª';
      case 5: return '1ªext';
      case 6: return '2ªext';
      default: return '—';
    }
  };

  const toLocalDate = (v: Date | string | number | null | undefined): Date | null => {
    if (v == null) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;

    if (typeof v === 'string') {
      // Caso "YYYY-MM-DD": créalo en zona local para evitar desplazamientos
      const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) {
        const [, y, mo, d] = m.map(Number);
        return new Date(y, mo - 1, d);
      }
    }

    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatFechaES = (v: Date | string | number | null | undefined): string => {
    const d = toLocalDate(v);
    if (!d) return '—';
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabecera con logo y texto */}
        <View style={styles.header}>
          <Image src={logoGobiernoAragon} style={styles.logo} />
        </View>

        {/* Títulos */}
        <Text style={styles.title}>ANEXO V</Text>
        <Text style={styles.subtitle}>CERTIFICACIÓN ACADÉMICA OFICIAL</Text>
        <Text style={styles.subsubtitle}>(para el traslado del alumno a otro centro u otros efectos)</Text>

        {/* Párrafo introductorio */}
        <Text style={styles.paragraph}>
          {data.secretario_data.nombre}, {data.secretario_data.cargo} del Instituto de Educación Secundaria MIGUEL CATALÁN de código 50011525 con dirección Pº Isabel la Católica, 3. 50009, Zaragoza, teléfono 976402004 y correo electrónico secretaria@ies-mcatalan.com.
        </Text>

        <Text style={styles.paragraph}>
          CERTIFICA:
        </Text>

        {/* Párrafo con datos del alumno */}
        <Text style={styles.paragraph}>
          Que <Text style={styles.bold}>{data.student_data.student.nombre} {data.student_data.student.apellido_1} {data.student_data.student.apellido_2}</Text>, con {data.student_data.student.tipo_id_legal} <Text style={styles.bold}>{data.student_data.student.id_legal}</Text>, nacido/a el {formatFechaES(data.student_data.student.fecha_nac)}, matriculado/a en el Centro Privado de Formación Profesional Especifica "Formacciona" con código de Centro 50019640 y domicilio en Calle Asín y Palacios 18 de la localidad de Zaragoza adscrito administrativamente a este Centro, en <Text style={styles.bold}>{data.cycle_data.nombre}</Text> de Ciclos Formativos de Formación Profesional de Grado Superior, regulado por {data.cycle_data.norma_1} y {data.cycle_data.norma_2}:
        </Text>

        <View style={styles.checkRow}>
          <View style={styles.checkbox} />
          <Text style={[styles.paragraph, { paddingHorizontal: 0, marginBottom: 0, flex: 1 }]}>
            SÍ posee, según consta en su expediente, algunos de los requisitos de acceso a la formación profesional establecidos en el Real Decreto 1147/2011, de 29 de julio de 2011.
          </Text>
        </View>

        <View style={styles.checkRow}>
          <View style={styles.checkbox} />
          <Text style={[styles.paragraph, { paddingHorizontal: 0, marginBottom: 0, flex: 1 }]}>
            NO posee los requisitos de acceso y está matriculado en oferta parcial para la actualización y adquisición de nuevas competencias profesionales de los trabajadores.
          </Text>
        </View>

        <Text style={styles.textoEncimaTabla}>
          Y ha obtenido las siguientes calificaciones:
        </Text>
        {/* Tabla de módulos y calificaciones */}
        <View style={[styles.table, { width: '95%', marginLeft: 'auto', marginRight: 'auto', borderBottomWidth: 0, borderTopWidth: 0, borderRightWidth: 0, borderLeftWidth: 0 }]}>
          {/* Header */}
          <View style={styles.tableRow}>
            <View style={[styles.tableColCode, styles.tableColHeader]}>
              <Text style={styles.tableCellHeader}>Código <Text style={{ fontSize: 6 }}>(1)</Text></Text>
            </View>
            <View style={[styles.tableColName, styles.tableColHeader]}>
              <Text style={styles.tableCellHeader}>
                Denominación del módulo profesional
              </Text>
            </View>
            <View style={[styles.tableColGrade, styles.tableColHeader]}>
              <Text style={styles.tableCellHeader}>Calificación <Text style={{ fontSize: 6 }}>(2)</Text></Text>
            </View>
            <View style={[styles.tableColConvocatoria, styles.tableColHeader]}>
              <Text style={styles.tableCellHeader}>Convocatoria<Text style={{ fontSize: 6 }}>(3)</Text></Text>
            </View>
            <View style={[styles.tableColCurso, styles.tableColHeader]}>
              <Text style={styles.tableCellHeader}>Curso Escolar</Text>
            </View>
          </View>

          {/* Filas dinámicas */}
          {(data?.merged_enrollments ?? [])
            .slice()
            .sort((a, b) => a.codigo_modulo.localeCompare(b.codigo_modulo))
            .map((m, i) => (
              <View style={styles.tableRow} key={i}>
                <View style={styles.tableColCode}>
                  <Text style={styles.tableCell}>{m.codigo_modulo}</Text>
                </View>
                <View style={styles.tableColName}>
                  <Text style={styles.tableCell}>{m.modulo}</Text>
                </View>
                <View style={styles.tableColGrade}>
                  <Text style={styles.tableCell}>{notaDisplay(m.mejor_nota)}</Text>
                </View>
                {/* Convocatoria formateada */}
                <View style={styles.tableColConvocatoria}>
                  <Text style={styles.tableCell}>{formatConvocatoria(m.convocatoria)}</Text>
                </View>
                {/* Curso escolar (solo si hay ambos años) */}
                <View style={styles.tableColCurso}>
                  <Text style={styles.tableCell}>
                    {m.mejor_ano_inicio != null && m.mejor_ano_fin != null
                      ? `${m.mejor_ano_inicio}-${m.mejor_ano_fin}`
                      : '—'}
                  </Text>
                </View>
              </View>
            ))}
        </View>


        {/* Pie de texto */}
        <Text style={[styles.paragraph, { marginBottom: 20 }]}>
          No cumple los requisitos vigentes para la obtención del Título de Técnico Superior en {data.cycle_data.nombre}
        </Text>

        <Text style={styles.paragraph}>
          Y, con fecha {fechaHoyES().toString()}, ha hecho la solicitud para traslado de expediente u otros efectos.
        </Text>

        <Text style={styles.paragraph}>
          En Zaragoza, a {fechaHoyES().toString()}
        </Text>

        {/* Firma */}
        <View style={styles.signatureRow}>
          <Text style={styles.signatureLeft}>
            Vº Bº {data.director_data.cargo}
          </Text>
          <Text style={styles.signatureRight}>
            {data.secretario_data.cargo}
          </Text>
        </View>

        <View style={styles.signatureNameRow}>
          <Text style={styles.signatureLeft}>Fdo.: {data.director_data.nombre}</Text>
          <Text style={styles.signatureRight}>Fdo.: {data.secretario_data.nombre}</Text>
        </View>

        {/* Pie de página con leyenda de códigos */}
        <Text style={styles.footer}>
          <Text style={styles.anottations}>
            (1) : Código establecido en la Comunidad Autónoma de Aragón{'\n'}
            (2) : Notación de las calificaciones:{'\n'}
            Módulo profesional superado : 5,6,7,8,9,10 | Convalidado 5 : CV-5 |
            Convalidado : CV | Módulo profesional de FCT superado : APTO |
            Nota final de ciclo con "Matrícula de Honor" : (Nota)-M. Honor |
            Módulo profesional exento : EX | Módulo con "Mención Honorifica" : 10-MH |
            Módulo procedente de traslado : (Nota)*
          </Text>
        </Text>

      </Page>
    </Document>
  )
};