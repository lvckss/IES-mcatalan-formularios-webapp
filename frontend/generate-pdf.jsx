// generate-pdf.mjs
import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import { CertificadoDocument } from './pdf/certificadoDocument';

// Aquí usas datos de prueba parecidos a los reales:
const datosPrueba = {
  secretario: {
    nombre: 'Antonio Higueras Valenzuela',
  },
  instituto: {
    nombre: 'MIGUEL CATALÁN',
    codigo: '50011525',
    direccion: 'Pº Isabel la Católica, 3. 50009, Zaragoza',
    telefono: '976402004',
    email: 'secretaria@ies-mcatalan.com',
    localidad: 'Zaragoza',
  },
  alumno: {
    nombre_completo: 'Nombre APELLIDO1 APELLIDO2',
    dni: '73014454B',
    expediente: '50011525-210380',
  },
  ciclo: {
    denominacion: 'Anatomía Patológica y Citodiagnóstico',
    realDecreto: '767/2014 (BOE 4/10/2014)',
    orden_fecha: '05 de mayo de 2015 (BOA 01/06/2015)',
    realDecreto1147: '1147/2011',
  },
  centro: {
    denominacion: 'Formacciona',
    codigo: '50019640',
    direccion: 'Calle Asín y Palacios, 18. Zaragoza',
  },
  modulos: [
    { codigo: '1367', denominacion: 'Gestión de muestras biológicas', calificacion: '9' },
    { codigo: '1368', denominacion: 'Técnicas generales de laboratorio', calificacion: '8' },
    // …añade todos los módulos que quieras probar…
    { codigo: '1386', denominacion: 'Formación en centros de trabajo (FCT)', calificacion: 'APTO' },
  ],
  nota_final: '7,85',
  fecha_expedicion: '9 de octubre de 2023',
  director: 'D. Ricardo Flores Montesinos',
};

// Renderiza y guarda el PDF en disco
ReactPDF.render(
  <CertificadoDocument datos={datosPrueba} />,
  `${process.cwd()}/certificado-prueba.pdf`
).then(() => {
  console.log('✅ PDF generado en certificado-prueba.pdf');
}).catch(err => {
  console.error('❌ Error generando PDF:', err);
});