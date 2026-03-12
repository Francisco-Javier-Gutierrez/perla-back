import mysql from 'mysql2/promise';
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'turistico_db',
    waitForConnections: true,
    connectionLimit: 10,
});
const gastronomiaDestinos: Record<string, string> = {
    'Tejupilco': 'Famoso por sus dulces de leche, el pan de feria que se hornea en hornos de barro y una tradicional nieve de sabores frutales que no te puedes perder al visitar el centro.',
    'Luvianos': 'Su cocina destaca por la mojarra frita dorada pescada localmente, acompañada de salsa de molcajete, frijoles de la olla y tortillas echadas a mano.',
    'Amatepec': 'Tierra cafetalera por excelencia; aquí podrás degustar un café orgánico recién tostado acompañado de pan artesanal y deliciosas frutas tropicales de la región.',
    'Tlatlaya': 'Disfruta de exquisitos platillos campestres como la cecina aderezada, queso fresco artesanal y guisados caldosos que reflejan el auténtico sabor del sur caliente.',
    'Ixtapan de la Sal': 'Aparte de sus aguas termales, Ixtapan te recibe con el clásico chilacayote en dulce, gorditas de chicharrón y las tradicionales paletas heladas para sobrellevar el clima soleado.',
    'Tonatico': 'No te puedes ir sin probar la barbacoa de hoyo tradicional, el chicharrón preparado y sus reconocidas nieves artesanales servidas en el zócalo del municipio.',
    'Malinalco': 'Pueblo Mágico donde destaca la trucha arcoíris preparada al gusto, los tacos de cecina ahumada, y el emblemático mezcal artesanal destilado en las comunidades aledañas.',
    'Zacualpan': 'Municipio minero con sabor a tradición. Disfruta de la mermelada de durazno, ate de membrillo y un reconfortante atole de masa endulzado con piloncillo.',
    'Sultepec': 'Famoso por su requesón fresco, las famosas galletas de fruta de horno y los dulces de pipián que deleitan el paladar de locales y visitantes.',
    'Valle de Bravo': 'Siendo un polo turístico, ofrece desde cocina internacional hasta los tradicionales esquites de la plaza, trucha en sus restaurantes flotantes y deliciosas pizzas en horno de leña.',
    'Otzoloapan': 'Ofrece platillos frescos de la región aprovechando su cercanía a ríos, como deliciosos curados de frutas, cecina seca y tortillas recién hechecitas.',
    'Santo Tomás': 'El maíz es el rey; prueba sus tamales nejos, un exquisito mole de guajolote y los panes dulces típicos elaborados con recetas familiares de hace décadas.',
    // Default fallback para el resto de los 25 destinos si los hay
    'default': 'Explora un mundo de sabores locales: desde antojitos mexicanos en sus plazas, mercado tradicional con barbacoa, cecina y quesos frescos, hasta dulces típicos regionales elaborados artesanalmente.'
};
async function updateGastronomia() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('--- Iniciando Actualización de Gastronomía ---');
        // 1. Agregar la columna 'gastronomia' a 'datos_destino' si no existe
        try {
            await conn.query('ALTER TABLE datos_destino ADD COLUMN gastronomia TEXT');
            console.log('Columna "gastronomia" creada exitosamente.');
        } catch (e: any) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('La columna "gastronomia" ya existe.');
            } else {
                throw e;
            }
        }
        // 2. Obtener todos los destinos para saber su ID y Nombre
        const [destinos]: any = await conn.query('SELECT id_destino, nombre FROM destinos');
        console.log(`Verificando gastronomía para ${destinos.length} destinos...`);
        let count = 0;
        for (const dest of destinos) {
            // MATCH EXACT NAME, OR FALLBACK
            const gastroText = gastronomiaDestinos[dest.nombre] || gastronomiaDestinos['default'];
            // Actualizar datos_destino. Si el registro existe:
            const [updateResult]: any = await conn.query(
                `UPDATE datos_destino SET gastronomia = ? WHERE id_destino = ?`,
                [gastroText, dest.id_destino]
            );
            // Si el updateAfectedRow es 0 por alguna razón (quizá no hay registro en datos_destino), lo insertamos.
            if (updateResult.affectedRows === 0) {
                await conn.query(
                    `INSERT INTO datos_destino (id_destino, gastronomia) VALUES (?, ?)`,
                    [dest.id_destino, gastroText]
                );
            }
            count++;
        }

        console.log(`✅ ¡Gastronomía insertada correctamente en ${count} destinos!`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (conn) conn.release();
        process.exit(0);
    }
}
updateGastronomia();
