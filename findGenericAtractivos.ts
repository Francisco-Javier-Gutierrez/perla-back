import mysql from 'mysql2/promise';

async function run() {
    try {
        const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'turistico_db' });

        const [atractivos]: any = await pool.query(`
            SELECT a.id_atractivo, a.nombre as atractivo_nombre, d.nombre as destino_nombre, a.imagen_url
            FROM atractivos a
            JOIN destinos d ON a.id_destino = d.id_destino
            WHERE a.imagen_url LIKE 'atractivo_%' OR a.imagen_url IS NULL OR a.imagen_url = 'valle_bravo_lago.png'
        `);
        console.log(JSON.stringify(atractivos, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
