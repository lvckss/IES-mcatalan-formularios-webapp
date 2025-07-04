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
VALUES ('1º', 'Anatomía Patológica y Citodiagnóstico', 'SAN301_LOE', 'Real Decreto 767/2014 04/10/2014', 'ORDEN de 5 de mayo de 2015 (BOA: 01/06/2015)');
INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('2º', 'Anatomía Patológica y Citodiagnóstico', 'SAN301_LOE', 'Real Decreto 767/2014 04/10/2014', 'ORDEN de 5 de mayo de 2015 (BOA: 01/06/2015)');

INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('1º', 'Animación de Actividades Físicas y Deportivas', 'AFD301_LOGSE', 'Real Decreto 2048/1995 22/12/1995', 'Real Decreto 1262/1997 24/07/1997');
INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('2º', 'Animación de Actividades Físicas y Deportivas', 'AFD301_LOGSE', 'Real Decreto 2048/1995 22/12/1995', 'Real Decreto 1262/1997 24/07/1997');

INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('1º', 'Conducción de Actividades Físico-Deportivas en el Medio Natural', 'AFD201_LOGSE', 'Real Decreto 2049/1995 14/02/1996', 'Real Decreto 1263/1997 12/09/1997');
INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('2º', 'Conducción de Actividades Físico-Deportivas en el Medio Natural', 'AFD201_LOGSE', 'Real Decreto 2049/1995 14/02/1996', 'Real Decreto 1263/1997 12/09/1997');

INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('1º', 'Cuidados Auxiliares de Enfermería', 'SAN201_LOGSE', 'Real Decreto 546/1995 05/06/1995', 'Real Decreto 558/1995 06/06/1995');
INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('2º', 'Cuidados Auxiliares de Enfermería', 'SAN201_LOGSE', 'Real Decreto 546/1995 05/06/1995', 'Real Decreto 558/1995 06/06/1995');

INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('1º', 'Desarrollo de Aplicaciones Multiplataforma', 'IFC302_LOE', 'Real Decreto 405/2023 29/05/2023', 'ORDEN de 25 de abril de 2011');
INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('2º', 'Desarrollo de Aplicaciones Multiplataforma', 'IFC302_LOE', 'Real Decreto 405/2023 29/05/2023', 'ORDEN de 25 de abril de 2011');

INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('1º', 'Dietética', 'SAN302_LOGSE', 'Real Decreto 536/1995 02/06/1995', 'Real Decreto 548/1995 02/06/1995');
INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('2º', 'Dietética', 'SAN302_LOGSE', 'Real Decreto 536/1995 02/06/1995', 'Real Decreto 548/1995 02/06/1995');

INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('1º', 'Enseñanza y Animación Sociodeportiva', 'AFD301_LOE', 'Real Decreto 653/2017 23/06/2017', 'ORDEN de 31 de julio de 2018 (BOA: 21/08/2018)');
INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('2º', 'Enseñanza y Animación Sociodeportiva', 'AFD301_LOE', 'Real Decreto 653/2017 23/06/2017', 'ORDEN de 31 de julio de 2018 (BOA: 21/08/2018)');

INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('1º', 'Farmacia y Parafarmacia', 'SAN202_LOE', 'Real Decreto 1689/2007 17/01/2008', 'ORDEN de 26 de mayo de 2009 (BOA: 16/06/2009)');
INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('2º', 'Farmacia y Parafarmacia', 'SAN202_LOE', 'Real Decreto 1689/2007 17/01/2008', 'ORDEN de 26 de mayo de 2009 (BOA: 16/06/2009)');

INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('1º', 'Guía en el Medio Natural y de Tiempo Libre', 'AFD201_LOE', 'Real Decreto 402/2020 27/02/2020', 'ORDEN de 5 de agosto de 2021 (BOA: 19/08/2021)');
INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('2º', 'Guía en el Medio Natural y de Tiempo Libre', 'AFD201_LOE', 'Real Decreto 402/2020 27/02/2020', 'ORDEN de 5 de agosto de 2021 (BOA: 19/08/2021)');

INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('1º', 'Imagen para el Diagnóstico y Medicina Nuclear', 'SAN305_LOE', 'Real Decreto 770/2014 04/10/2014', 'ORDEN de 5 de mayo de 2015 (BOA: 05/06/2015)');
INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
VALUES ('2º', 'Imagen para el Diagnóstico y Medicina Nuclear', 'SAN305_LOE', 'Real Decreto 770/2014 04/10/2014', 'ORDEN de 5 de mayo de 2015 (BOA: 05/06/2015)');
