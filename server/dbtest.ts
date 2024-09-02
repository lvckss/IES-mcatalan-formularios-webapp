import postgres from "postgres";

// Configuración del cliente PostgreSQL
const sql = postgres({
    host: 'localhost',  // Host de la base de datos
    port: 5432,  // Puerto de la base de datos
    database: 'iesmcatalan_formacciona',  // Nombre de la base de datos
    username: 'postgres',  // Usuario de la base de datos
    password: 'ies-mcatalan-123',  // Contraseña de la base de datos
});

export const query = (text: string, params?: any[]) => sql.unsafe(text, params);

const insertAlumnos = async () => {
    const insertQuery = `
        INSERT INTO Alumnos (nombre, apellido1, apellido2, id_legal, fecha_nacimiento, code_expediente) 
        VALUES 
        ('Juan', 'Pérez', 'Gómez', '12345678A', '2000-05-15', 'EXP001'), 
        ('María', 'López', 'Martínez', '87654321B', '1999-11-22', 'EXP002'),
        ('Pedro', 'García', 'Fernández', '98765432C', '2001-08-10', 'EXP003'), 
        ('Ana', 'Rodríguez', 'Sánchez', '54321678D', '2002-03-25', 'EXP004'),
        ('Luis', 'González', 'Hernández', '65432187E', '2003-06-05', 'EXP005'),
        ('Laura', 'Fernández', 'Gómez', '78901234F', '2004-09-12', 'EXP006'),
        ('Carlos', 'Martínez', 'López', '21098765G', '2005-12-30', 'EXP007'),
        ('Sara', 'Sánchez', 'Rodríguez', '87654321H', '2006-04-17', 'EXP008'),
        ('Javier', 'Hernández', 'González', '54321678I', '2007-07-24', 'EXP009'),
        ('Elena', 'Gómez', 'Fernández', '12345678J', '2008-10-31', 'EXP010');
    `;
    try {
        await query(insertQuery);
        console.log("Insert successful");
    } catch (error) {
        console.error("Error inserting data:", error);
    }
};

insertAlumnos();