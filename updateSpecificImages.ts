import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function run() {
    try {
        const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'turistico_db' });

        const uploadsDir = path.join(__dirname, 'uploads');
        const files = fs.readdirSync(uploadsDir);

        function getLatestImage(prefix: string, fallback: string): string {
            const matches = files.filter(f => f.startsWith(prefix) && f.endsWith('.png'));
            matches.sort();
            return matches.length > 0 ? matches[matches.length - 1] : (fallback ? getLatestImage(fallback, '') : 'valle_bravo_lago.png');
        }

        const updates = [
            // Malinalco
            { id: 1, img: getLatestImage('santuario_chalma', 'atractivo_iglesia') },
            { id: 2, img: getLatestImage('zona_cuauhcalli', 'atractivo_arqueologica') },
            { id: 3, img: getLatestImage('museo_schneider', 'atractivo_iglesia') },

            // Ixtapan
            { id: 5, img: getLatestImage('balneario_banito', 'atractivo_cascada') },

            // Tonatico
            { id: 6, img: getLatestImage('grutas_estrella', 'atractivo_grutas') },
            { id: 7, img: getLatestImage('salto_tzumpantitlan', 'atractivo_cascada') },
            { id: 19, img: getLatestImage('santuario_tonatico', 'atractivo_iglesia') },
            { id: 20, img: getLatestImage('rio_tonatico', 'atractivo_grutas') },

            // Valle de Bravo
            { id: 8, img: getLatestImage('velo_novia', 'atractivo_cascada') },
            { id: 9, img: getLatestImage('santuario_monarca', 'amatepec_cafetales') },
            { id: 10, img: getLatestImage('stupa_paz', 'atractivo_iglesia') },
            { id: 11, img: getLatestImage('cerro_cruz', 'tlatlaya_naturaleza') },

            // Zacualpan
            { id: 12, img: getLatestImage('minas_zacualpan', 'atractivo_grutas') },
            { id: 31, img: getLatestImage('iglesia_cristo', 'atractivo_iglesia') },
            { id: 32, img: getLatestImage('mirador_minero', 'tlatlaya_naturaleza') },

            // Sultepec
            { id: 13, img: getLatestImage('parroquia_sultepec', 'atractivo_iglesia') },
            { id: 14, img: getLatestImage('mirador_santa_cruz', 'cerro_cruz') },
            { id: 33, img: getLatestImage('cerro_herradura', 'tlatlaya_naturaleza') },
            { id: 34, img: getLatestImage('rio_mariposas', 'atractivo_cascada') },

            // Amatepec
            { id: 35, img: getLatestImage('cascada_salto', 'atractivo_cascada') },
            { id: 36, img: getLatestImage('grutas_amate', 'atractivo_grutas') },

            // Tlatlaya
            { id: 15, img: getLatestImage('cascada_francisco', 'atractivo_cascada') },
            { id: 37, img: getLatestImage('canadon_huajintlan', 'tlatlaya_naturaleza') }
        ];

        for (const u of updates) {
            if (u.img) {
                await pool.query('UPDATE atractivos SET imagen_url = ? WHERE id_atractivo = ?', [u.img, u.id]);
                console.log(`Updated atractivo ${u.id} with image ${u.img}`);
            }
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
