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

import logoGobiernoAragon from '@/pdf/pdf-imgs/logo-gobierno-aragon.png';

const styles = StyleSheet.create({
  page: { paddingBottom: 40, paddingTop: 40, paddingHorizontal: 30, fontSize: 9, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', marginBottom: 10, alignItems: 'center' },
  logo: { width: 100, position: 'absolute' },
  govText: { marginLeft: 10, fontSize: 14, fontWeight: 'bold' },
  title: { textAlign: 'center', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { textAlign: 'center', fontSize: 10, fontWeight: 'bold' },
  subsubtitle: { textAlign: 'center', fontSize: 8, fontWeight: 'bold', marginBottom: 20 },
  paragraph: { paddingHorizontal: 45, marginBottom: 6, lineHeight: 0.7, textAlign: 'justify' },
  bold: { fontWeight: 'bold' },
  highlight: { backgroundColor: '#f0f0f0' },
  table: { /* display: 'table', */ borderWidth: 1, borderColor: '#000', marginVertical: 10 },
  tableRow: { flexDirection: 'row' },
  tableColHeader: { borderWidth: 1, borderColor: '#000', backgroundColor: '#eee', padding: 4 },
  tableCol: { width: '20%', borderWidth: 1, borderColor: '#000', padding: 4 },
  tableCellHeader: { fontWeight: 'bold', fontSize: 8.5, textAlign: 'center' },
  tableCell: { fontSize: 8.5, textAlign: 'center' },
  tableColCode: { width: '20%', borderWidth: 1, borderColor: '#000', padding: 4, justifyContent: 'center', alignItems: 'center' },
  tableColName: { width: '60%', borderWidth: 1, borderColor: '#000', padding: 4, flex: 3, justifyContent: 'center' },
  tableColGrade: { width: '20%', borderWidth: 1, borderColor: '#000', padding: 4, flex: 1, justifyContent: 'center', alignItems: 'center' },
  footer: { paddingHorizontal: 45, position: 'absolute', bottom: 40 },
  anottations: { fontSize: 8 }
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

export const CertificadoObtencionDocument = ({ data, }: { data: CertificateData }) => {

  const notasRaw = (data?.merged_enrollments ?? []).map((m) => m.mejor_nota);

  const notaToNumber = (nota: (typeof notasRaw)[number]): number | null => {
    if (nota == null) return null;

    if (typeof nota === "number") {
      return Number.isFinite(nota) ? nota : null;
    }

    if (typeof nota === "string") {
      if (nota === "10-MH" || nota === "APTO") return 10;

      if (nota === "CV") return 5;

      if (nota.startsWith("CV-")) {
        const n = Number(nota.split("-")[1]);
        return Number.isFinite(n) ? n : null;
      }

      const n = Number(nota);
      return Number.isFinite(n) ? n : null;
    }

    return null;
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabecera con logo y texto */}
        <View style={styles.header}>
          <Image src={logoGobiernoAragon} style={styles.logo} />
        </View>

        {/* Títulos */}
        <Text style={styles.title}>ANEXO IV</Text>
        <Text style={styles.subtitle}>CERTIFICACIÓN ACADÉMICA OFICIAL</Text>
        <Text style={styles.subsubtitle}>(para la obtención del título de formación profesional)</Text>

        {/* Párrafo introductorio */}
        <Text style={styles.paragraph}>
          {data.secretario_data.nombre}, {data.secretario_data.cargo} del Instituto de Educación Secundaria MIGUEL CATALÁN de código 50011525 con dirección Pº Isabel la Católica, 3. 50009, Zaragoza, teléfono 976402004 y correo electrónico secretaria@ies-mcatalan.com.
        </Text>

        <Text style={styles.paragraph}>
          CERTIFICA:
        </Text>

        {/* Párrafo con datos del alumno */}
        <Text style={styles.paragraph}>
          Que <Text style={styles.bold}>{data.student_data.student.nombre} {data.student_data.student.apellido_1} {data.student_data.student.apellido_2}</Text>, con {data.student_data.student.tipo_id_legal} <Text style={styles.bold}>{data.student_data.student.id_legal}</Text>, según consta en su expediente <Text style={styles.bold}>{data.student_data.student.id_estudiante}</Text>, ha superado todos los módulos profesionales de Ciclos Formativos de Grado Superior {data.cycle_data.codigo} en <Text style={styles.bold}>{data.cycle_data.nombre}</Text>, regulado por el {data.cycle_data.norma_1} y la {data.cycle_data.norma_2}, habiendo realizado sus estudios en el Centro Privado de Formación Profesional "Formacciona" con código de Centro 50019640 y domicilio en Calle Asín y Palacios, 18. Zaragoza, adscrito administrativamente a este Centro y cumple los requisitos de acceso a la formación profesional establecidos en el Real Decreto 1147/2011, obteniendo las siguientes calificaciones finales:
        </Text>

        {/* Tabla de módulos y calificaciones */}
        <View style={[styles.table, { width: '65%', marginLeft: 'auto', marginRight: 'auto', borderBottomWidth: 0, borderTopWidth: 0, borderRightWidth: 0, borderLeftWidth: 0 }]}>
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
                  <Text style={styles.tableCell}>{m.mejor_nota as any}</Text>
                </View>
              </View>
            ))}

          {/* Fila de nota final */}
          <View style={styles.tableRow}>
            <View style={[styles.tableColName, { width: '80%' }]}>
              <Text
                style={[
                  styles.tableCell,
                  { textAlign: 'center', fontWeight: 'bold' },
                ]}>
                NOTA FINAL DEL CICLO FORMATIVO
              </Text>
            </View>
            <View style={styles.tableColGrade}>
              <Text style={styles.tableCell}>{mediaFormateada}</Text>
            </View>
          </View>
        </View>


        {/* Pie de texto */}
        <Text style={[styles.paragraph, { marginBottom: 20 }]}>
          Cumple los requisitos vigentes para la obtención del Título de Técnico Superior en {data.cycle_data.nombre}
        </Text>

        <Text style={styles.paragraph}>
          En Zaragoza, a {fechaHoyES().toString()}.
        </Text>

        {/* Firma */}
        <Text style={styles.paragraph}>
          Vº Bº {data.director_data.cargo}
        </Text>

        <Text style={[styles.paragraph, { position: 'absolute', bottom: 40 }]}>

        </Text>

        {/* Pie de página con leyenda de códigos */}
        <Text style={styles.footer}>
          Fdo.: {data.director_data.nombre}{'\n\n'}
          <Text style={styles.anottations}>
            (1) : Código establecido en la Comunidad Autónoma de Aragón{'\n'}
            (2) : Notación de las calificaciones:{'\n'}
            Módulo profesional superado : 5,6,7,8,9,10 | Convalidado 5 : CV-5 | Convalidado : CV | Módulo profesional de FCT superado : APTO | Nota final de ciclo con "Matrícula de Honor" : (Nota)-M. Honor | Módulo profesional exento : EX | Módulo con "Mención Honorifica" : 10-MH
          </Text>
        </Text>

      </Page>
    </Document>
  )
};