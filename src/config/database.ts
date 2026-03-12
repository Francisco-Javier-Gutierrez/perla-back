import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
// ── Validación de variables de entorno ──
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD ?? '';
const DB_NAME = process.env.DB_NAME;
if (!DB_USER) {
    console.error('❌ ERROR: La variable de entorno DB_USER no está definida en .env');
    console.error('   Asegúrate de que tu archivo .env contenga DB_USER=tu_usuario');
    process.exit(1);
}
if (!DB_NAME) {
    console.error('❌ ERROR: La variable de entorno DB_NAME no está definida en .env');
    console.error('   Asegúrate de que tu archivo .env contenga DB_NAME=turistico_db');
    process.exit(1);
}
console.log(`📦 Configuración de BD: host=${DB_HOST}, user=${DB_USER}, database=${DB_NAME}`);
// ── Pool de conexiones ──
const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
// ── Verificar conexión al inicio ──
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL establecida correctamente');
        connection.release();
    } catch (error: any) {
        console.error('❌ ERROR al conectar con MySQL:');
        console.error(`   Código: ${error.code}`);
        console.error(`   Mensaje: ${error.message}`);
        if (error.code === 'ER_BAD_DB_ERROR') {
            console.error(`   ➡ La base de datos "${DB_NAME}" no existe.`);
            console.error('   Ejecuta el archivo database/schema.sql para crearla.');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error(`   ➡ Credenciales incorrectas para el usuario "${DB_USER}".`);
            console.error('   Verifica DB_USER y DB_PASSWORD en tu archivo .env');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('   ➡ No se pudo conectar al servidor MySQL.');
            console.error('   Verifica que MySQL esté corriendo y DB_HOST sea correcto.');
        }
        // No cerramos el proceso: dejamos que el servidor siga corriendo
        // para que los errores se reflejen como 500 en las rutas
        console.error('\n⚠️  El servidor seguirá corriendo pero las queries fallarán.');
        console.error('   Corrige la configuración y reinicia el servidor.\n');
    }
})();
export default pool;
