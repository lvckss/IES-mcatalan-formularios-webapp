-- Inserts for Ciclos table
-- Make sure you've already created the table using:
--
--   CREATE TABLE Ciclos (
--       id_ciclo SERIAL NOT NULL,
--       curso VARCHAR(5) NOT NULL,
--       nombre VARCHAR(100) NOT NULL,
--       codigo VARCHAR(20) UNIQUE NOT NULL,
--       norma_1 TEXT NOT NULL,
--       norma_2 TEXT NOT NULL,
--       PRIMARY KEY (id_ciclo, curso)
--   );

INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('1º', 'Anatomía Patológica y Citodiagnóstico', 'SAN301_LOE', 'Real Decreto 767/2014, de 12 de septiembre, por el que se establece el título de Técnico Superior en Anatomía Patológica y Citodiagnóstico y se fijan sus enseñanzas mínimas. «BOE» núm. 241, de 4 de octubre de 2014.', 'ORDEN de 5 de mayo de 2015, de la Consejera de Educación, Universidad, Cultura y Deporte, por la que se establece el currículo del título de Técnico Superior en Anatomía Patológica y Citodiagnóstico para la Comunidad Autónoma de Aragón. – BOA: 01/06/2015.');
INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('2º', 'Anatomía Patológica y Citodiagnóstico', 'SAN301_LOE', 'Real Decreto 767/2014, de 12 de septiembre, por el que se establece el título de Técnico Superior en Anatomía Patológica y Citodiagnóstico y se fijan sus enseñanzas mínimas. «BOE» núm. 241, de 4 de octubre de 2014.', 'ORDEN de 5 de mayo de 2015, de la Consejera de Educación, Universidad, Cultura y Deporte, por la que se establece el currículo del título de Técnico Superior en Anatomía Patológica y Citodiagnóstico para la Comunidad Autónoma de Aragón. – BOA: 01/06/2015.');

INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('1º', 'Animación de Actividades Físicas y Deportivas', 'AFD301_LOGSE', 'Real Decreto 2048/1995, de 22 de diciembre, por el que se establece el título de Formación Profesional de Técnico superior en Animación de Actividades Físicas y Deportivas y las correspondientes enseñanzas mínimas.', 'Real Decreto 1262/1997, de 24 de julio, por el que se establece el currículo del ciclo formativo de grado superior correspondiente al título de Técnico superior en Animación de Actividades Físicas y Deportivas.');
INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('2º', 'Animación de Actividades Físicas y Deportivas', 'AFD301_LOGSE', 'Real Decreto 2048/1995, de 22 de diciembre, por el que se establece el título de Formación Profesional de Técnico superior en Animación de Actividades Físicas y Deportivas y las correspondientes enseñanzas mínimas.', 'Real Decreto 1262/1997, de 24 de julio, por el que se establece el currículo del ciclo formativo de grado superior correspondiente al título de Técnico superior en Animación de Actividades Físicas y Deportivas.');

INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('1º', 'Conducción de Actividades Físico-Deportivas en el Medio Natural', 'AFD201_LOGSE', 'Real Decreto 2049/1995, de 22 de diciembre, por el que se establece el título de Técnico en Conducción de Actividades Físico-Deportivas en el Medio Natural y las correspondientes enseñanzas mínimas. BOE» núm. 39, de 14 de febrero de 1996.', 'Real Decreto 1263/1997, de 24 de julio, por el que se establece el currículo del ciclo formativo de grado medio correspondiente al título de Técnico en Conducción de Actividades Físico-Deportivas en el Medio Natural. BOE n.219 de 12 de septiembre de 1997.');
INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('2º', 'Conducción de Actividades Físico-Deportivas en el Medio Natural', 'AFD201_LOGSE', 'Real Decreto 2049/1995, de 22 de diciembre, por el que se establece el título de Técnico en Conducción de Actividades Físico-Deportivas en el Medio Natural y las correspondientes enseñanzas mínimas. BOE» núm. 39, de 14 de febrero de 1996.', 'Real Decreto 1263/1997, de 24 de julio, por el que se establece el currículo del ciclo formativo de grado medio correspondiente al título de Técnico en Conducción de Actividades Físico-Deportivas en el Medio Natural. BOE n.219 de 12 de septiembre de 1997.');

INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('1º', 'Cuidados Auxiliares de Enfermería', 'SAN201_LOGSE', 'Real Decreto 546/1995, de 7 de abril, por el que se establece el título de Técnico en Cuidados Auxiliares de Enfermería y las correspondientes enseñanzas mínimas. BOE» núm. 133, de 5 de junio de 1995.', 'Real Decreto 558/1995, de 7 de abril, por el que se establece el currículo del ciclo formativo de grado medio correspondiente al título de Técnico en Cuidados Auxiliares de Enfermería. BOE» núm. 134, de 6 de junio de 1995.');
INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('2º', 'Cuidados Auxiliares de Enfermería', 'SAN201_LOGSE', 'Real Decreto 546/1995, de 7 de abril, por el que se establece el título de Técnico en Cuidados Auxiliares de Enfermería y las correspondientes enseñanzas mínimas. BOE» núm. 133, de 5 de junio de 1995.', 'Real Decreto 558/1995, de 7 de abril, por el que se establece el currículo del ciclo formativo de grado medio correspondiente al título de Técnico en Cuidados Auxiliares de Enfermería. BOE» núm. 134, de 6 de junio de 1995.');

INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('1º', 'Desarrollo de Aplicaciones Multiplataforma', 'IFC302_LOE', 'Real Decreto 405/2023, de 29 de mayo, por el que se actualizan los títulos de la formación profesional del sistema educativo de Técnico Superior en Desarrollo de Aplicaciones Multiplataforma y Técnico Superior en Desarrollo de Aplicaciones Web, de la fami', 'ORDEN de 25 de abril de 2011, de la Consejera de Educación, Cultura y Deporte, por la que se establece el currículo del título de Técnico Superior en Desarrollo de Aplicaciones Multiplataforma para la Comunidad Autónoma de Aragón.');
INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('2º', 'Desarrollo de Aplicaciones Multiplataforma', 'IFC302_LOE', 'Real Decreto 405/2023, de 29 de mayo, por el que se actualizan los títulos de la formación profesional del sistema educativo de Técnico Superior en Desarrollo de Aplicaciones Multiplataforma y Técnico Superior en Desarrollo de Aplicaciones Web, de la fami', 'ORDEN de 25 de abril de 2011, de la Consejera de Educación, Cultura y Deporte, por la que se establece el currículo del título de Técnico Superior en Desarrollo de Aplicaciones Multiplataforma para la Comunidad Autónoma de Aragón.');

INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('1º', 'Dietética', 'SAN302_LOGSE', 'Real Decreto 536/1995, de 7 de abril, por el que se establece el título de Técnico superior en Dietética y las correspondientes enseñanzas mínimas
«BOE» núm. 131, de 2 de junio de 1995.', 'Real Decreto 548/1995, de 7 de abril, por el que se establece el currículo del ciclo formativo de grado superior correspondiente al título de Técnico superior en Dietética. BOE: 2 de junio de 1995.');
INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('2º', 'Dietética', 'SAN302_LOGSE', 'Real Decreto 536/1995, de 7 de abril, por el que se establece el título de Técnico superior en Dietética y las correspondientes enseñanzas mínimas
«BOE» núm. 131, de 2 de junio de 1995.', 'Real Decreto 548/1995, de 7 de abril, por el que se establece el currículo del ciclo formativo de grado superior correspondiente al título de Técnico superior en Dietética. BOE: 2 de junio de 1995.');

INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('1º', 'Enseñanza y Animación Sociodeportiva', 'AFD301_LOE', 'Real Decreto 653/2017, de 23 de junio, por el que se establece el título de Técnico Superior en enseñanza y animación sociodeportiva y se fijan los aspectos básicos del currículo.', 'ORDEN ECD/1352/2018, de 31 de julio, por la que se establece el currículo del título de Técnico Superior en Enseñanza y animación sociodeportiva para la Comunidad Autónoma de Aragón. BOA, n. 161, de 21 de agosto de 2018.');
INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('2º', 'Enseñanza y Animación Sociodeportiva', 'AFD301_LOE', 'Real Decreto 653/2017, de 23 de junio, por el que se establece el título de Técnico Superior en enseñanza y animación sociodeportiva y se fijan los aspectos básicos del currículo.', 'ORDEN ECD/1352/2018, de 31 de julio, por la que se establece el currículo del título de Técnico Superior en Enseñanza y animación sociodeportiva para la Comunidad Autónoma de Aragón. BOA, n. 161, de 21 de agosto de 2018.');

INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('1º', 'Farmacia y Parafarmacia', 'SAN202_LOE', 'Real Decreto 1689/2007, de 14 de diciembre, por el que se establece el título de Técnico en Farmacia y Parafarmacia y se fijan sus enseñanzas mínimas. BOE» núm. 15, de 17 de enero de 2008.', 'ORDEN de 26 de mayo de 2009, de la Consejera de Educación, Cultura y Deporte, por la que se establece el currículo del título de Técnico en Farmacia y Parafarmacia para la Comunidad Autónoma de Aragón. Boletín Oficial de Aragón 16/06/2009.');
INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('2º', 'Farmacia y Parafarmacia', 'SAN202_LOE', 'Real Decreto 1689/2007, de 14 de diciembre, por el que se establece el título de Técnico en Farmacia y Parafarmacia y se fijan sus enseñanzas mínimas. BOE» núm. 15, de 17 de enero de 2008.', 'ORDEN de 26 de mayo de 2009, de la Consejera de Educación, Cultura y Deporte, por la que se establece el currículo del título de Técnico en Farmacia y Parafarmacia para la Comunidad Autónoma de Aragón. Boletín Oficial de Aragón 16/06/2009.');

INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('1º', 'Guía en el Medio Natural y de Tiempo Libre', 'AFD201_LOE', 'Real Decreto 402/2020, de 25 de febrero, por el que se establece el título de Técnico en Guía en el medio natural y de tiempo libre y se fijan los aspectos básicos del currículo. BOE» núm. 50, de 27 de febrero de 2020.', 'ORDEN ECD/987/2021, de 5 de agosto, por la que se establece el currículo del título de Técnico en Guía en el medio natural y de tiempo libre para la Comunidad Autónoma de Aragón. Boletín Oficial de Aragón 19/08/2021.');
INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('2º', 'Guía en el Medio Natural y de Tiempo Libre', 'AFD201_LOE', 'Real Decreto 402/2020, de 25 de febrero, por el que se establece el título de Técnico en Guía en el medio natural y de tiempo libre y se fijan los aspectos básicos del currículo. BOE» núm. 50, de 27 de febrero de 2020.', 'ORDEN ECD/987/2021, de 5 de agosto, por la que se establece el currículo del título de Técnico en Guía en el medio natural y de tiempo libre para la Comunidad Autónoma de Aragón. Boletín Oficial de Aragón 19/08/2021.');

INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('1º', 'Imagen para el Diagnóstico y Medicina Nuclear', 'SAN305_LOE', 'Real Decreto 770/2014, de 12 de septiembre, por el que se establece el título de Técnico Superior en Imagen para el Diagnóstico y Medicina Nuclear y se fijan sus enseñanzas mínimas. «BOE» núm. 241, de 4 de octubre de 2014.', 'ORDEN 5 de mayo de 2015, de la Consejera de Educación, Universidad, Cultura y Deporte, por la que se establece el currículo del título de Técnico Superior en Imagen para el Diagnóstico y Medicina Nuclear para la Comunidad Autónoma de Aragón. BOA: 5/6/2015');
INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('2º', 'Imagen para el Diagnóstico y Medicina Nuclear', 'SAN305_LOE', 'Real Decreto 770/2014, de 12 de septiembre, por el que se establece el título de Técnico Superior en Imagen para el Diagnóstico y Medicina Nuclear y se fijan sus enseñanzas mínimas. «BOE» núm. 241, de 4 de octubre de 2014.', 'ORDEN 5 de mayo de 2015, de la Consejera de Educación, Universidad, Cultura y Deporte, por la que se establece el currículo del título de Técnico Superior en Imagen para el Diagnóstico y Medicina Nuclear para la Comunidad Autónoma de Aragón. BOA: 5/6/2015');

