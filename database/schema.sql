CREATE DATABASE IF NOT EXISTS turistico_db;
USE turistico_db;

-- Tabla: categorias
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- Tabla: destinos
CREATE TABLE IF NOT EXISTS destinos (
    id_destino INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    imagen_portada VARCHAR(500),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: destino_categoria (conecta categorías con destinos, muchos-a-muchos)
CREATE TABLE IF NOT EXISTS destino_categoria (
    id_destino INT NOT NULL,
    id_categoria INT NOT NULL,
    PRIMARY KEY (id_destino, id_categoria),
    FOREIGN KEY (id_destino) REFERENCES destinos(id_destino) ON DELETE CASCADE,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE CASCADE
);

-- Tabla: datos_destino (información práctica de un destino)
CREATE TABLE IF NOT EXISTS datos_destino (
    id_datos INT AUTO_INCREMENT PRIMARY KEY,
    id_destino INT NOT NULL UNIQUE,
    horario VARCHAR(255),
    precio VARCHAR(100),
    telefono VARCHAR(50),
    direccion VARCHAR(255),
    recomendaciones TEXT,
    FOREIGN KEY (id_destino) REFERENCES destinos(id_destino) ON DELETE CASCADE
);

-- Tabla: atractivos (pertenecen a un destino)
CREATE TABLE IF NOT EXISTS atractivos (
    id_atractivo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion_corta VARCHAR(255) NOT NULL,
    descripcion_detallada TEXT NOT NULL,
    horario VARCHAR(255),
    costo VARCHAR(100),
    telefono VARCHAR(50),
    imagen_url VARCHAR(500),
    id_destino INT,
    id_categoria INT,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_destino) REFERENCES destinos(id_destino) ON DELETE SET NULL,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE SET NULL
);

-- Tabla: fotos_atractivo
CREATE TABLE IF NOT EXISTS fotos_atractivo (
    id_foto INT AUTO_INCREMENT PRIMARY KEY,
    id_atractivo INT NOT NULL,
    url_imagen VARCHAR(500) NOT NULL,
    descripcion_imagen VARCHAR(255),
    orden INT DEFAULT 0,
    FOREIGN KEY (id_atractivo) REFERENCES atractivos(id_atractivo) ON DELETE CASCADE
);

-- Tabla: ubicaciones
CREATE TABLE IF NOT EXISTS ubicaciones (
    id_ubicacion INT AUTO_INCREMENT PRIMARY KEY,
    id_atractivo INT NOT NULL UNIQUE,
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    FOREIGN KEY (id_atractivo) REFERENCES atractivos(id_atractivo) ON DELETE CASCADE
);

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'usuario') DEFAULT 'usuario',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: reseñas
CREATE TABLE IF NOT EXISTS resenas (
    id_resena INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_atractivo INT NOT NULL,
    calificacion INT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_atractivo) REFERENCES atractivos(id_atractivo) ON DELETE CASCADE
);

-- Datos de ejemplo
INSERT IGNORE INTO categorias (id_categoria, nombre, descripcion) VALUES
(1, 'Playas', 'Destinos costeros e islas'),
(2, 'Aventura', 'Actividades al aire libre y deportes extremos'),
(3, 'Cultura', 'Sitios históricos y museos'),
(4, 'Naturaleza', 'Parques nacionales y reservas naturales');

INSERT IGNORE INTO destinos (id_destino, nombre, descripcion, imagen_portada) VALUES
(1, 'Cancún', 'Destino paradisíaco en el Caribe mexicano, conocido por sus playas de arena blanca y aguas turquesas.', 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=800'),
(2, 'Ciudad de México', 'Capital cultural con museos de clase mundial, gastronomía extraordinaria y rica historia prehispánica.', 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=800'),
(3, 'Oaxaca', 'Tierra de tradiciones, mezcal, textiles artesanales y la impresionante Hierve el Agua.', 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=800');

INSERT IGNORE INTO destino_categoria (id_destino, id_categoria) VALUES
(1, 1), (1, 2),
(2, 3), (2, 4),
(3, 3), (3, 4), (3, 2);

-- Datos prácticos de los destinos
INSERT IGNORE INTO datos_destino (id_datos, id_destino, horario, precio, telefono, direccion, recomendaciones) VALUES
(1, 1, 'Abierto todo el año', 'Varía por actividad', '+52 998 123 4567', 'Zona Hotelera, Cancún, Q.R.', 'Llevar protector solar, reservar tours con anticipación. Mejor época: diciembre-abril.'),
(2, 2, 'Museos: 9:00 AM - 5:00 PM', 'Entrada a museos desde $80 MXN', '+52 55 5555 1234', 'Centro Histórico, CDMX', 'Usar metro para moverse, visitar Chapultepec y Coyoacán. Probar tacos de canasta.'),
(3, 3, 'Mercados: 8:00 AM - 6:00 PM', 'Entrada a zonas arqueológicas desde $75 MXN', '+52 951 234 5678', 'Centro, Oaxaca de Juárez', 'No perderse el mezcal artesanal, visitar Monte Albán temprano para evitar el calor.');

-- Atractivos vinculados a destinos
INSERT IGNORE INTO atractivos (id_atractivo, nombre, descripcion_corta, descripcion_detallada, id_destino, id_categoria, activo) VALUES
(1, 'Playa Delfines', 'Playa pública con vista espectacular al mar Caribe', 'Playa Delfines es una de las playas más hermosas y accesibles de Cancún. Con su arena blanca y aguas cristalinas de color turquesa, es el lugar perfecto para relajarse, nadar o simplemente disfrutar de una puesta de sol inolvidable. Cuenta con el icónico letrero de Cancún, ideal para fotos.', 1, 1, TRUE),
(2, 'Parque Xcaret', 'Parque eco-arqueológico con actividades acuáticas', 'Xcaret es un parque temático que combina naturaleza, cultura y aventura. Ofrece ríos subterráneos, snorkel en arrecifes, un aviario, mariposario, acuario y espectaculares shows nocturnos de música y danza mexicana. Una experiencia completa para toda la familia.', 1, 2, TRUE),
(3, 'Museo Nacional de Antropología', 'El museo más importante de México', 'El Museo Nacional de Antropología alberga la colección más importante de arte prehispánico del mundo. Con 23 salas de exhibición, incluye piezas icónicas como la Piedra del Sol (calendario azteca) y reproduce ambientes de las principales civilizaciones mesoamericanas.', 2, 3, TRUE),
(4, 'Bosque de Chapultepec', 'Pulmón verde de la ciudad con castillo histórico', 'El Bosque de Chapultepec es el parque urbano más grande de Latinoamérica. Con lagos, jardines, museos y el imponente Castillo de Chapultepec en su cima, ofrece un escape natural en medio de la ciudad. Perfecto para caminatas, picnics y actividades culturales.', 2, 4, TRUE),
(5, 'Monte Albán', 'Zona arqueológica zapoteca Patrimonio de la Humanidad', 'Monte Albán fue la capital de los zapotecas y es una de las zonas arqueológicas más impresionantes de México. Ubicada en la cima de una montaña con vistas panorámicas del Valle de Oaxaca, sus plazas, templos y tumbas cuentan la historia de más de 1,500 años de civilización.', 3, 3, TRUE),
(6, 'Hierve el Agua', 'Cascadas petrificadas y pozas naturales', 'Hierve el Agua es una formación rocosa natural que simula cascadas petrificadas, formadas durante miles de años por el escurrimiento de agua mineralizada. En la cima se encuentran pozas naturales de agua templada con vistas espectaculares a las montañas. Un destino imperdible para los amantes de la naturaleza.', 3, 4, TRUE);

-- Fotos de atractivos
INSERT IGNORE INTO fotos_atractivo (id_foto, id_atractivo, url_imagen, descripcion_imagen, orden) VALUES
(1, 1, 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800', 'Vista panorámica de Playa Delfines', 1),
(2, 2, 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=800', 'Entrada al parque Xcaret', 1),
(3, 3, 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800', 'Sala principal del museo', 1),
(4, 4, 'https://images.unsplash.com/photo-1587829549520-e213281d7790?w=800', 'Castillo de Chapultepec', 1),
(5, 5, 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=800', 'Vista aérea de Monte Albán', 1),
(6, 6, 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800', 'Cascadas petrificadas', 1);

-- Ubicaciones de atractivos
INSERT IGNORE INTO ubicaciones (id_ubicacion, id_atractivo, latitud, longitud) VALUES
(1, 1, 21.09430000, -86.77180000),
(2, 2, 20.58000000, -87.12000000),
(3, 3, 19.42580000, -99.18610000),
(4, 4, 19.42050000, -99.18180000),
(5, 5, 17.04370000, -96.76760000),
(6, 6, 16.86610000, -96.27580000);
