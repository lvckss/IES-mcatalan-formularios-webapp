// src/components/CertificadoDocument.jsx
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Si quieres usar una fuente oficial (p. ej. “Arial”), embébela aquí
// Font.register({ family: 'Arial', src: '/fonts/arial.ttf' });

const styles = StyleSheet.create({
  page: { paddingBottom: 40, paddingTop: 40, paddingHorizontal: 30, fontSize: 10, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', marginBottom: 10, alignItems: 'center' },
  logo: { width: 100, position: 'absolute'},
  govText: { marginLeft: 10, fontSize: 14, fontWeight: 'bold' },
  title: { textAlign: 'center', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { textAlign: 'center', fontSize: 10, fontWeight: 'bold' },
  subsubtitle: {textAlign: 'center', fontSize: 8, fontWeight: 'bold', marginBottom: 20 },
  paragraph: { paddingHorizontal: 80, marginBottom: 6, lineHeight: 0.7, textAlign: 'justify' },
  bold: { fontWeight: 'bold' },
  highlight: { backgroundColor: '#f0f0f0' },
  table: { display: 'table', borderWidth: 1, borderColor: '#000', marginVertical: 10 },
  tableRow: { flexDirection: 'row' },
  tableColHeader: { borderWidth: 1, borderColor: '#000', backgroundColor: '#eee', padding: 4 },
  tableCol: { width: '20%', borderWidth: 1, borderColor: '#000', padding: 4 },
  tableCellHeader: { fontWeight: 'bold', fontSize: 8.5, textAlign: 'center' },
  tableCell: { fontSize: 8.5, textAlign: 'center'},
  tableColCode: { width: '20%', borderWidth: 1, borderColor: '#000', padding: 4 },
  tableColName: { width: '60%', borderWidth: 1, borderColor: '#000', padding: 4 },
  tableColGrade: { width: '20%', borderWidth: 1, borderColor: '#000', padding: 4 },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, fontSize: 10 },
});

export const CertificadoDocument = ({ datos }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Cabecera con logo y texto */}
      <View style={styles.header}>
        <Image src="./pdf/pdf-imgs/logo-gobierno-aragon.png" style={styles.logo} />
      </View>

      {/* Títulos */}
      <Text style={styles.title}>ANEXO IV</Text>
      <Text style={styles.subtitle}>CERTIFICACIÓN ACADÉMICA OFICIAL</Text>
      <Text style={styles.subsubtitle}>(para la obtención del título de formación profesional)</Text>

      {/* Párrafo introductorio */}
      <Text style={styles.paragraph}>
        D. {datos.secretario.nombre}, Secretario del Instituto de Educación Secundaria {datos.instituto.nombre} de código {datos.instituto.codigo} con dirección {datos.instituto.direccion}, teléfono {datos.instituto.telefono} y correo electrónico {datos.instituto.email}.
      </Text>

      <Text style={styles.paragraph}>
        CERTIFICA:
      </Text>

      {/* Párrafo con datos del alumno */}
      <Text style={styles.paragraph}>
        Que <Text style={styles.bold}>{datos.alumno.nombre_completo}</Text>, con DNI <Text style={styles.bold}>{datos.alumno.dni}</Text>, según consta en su expediente <Text style={styles.bold}>{datos.alumno.expediente}</Text>, ha superado todos los módulos profesionales de Ciclos Formativos de Grado Superior (LOE) en <Text style={styles.bold}>{datos.ciclo.denominacion}</Text>, regulado por el Real Decreto {datos.ciclo.realDecreto} y la Orden de {datos.ciclo.orden_fecha}, habiendo realizado sus estudios en el Centro Privado de Formación Profesional "Formacciona" con código de Centro {datos.centro.codigo} y domicilio en {datos.centro.direccion} adscrito administrativamente a este Centro y cumple los requisitos de acceso a la formación profesional establecidos en el Real Decreto {datos.ciclo.realDecreto1147}, obteniendo las siguientes calificaciones finales:
      </Text>

    {/* Tabla de módulos y calificaciones !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/}
    <View style={[styles.table, { width: '65%', marginLeft: 'auto', marginRight: 'auto', borderBottomWidth: 0, borderTopWidth: 0, borderRightWidth: 0, borderLeftWidth: 0 }]}>
    {/* Header */}
    <View style={styles.tableRow}>
        <View style={[styles.tableColCode, styles.tableColHeader]}>
        <Text style={styles.tableCellHeader}>Código <Text style={{fontSize: 6}}>(1)</Text></Text>
        </View>
        <View style={[styles.tableColName, styles.tableColHeader]}>
        <Text style={styles.tableCellHeader}>
            Denominación del módulo profesional
        </Text>
        </View>
        <View style={[styles.tableColGrade, styles.tableColHeader]}>
        <Text style={styles.tableCellHeader}>Calificación <Text style={{fontSize: 6}}>(2)</Text></Text>
        </View>
    </View>

    {/* Filas dinámicas */}
    {datos.modulos.map((m, i) => (
        <View style={styles.tableRow} key={i}>
        <View style={styles.tableColCode}>
            <Text style={styles.tableCell}>{m.codigo}</Text>
        </View>
        <View style={styles.tableColName}>
            <Text style={styles.tableCell}>{m.denominacion}</Text>
        </View>
        <View style={styles.tableColGrade}>
            <Text style={styles.tableCell}>{m.calificacion}</Text>
        </View>
        </View>
    ))}

    {/* Fila de nota final */}
    <View style={styles.tableRow}>
        <View style={[styles.tableColName, { width: '80%'}]}>
        <Text
            style={[
            styles.tableCell,
            { textAlign: 'center', fontWeight: 'bold' },
            ]}>
            NOTA FINAL DEL CICLO FORMATIVO
        </Text>
        </View>
        <View style={styles.tableColGrade}>
        <Text style={styles.tableCell}>{datos.nota_final}</Text>
        </View>
    </View>
    </View>


      {/* Pie de texto */}
      <Text style={[styles.paragraph, {marginBottom: 20}]}>
        Cumple los requisitos vigentes para la obtención del Título de Técnico Superior en {datos.ciclo.denominacion} (LOE){'\n'}
      </Text>

      <Text style={styles.paragraph}>
        En {datos.instituto.localidad}, a {datos.fecha_expedicion}.
      </Text>

      {/* Firma */}
      <Text style={styles.paragraph}>
        Vº Bº del Director{'\n\n'}
      </Text>

      {/* Pie de página con leyenda de códigos */}
      <Text style={styles.footer}>
        Fdo.: {datos.director}{'\n\n\n'}
        (1) : Código establecido en la Comunidad Autónoma de Aragón{'\n\n'}
        (2) : Notación de las calificaciones:{'\n'}
        Módulo profesional superado : 5,6,7,8,9,10 | Convalidado 5 : CV-5 | Convalidado : CV | Módulo profesional de FCT superado : APTO | Nota final de ciclo con "Matrícula de Honor" : (Nota)-M. Honor | Módulo profesional exento : EX | Módulo con "Mención Honorifica" : 10-MH
      </Text>
            
    </Page>
  </Document>
);