import mysql from 'mysql2/promise';
import fs from 'fs';
async function run() {
    try {
        const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'turistico_db' });
        // I need to ensure exactly 4 atractivos per destino have unique images.
        // Let's get the top 4 atractivos for each destino.
        const [destinos]: any = await pool.query('SELECT id_destino, nombre FROM destinos ORDER BY id_destino');
        let toGenerate = [];
        for (const dest of destinos) {
            const [atractivos]: any = await pool.query('SELECT id_atractivo, nombre, imagen_url FROM atractivos WHERE id_destino = ? ORDER BY id_atractivo ASC LIMIT 4', [dest.id_destino]);
            for (const a of atractivos) {
                if (!a.imagen_url || a.imagen_url.includes('atractivo_') || a.imagen_url === 'valle_bravo_lago.png') {
                    toGenerate.push({ id_atractivo: a.id_atractivo, nombre: a.nombre, destino: dest.nombre });
                }
            }
        }
        fs.writeFileSync('to_generate.json', JSON.stringify(toGenerate, null, 2));
        console.log(`Found ${toGenerate.length} atractivos missing unique images.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
