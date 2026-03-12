import mysql from 'mysql2/promise';
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // Replace with your password if needed
    database: 'turistico_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
const categoriasBase = [
    { nombre: 'Naturaleza', descripcion: 'Parques, montañas, lagos y paisajes naturales.' },
    { nombre: 'Cultura e Historia', descripcion: 'Zonas arqueológicas, museos, monumentos históricos y conventos.' },
    { nombre: 'Aventura', descripcion: 'Actividades extremas, ecoturismo y deportes al aire libre.' },
    { nombre: 'Religioso', descripcion: 'Iglesias, santuarios y peregrinaciones.' },
    { nombre: 'Recreativo', descripcion: 'Balnearios, parques acuáticos, plazas y centros de entretenimiento.' },
    { nombre: 'Gastronomía', descripcion: 'Mercados, corredores gastronómicos y restaurantes tradicionales.' }
];
async function updateCategoriasAtractivos() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('--- Iniciando Categorización de Atractivos ---');
        // 1. Asegurar que las categorías base existen en la DB y obtener su ID
        const categoriasMap = new Map();
        for (const cat of categoriasBase) {
            const [rows]: any = await conn.query('SELECT id_categoria FROM categorias WHERE nombre = ?', [cat.nombre]);
            let id;
            if (rows.length === 0) {
                const [result]: any = await conn.query('INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)', [cat.nombre, cat.descripcion]);
                id = result.insertId;
                console.log(`Creada categoría nueva: ${cat.nombre} (ID: ${id})`);
            } else {
                id = rows[0].id_categoria;
            }
            categoriasMap.set(cat.nombre, id);
        }
        // 2. Obtener todos los atractivos
        const [atractivos]: any = await conn.query('SELECT id_atractivo, nombre, descripcion_detallada, descripcion_corta FROM atractivos');
        console.log(`Se encontraron ${atractivos.length} atractivos a procesar.`);
        let actualizados = 0;
        // 3. Iterar y clasificar
        for (const atractivo of atractivos) {
            const context = `${atractivo.nombre} ${atractivo.descripcion_corta || ''} ${atractivo.descripcion_detallada || ''}`.toLowerCase();
            let categoriaSeleccionada = 'Recreativo'; // Default
            // Keywords matching
            if (context.match(/parque|cascada|agua|río|río|reserva|montaña|nevado|paisaje|naturaleza/)) {
                categoriaSeleccionada = 'Naturaleza';
            } else if (context.match(/aventura|tirolesa|extremo|senderismo|vuelo|parapente|rapel/)) {
                categoriaSeleccionada = 'Aventura';
            } else if (context.match(/iglesia|santuario|convento|templo|virgen|cristo/)) {
                categoriaSeleccionada = 'Religioso';
            } else if (context.match(/zona arqueológica|museo|historia|monumento|cultura|ex-convento|pirámide/)) {
                categoriaSeleccionada = 'Cultura e Historia';
            } else if (context.match(/mercado|gastronomía|comida|pan|taco|barbacoa/)) {
                categoriaSeleccionada = 'Gastronomía';
            } else if (context.match(/balneario|acuático|alberca|plaza|centro/)) {
                categoriaSeleccionada = 'Recreativo';
            }
            const id_categoria = categoriasMap.get(categoriaSeleccionada);
            // 4. Actualizar atractivo en MySQL
            await conn.query('UPDATE atractivos SET id_categoria = ? WHERE id_atractivo = ?', [id_categoria, atractivo.id_atractivo]);
            actualizados++;
        }
        console.log(`✅ ¡Éxito! Se actualizaron ${actualizados} atractivos con su categoría correspondiente.`);
    } catch (error) {
        console.error('Error durante la actualización:', error);
    } finally {
        if (conn) conn.release();
        process.exit(0);
    }
}
updateCategoriasAtractivos();
