// main.js — Lógica principal del frontend TurismoApp
// ── State ──
let currentPage = 'home';
let adminTab = 'destinos';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600';
const FALLBACK_IMG_LG = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200';
// ── DOM Elements ──
const appContent = document.getElementById('app-content');
const navbar = document.getElementById('navbar');
// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    navigateTo('home');
    setupNavigation();
    setupMobileMenu();
});
// ── Navigation ──
function setupNavigation() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-page]');
        if (link) {
            e.preventDefault();
            navigateTo(link.dataset.page);
        }
        // Logout
        if (e.target.closest('#btn-logout')) {
            e.preventDefault();
            api.clearAuth();
            updateAuthUI();
            navigateTo('home');
            showToast('Sesión cerrada', 'info');
        }
        // User dropdown toggle
        if (e.target.closest('#user-menu-btn')) {
            document.getElementById('dropdown-menu')?.classList.toggle('show');
        } else if (!e.target.closest('.dropdown-menu')) {
            document.getElementById('dropdown-menu')?.classList.remove('show');
        }
    });
}
function setupMobileMenu() {
    document.getElementById('mobile-toggle')?.addEventListener('click', () => {
        navbar.classList.toggle('mobile-open');
    });
}
function navigateTo(page, data = null) {
    currentPage = page;
    updateActiveLink();
    navbar.classList.remove('mobile-open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    switch (page) {
        case 'home': renderHome(); break;
        case 'destinos': renderDestinos(); break;
        case 'destino-detail': renderDestinoDetail(data); break;
        case 'atractivo-detail': renderAtractivoDetail(data); break;
        case 'categorias': renderCategorias(); break;
        case 'login': renderLogin(); break;
        case 'register': renderRegister(); break;
        case 'perfil': renderPerfil(); break;
        case 'admin': renderAdmin(); break;
        default: renderHome();
    }
}
function updateActiveLink() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === currentPage);
    });
}
function updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const adminLinks = document.querySelectorAll('.admin-only');
    if (api.isLoggedIn()) {
        authButtons?.classList.add('hidden');
        userMenu?.classList.remove('hidden');
        document.getElementById('user-name').textContent = api.usuario.nombre;
        document.getElementById('user-avatar').textContent = api.usuario.nombre.charAt(0).toUpperCase();
        if (api.isAdmin()) {
            adminLinks.forEach(el => el.classList.remove('hidden'));
        } else {
            adminLinks.forEach(el => el.classList.add('hidden'));
        }
    } else {
        authButtons?.classList.remove('hidden');
        userMenu?.classList.add('hidden');
        adminLinks.forEach(el => el.classList.add('hidden'));
    }
}
// ── Toast ──
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}
// ── Helpers ──
function renderStars(rating) {
    if (!rating) return '<span class="stars">☆☆☆☆☆</span>';
    const full = Math.round(Number(rating));
    return '<span class="stars">' + '★'.repeat(full) + '☆'.repeat(5 - full) + '</span>';
}
function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
}
function showLoading() {
    return '<div class="loading"><div class="spinner"></div></div>';
}
// Helper: obtener la URL de imagen segura
function getImageUrl(url, fallback) {
    if (!url || url === 'null' || url === 'undefined') return fallback || FALLBACK_IMG;
    return url;
}
// Helper: obtener nombres de categorías de un destino (funciona con array de objetos)
function getCategoryNames(categorias) {
    if (!categorias || !Array.isArray(categorias) || categorias.length === 0) return [];
    return categorias.map(c => (typeof c === 'string') ? c : (c.nombre || ''));
}
// ═════════════════════════════════════════════════
// ── PAGE: Home ──
// ═════════════════════════════════════════════════
async function renderHome() {
    appContent.innerHTML = `
        <section class="hero">
            <div class="hero-content">
                <div class="hero-badge">🌟 Explora el mundo</div>
                <h1>Descubre destinos <span class="gradient-text">increíbles</span></h1>
                <p>Encuentra los mejores lugares turísticos, lee reseñas de otros viajeros y planifica tu próxima aventura.</p>
                <div class="hero-actions">
                    <button class="btn btn-primary btn-lg" data-page="destinos">Explorar Destinos</button>
                    <button class="btn btn-ghost btn-lg" data-page="categorias">Ver Categorías</button>
                </div>
            </div>
        </section>
        <section class="section">
            <div class="section-header">
                <h2>Destinos Populares</h2>
                <p>Los destinos más visitados y mejor calificados</p>
            </div>
            <div id="home-destinos" class="cards-grid">${showLoading()}</div>
        </section>
    `;
    try {
        const destinos = await api.getDestinos();
        const container = document.getElementById('home-destinos');
        if (!Array.isArray(destinos) || !destinos.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🗺️</div>
                    <h3>No hay destinos disponibles</h3>
                    <p>Pronto agregaremos destinos increíbles</p>
                </div>`;
            return;
        }
        container.innerHTML = destinos.slice(0, 6).map(d => renderDestinoCard(d)).join('');
    } catch (err) {
        console.error('Error cargando destinos:', err);
        document.getElementById('home-destinos').innerHTML = '<p class="text-center" style="color:var(--clr-text-dim)">No se pudieron cargar los destinos</p>';
    }
}
function renderDestinoCard(d) {
    const img = getImageUrl(d.imagen_portada, FALLBACK_IMG);
    const catNames = getCategoryNames(d.categorias);
    const firstCat = catNames.length > 0 ? catNames[0] : '';

    return `
    <div class="card fade-in" onclick="navigateTo('destino-detail', ${d.id_destino})">
        <div class="card-img-wrapper">
            <img class="card-img" src="${img}" alt="${d.nombre}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
            ${firstCat ? `<span class="card-badge">${firstCat}</span>` : ''}
        </div>
        <div class="card-body">
            <h3 class="card-title">${d.nombre}</h3>
            <p class="card-desc">${d.descripcion || 'Destino turístico increíble'}</p>
            <div class="card-meta">
                <div class="card-rating">${renderStars(d.calificacion_promedio)} ${d.calificacion_promedio || '--'}</div>
                <span>${d.total_resenas || 0} reseñas</span>
            </div>
            ${catNames.length ? `<div class="card-tags">${catNames.map(c => `<span class="tag">${c}</span>`).join('')}</div>` : ''}
        </div>
    </div>`;
}
// ═════════════════════════════════════════════════
// ── PAGE: Destinos ──
// ═════════════════════════════════════════════════
async function renderDestinos() {
    appContent.innerHTML = `
        <section class="section" style="padding-top:110px;">
            <div class="section-header">
                <h2>Todos los Destinos</h2>
                <p>Explora nuestra colección de destinos turísticos</p>
            </div>
            <div id="destinos-list" class="cards-grid">${showLoading()}</div>
        </section>`;
    try {
        const destinos = await api.getDestinos();
        const container = document.getElementById('destinos-list');
        if (!Array.isArray(destinos) || !destinos.length) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🗺️</div><h3>No hay destinos disponibles</h3></div>';
            return;
        }
        container.innerHTML = destinos.map(d => renderDestinoCard(d)).join('');
    } catch (err) {
        console.error('Error cargando destinos:', err);
        document.getElementById('destinos-list').innerHTML = '<p class="text-center" style="color:var(--clr-text-dim)">Error al cargar destinos</p>';
    }
}
// ═════════════════════════════════════════════════
// ── PAGE: Destino Detail ──
// ═════════════════════════════════════════════════
async function renderDestinoDetail(id) {
    appContent.innerHTML = `<div class="detail-page">${showLoading()}</div>`;
    try {
        const d = await api.getDestino(id);
        if (d.error) { appContent.innerHTML = `<div class="detail-page"><p style="color:var(--clr-danger)">${d.error}</p></div>`; return; }
        const img = getImageUrl(d.imagen_portada, FALLBACK_IMG_LG);
        const catNames = getCategoryNames(d.categorias);
        const atractivos = Array.isArray(d.atractivos) ? d.atractivos : [];
        appContent.innerHTML = `
        <div class="detail-page fade-in">
            <button class="back-btn" onclick="navigateTo('destinos')">← Volver a destinos</button>
            <img class="detail-hero-img" src="${img}" alt="${d.nombre}" onerror="this.onerror=null;this.src='${FALLBACK_IMG_LG}'">
            <div class="detail-header">
                <h1>${d.nombre}</h1>
                <div class="detail-rating">
                    ${renderStars(d.calificacion_promedio)}
                    <span class="rating-number">${d.calificacion_promedio || 'Sin calificación'}</span>
                    <span class="rating-count">(${d.total_resenas || 0} reseñas)</span>
                </div>
                ${catNames.length ? `<div class="card-tags">${catNames.map(c => `<span class="tag">${c}</span>`).join('')}</div>` : ''}
            </div>
            <div class="detail-section">
                <h2>Descripción</h2>
                <p>${d.descripcion || 'Sin descripción disponible.'}</p>
            </div>
            ${d.datos_destino ? `
            <div class="detail-section">
                <h2>Información Práctica</h2>
                <div class="info-grid">
                    ${d.datos_destino.horario ? `<div class="info-item"><div class="info-label">🕐 Horario</div><div class="info-value">${d.datos_destino.horario}</div></div>` : ''}
                    ${d.datos_destino.precio ? `<div class="info-item"><div class="info-label">💰 Precio</div><div class="info-value">${d.datos_destino.precio}</div></div>` : ''}
                    ${d.datos_destino.telefono ? `<div class="info-item"><div class="info-label">📞 Teléfono</div><div class="info-value">${d.datos_destino.telefono}</div></div>` : ''}
                    ${d.datos_destino.direccion ? `<div class="info-item"><div class="info-label">📍 Dirección</div><div class="info-value">${d.datos_destino.direccion}</div></div>` : ''}
                </div>
                ${d.datos_destino.recomendaciones ? `<p class="mt-4" style="color:var(--clr-text-muted)"><strong>Recomendaciones:</strong> ${d.datos_destino.recomendaciones}</p>` : ''}
            </div>` : ''}
            <div class="detail-section">
                <h2>Atractivos (${atractivos.length})</h2>
                ${atractivos.length ? `<div class="cards-grid">${atractivos.map(a => renderAtractivoCard(a)).join('')}</div>` : '<div class="empty-state"><div class="empty-state-icon">🏞️</div><h3>No hay atractivos para este destino</h3></div>'}
            </div>
        </div>`;
    } catch (err) {
        console.error('Error cargando destino:', err);
        appContent.innerHTML = '<div class="detail-page"><p style="color:var(--clr-danger)">Error al cargar destino</p></div>';
    }
}
// Helper: tarjeta de atractivo (reutilizable en destino detail y categoría filter)
function renderAtractivoCard(a) {
    const fotos = Array.isArray(a.fotos) ? a.fotos : [];
    const fotoUrl = fotos.length > 0 ? getImageUrl(fotos[0].url_imagen) : FALLBACK_IMG;
    return `
    <div class="card fade-in" onclick="navigateTo('atractivo-detail', ${a.id_atractivo})">
        <div class="card-img-wrapper">
            <img class="card-img" src="${fotoUrl}" alt="${a.nombre}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
        </div>
        <div class="card-body">
            <h3 class="card-title">${a.nombre}</h3>
            <p class="card-desc">${a.descripcion_corta || ''}</p>
            <div class="card-meta">
                <div class="card-rating">${renderStars(a.calificacion_promedio)} ${a.calificacion_promedio || '--'}</div>
                ${a.categoria_nombre ? `<span class="tag">${a.categoria_nombre}</span>` : ''}
            </div>
            ${a.ubicacion ? `<p style="font-size:0.8rem;color:var(--clr-text-dim);margin-top:8px;">📍 ${a.ubicacion.latitud}, ${a.ubicacion.longitud}</p>` : ''}
        </div>
    </div>`;
}
// ═════════════════════════════════════════════════
// ── PAGE: Atractivo Detail ──
// ═════════════════════════════════════════════════
async function renderAtractivoDetail(id) {
    appContent.innerHTML = `<div class="detail-page">${showLoading()}</div>`;
    try {
        const a = await api.getAtractivo(id);
        if (a.error) { appContent.innerHTML = `<div class="detail-page"><p style="color:var(--clr-danger)">${a.error}</p></div>`; return; }
        const fotos = Array.isArray(a.fotos) ? a.fotos : [];
        const heroImg = fotos.length > 0 ? getImageUrl(fotos[0].url_imagen) : null;
        appContent.innerHTML = `
        <div class="detail-page fade-in">
            <button class="back-btn" onclick="navigateTo(${a.id_destino ? `'destino-detail', ${a.id_destino}` : `'destinos'`})">← Volver</button>
            ${heroImg ? `<img class="detail-hero-img" src="${heroImg}" alt="${a.nombre}" onerror="this.onerror=null;this.src='${FALLBACK_IMG_LG}'">` : ''}
            <div class="detail-header">
                <h1>${a.nombre}</h1>
                <div class="detail-rating">
                    ${renderStars(a.calificacion_promedio)}
                    <span class="rating-number">${a.calificacion_promedio || 'Sin calificación'}</span>
                    <span class="rating-count">(${a.total_resenas || 0} reseñas)</span>
                </div>
                ${a.destino_nombre ? `<p style="color:var(--clr-text-muted)">📍 ${a.destino_nombre}</p>` : ''}
                ${a.categoria_nombre ? `<span class="tag mt-4">${a.categoria_nombre}</span>` : ''}
            </div>
            <div class="detail-section">
                <h2>Descripción</h2>
                <p>${a.descripcion_detallada || a.descripcion_corta || 'Sin descripción.'}</p>
            </div>
            ${a.ubicacion ? `
            <div class="detail-section">
                <h2>Ubicación</h2>
                <div class="info-grid">
                    <div class="info-item"><div class="info-label">Latitud</div><div class="info-value">${a.ubicacion.latitud}</div></div>
                    <div class="info-item"><div class="info-label">Longitud</div><div class="info-value">${a.ubicacion.longitud}</div></div>
                </div>
            </div>` : ''}
            ${fotos.length > 1 ? `
            <div class="detail-section">
                <h2>Galería</h2>
                <div class="cards-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
                    ${fotos.map(f => `<img src="${getImageUrl(f.url_imagen)}" alt="${f.descripcion_imagen || ''}" style="border-radius:var(--radius-md);height:180px;object-fit:cover;width:100%;" onerror="this.onerror=null;this.src='${FALLBACK_IMG}'" loading="lazy">`).join('')}
                </div>
            </div>` : ''}
            <div class="detail-section">
                <h2>Reseñas</h2>
                ${api.isLoggedIn() ? `
                <div class="review-card mb-4" style="border-color:var(--clr-primary-glow);">
                    <h3 style="font-size:1rem;margin-bottom:12px;">Escribe una reseña</h3>
                    <div class="form-group">
                        <label class="form-label">Calificación</label>
                        <select class="form-select" id="resena-calificacion">
                            <option value="5">⭐⭐⭐⭐⭐ Excelente</option>
                            <option value="4">⭐⭐⭐⭐ Muy bueno</option>
                            <option value="3">⭐⭐⭐ Bueno</option>
                            <option value="2">⭐⭐ Regular</option>
                            <option value="1">⭐ Malo</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <textarea class="form-textarea" id="resena-comentario" placeholder="Comparte tu experiencia..."></textarea>
                    </div>
                    <button class="btn btn-primary" onclick="submitResena(${a.id_atractivo})">Publicar Reseña</button>
                </div>` : '<p class="mb-4" style="color:var(--clr-text-dim);"><a href="#" data-page="login">Inicia sesión</a> para dejar una reseña.</p>'}
                <div id="resenas-list">
                    ${Array.isArray(a.resenas) && a.resenas.length ? a.resenas.map(r => renderReviewCard(r)).join('') : '<div class="empty-state"><div class="empty-state-icon">💬</div><h3>Aún no hay reseñas</h3><p>Sé el primero en compartir tu experiencia</p></div>'}
                </div>
            </div>
        </div>`;
    } catch (err) {
        console.error('Error cargando atractivo:', err);
        appContent.innerHTML = '<div class="detail-page"><p style="color:var(--clr-danger)">Error al cargar atractivo</p></div>';
    }
}
function renderReviewCard(r) {
    const canDelete = api.isAdmin() || api.usuario?.id_usuario === r.id_usuario;
    return `
    <div class="review-card fade-in">
        <div class="review-header">
            <div class="review-user">
                <div class="review-avatar">${(r.nombre_usuario || 'U').charAt(0).toUpperCase()}</div>
                <div>
                    <div class="review-name">${r.nombre_usuario || 'Anónimo'}</div>
                    <div class="review-date">${formatDate(r.fecha)}</div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span class="review-stars">${'★'.repeat(r.calificacion)}${'☆'.repeat(5 - r.calificacion)}</span>
                ${canDelete ? `<button class="btn btn-ghost btn-sm" onclick="deleteResenaAction(${r.id_resena}, ${r.id_atractivo})" title="Eliminar">🗑️</button>` : ''}
            </div>
        </div>
        ${r.comentario ? `<p class="review-text">${r.comentario}</p>` : ''}
    </div>`;
}
async function submitResena(id_atractivo) {
    const calificacion = parseInt(document.getElementById('resena-calificacion').value);
    const comentario = document.getElementById('resena-comentario').value;
    try {
        const result = await api.createResena({ id_atractivo, calificacion, comentario });
        if (result.error) {
            showToast(result.error, 'error');
        } else {
            showToast('Reseña publicada', 'success');
            renderAtractivoDetail(id_atractivo);
        }
    } catch (err) {
        showToast('Error al publicar reseña', 'error');
    }
}
async function deleteResenaAction(id_resena, id_atractivo) {
    if (!confirm('¿Eliminar esta reseña?')) return;
    try {
        await api.deleteResena(id_resena);
        showToast('Reseña eliminada', 'success');
        renderAtractivoDetail(id_atractivo);
    } catch (err) {
        showToast('Error al eliminar', 'error');
    }
}
// ═════════════════════════════════════════════════
// ── PAGE: Categorías ──
// ═════════════════════════════════════════════════
async function renderCategorias() {
    appContent.innerHTML = `
        <section class="section" style="padding-top:110px;">
            <div class="section-header">
                <h2>Categorías</h2>
                <p>Explora destinos por tipo de experiencia</p>
            </div>
            <div id="categorias-list" class="categories-grid">${showLoading()}</div>
        </section>`;

    try {
        const categorias = await api.getCategorias();
        const icons = { 'Playas': '🏖️', 'Aventura': '🧗', 'Cultura': '🏛️', 'Naturaleza': '🌿' };
        const container = document.getElementById('categorias-list');
        if (!Array.isArray(categorias) || !categorias.length) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📂</div><h3>No hay categorías</h3></div>';
            return;
        }
        container.innerHTML = categorias.map(c => `
            <div class="category-card fade-in" onclick="filterByCategory(${c.id_categoria}, '${c.nombre}')">
                <div class="category-icon">${icons[c.nombre] || '📍'}</div>
                <h3>${c.nombre}</h3>
                <p>${c.descripcion || 'Descubre destinos de esta categoría'}</p>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error cargando categorías:', err);
        document.getElementById('categorias-list').innerHTML = '<p class="text-center" style="color:var(--clr-text-dim)">Error al cargar categorías</p>';
    }
}
async function filterByCategory(id_categoria, nombre) {
    appContent.innerHTML = `
        <section class="section" style="padding-top:110px;">
            <div class="section-header">
                <button class="back-btn" onclick="navigateTo('categorias')">← Volver a categorías</button>
                <h2>${nombre}</h2>
                <p>Atractivos de esta categoría</p>
            </div>
            <div id="filtered-atractivos" class="cards-grid">${showLoading()}</div>
        </section>`;

    try {
        const atractivos = await api.getAtractivos({ id_categoria });
        const container = document.getElementById('filtered-atractivos');
        if (!Array.isArray(atractivos) || !atractivos.length) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><h3>No hay atractivos en esta categoría</h3></div>';
            return;
        }
        container.innerHTML = atractivos.map(a => `
            <div class="card fade-in" onclick="navigateTo('atractivo-detail', ${a.id_atractivo})">
                <div class="card-body">
                    <h3 class="card-title">${a.nombre}</h3>
                    <p class="card-desc">${a.descripcion_corta || ''}</p>
                    <div class="card-meta">
                        ${a.destino_nombre ? `<span>📍 ${a.destino_nombre}</span>` : ''}
                        ${a.categoria_nombre ? `<span class="tag">${a.categoria_nombre}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error filtrando atractivos:', err);
        document.getElementById('filtered-atractivos').innerHTML = '<p class="text-center" style="color:var(--clr-text-dim)">Error al cargar atractivos</p>';
    }
}
// ═════════════════════════════════════════════════
// ── PAGE: Login ──
// ═════════════════════════════════════════════════
function renderLogin() {
    appContent.innerHTML = `
    <div class="form-page">
        <div class="form-container">
            <div class="form-card fade-in">
                <h1>Bienvenido de vuelta</h1>
                <p class="form-subtitle">Inicia sesión para acceder a tu cuenta</p>
                <form id="login-form">
                    <div class="form-group">
                        <label class="form-label">Correo electrónico</label>
                        <input type="email" class="form-input" id="login-correo" placeholder="tu@correo.com" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Contraseña</label>
                        <input type="password" class="form-input" id="login-pass" placeholder="••••••••" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary btn-lg">Iniciar Sesión</button>
                    </div>
                </form>
                <div class="form-footer">
                    ¿No tienes cuenta? <a href="#" data-page="register">Regístrate</a>
                </div>
            </div>
        </div>
    </div>`;
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const correo = document.getElementById('login-correo').value;
        const contrasena = document.getElementById('login-pass').value;
        try {
            const result = await api.login(correo, contrasena);
            if (result.error) {
                showToast(result.error, 'error');
            } else {
                updateAuthUI();
                showToast(`¡Hola, ${result.usuario.nombre}!`, 'success');
                navigateTo('home');
            }
        } catch (err) {
            showToast('Error de conexión', 'error');
        }
    });
}
// ═════════════════════════════════════════════════
// ── PAGE: Register ──
// ═════════════════════════════════════════════════
function renderRegister() {
    appContent.innerHTML = `
    <div class="form-page">
        <div class="form-container">
            <div class="form-card fade-in">
                <h1>Crear cuenta</h1>
                <p class="form-subtitle">Únete a nuestra comunidad de viajeros</p>
                <form id="register-form">
                    <div class="form-group">
                        <label class="form-label">Nombre completo</label>
                        <input type="text" class="form-input" id="reg-nombre" placeholder="Tu nombre" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Correo electrónico</label>
                        <input type="email" class="form-input" id="reg-correo" placeholder="tu@correo.com" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Contraseña</label>
                        <input type="password" class="form-input" id="reg-pass" placeholder="Mínimo 6 caracteres" required minlength="6">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary btn-lg">Crear Cuenta</button>
                    </div>
                </form>
                <div class="form-footer">
                    ¿Ya tienes cuenta? <a href="#" data-page="login">Inicia sesión</a>
                </div>
            </div>
        </div>
    </div>`;
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('reg-nombre').value;
        const correo = document.getElementById('reg-correo').value;
        const contrasena = document.getElementById('reg-pass').value;
        try {
            const result = await api.register(nombre, correo, contrasena);
            if (result.error) {
                showToast(result.error, 'error');
            } else {
                showToast('Cuenta creada. Iniciando sesión...', 'success');
                const loginResult = await api.login(correo, contrasena);
                if (loginResult.token) {
                    updateAuthUI();
                    navigateTo('home');
                } else {
                    navigateTo('login');
                }
            }
        } catch (err) {
            showToast('Error de conexión', 'error');
        }
    });
}
// ═════════════════════════════════════════════════
// ── PAGE: Perfil ──
// ═════════════════════════════════════════════════
async function renderPerfil() {
    if (!api.isLoggedIn()) { navigateTo('login'); return; }
    appContent.innerHTML = `<div class="profile-page">${showLoading()}</div>`;
    try {
        const perfil = await api.getPerfil();
        appContent.innerHTML = `
        <div class="profile-page fade-in">
            <div class="profile-card">
                <div class="profile-avatar-lg">${perfil.nombre?.charAt(0).toUpperCase() || 'U'}</div>
                <h1>${perfil.nombre}</h1>
                <p class="profile-email">${perfil.correo}</p>
                <span class="tag">${perfil.rol === 'admin' ? '👑 Administrador' : '👤 Usuario'}</span>
                <div class="profile-stats">
                    <div class="stat-item">
                        <div class="stat-value">${perfil.total_resenas || 0}</div>
                        <div class="stat-label">Reseñas</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${formatDate(perfil.fecha_registro)}</div>
                        <div class="stat-label">Miembro desde</div>
                    </div>
                </div>
            </div>
        </div>`;
    } catch (err) {
        appContent.innerHTML = '<div class="profile-page"><p style="color:var(--clr-danger)">Error al cargar perfil</p></div>';
    }
}
// ═════════════════════════════════════════════════
// ── PAGE: Admin Panel ──
// ═════════════════════════════════════════════════
async function renderAdmin() {
    if (!api.isAdmin()) { navigateTo('home'); showToast('Acceso denegado', 'error'); return; }
    appContent.innerHTML = `
    <div class="admin-page fade-in">
        <div class="admin-header">
            <h1>⚙️ Panel de Administración</h1>
        </div>
        <div class="admin-tabs">
            <button class="admin-tab ${adminTab === 'destinos' ? 'active' : ''}" onclick="switchAdminTab('destinos')">Destinos</button>
            <button class="admin-tab ${adminTab === 'categorias' ? 'active' : ''}" onclick="switchAdminTab('categorias')">Categorías</button>
            <button class="admin-tab ${adminTab === 'atractivos' ? 'active' : ''}" onclick="switchAdminTab('atractivos')">Atractivos</button>
            <button class="admin-tab ${adminTab === 'usuarios' ? 'active' : ''}" onclick="switchAdminTab('usuarios')">Usuarios</button>
        </div>
        <div id="admin-content">${showLoading()}</div>
    </div>`;
    loadAdminTab();
}
function switchAdminTab(tab) {
    adminTab = tab;
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.textContent.toLowerCase().includes(tab)));
    document.getElementById('admin-content').innerHTML = showLoading();
    loadAdminTab();
}
async function loadAdminTab() {
    const container = document.getElementById('admin-content');
    try {
        switch (adminTab) {
            case 'destinos': await loadAdminDestinos(container); break;
            case 'categorias': await loadAdminCategorias(container); break;
            case 'atractivos': await loadAdminAtractivos(container); break;
            case 'usuarios': await loadAdminUsuarios(container); break;
        }
    } catch (err) {
        console.error('Error en admin tab:', err);
        container.innerHTML = '<p style="color:var(--clr-danger)">Error al cargar datos</p>';
    }
}
// ── Admin: Destinos ──
async function loadAdminDestinos(container) {
    const destinos = await api.getDestinos();
    const rows = Array.isArray(destinos) ? destinos : [];
    container.innerHTML = `
        <div style="margin-bottom:16px;text-align:right;">
            <button class="btn btn-primary" onclick="openDestinoModal()">+ Nuevo Destino</button>
        </div>
        ${rows.length ? `<div class="admin-table-container">
            <table class="admin-table">
                <thead><tr><th>ID</th><th>Nombre</th><th>Categorías</th><th>Atractivos</th><th>Rating</th><th>Acciones</th></tr></thead>
                <tbody>
                    ${rows.map(d => `
                    <tr>
                        <td>${d.id_destino}</td>
                        <td><strong>${d.nombre}</strong></td>
                        <td>${getCategoryNames(d.categorias).join(', ') || '-'}</td>
                        <td>${d.total_atractivos || 0}</td>
                        <td>${d.calificacion_promedio || '-'}</td>
                        <td class="table-actions">
                            <button class="btn btn-ghost btn-sm" onclick="openDestinoModal(${d.id_destino})">✏️ Editar</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteDestinoAction(${d.id_destino})">🗑️</button>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>` : '<div class="empty-state"><h3>No hay destinos</h3></div>'}`;
}
// ── Admin: Categorías ──
async function loadAdminCategorias(container) {
    const categorias = await api.getCategorias();
    const rows = Array.isArray(categorias) ? categorias : [];
    container.innerHTML = `
        <div style="margin-bottom:16px;text-align:right;">
            <button class="btn btn-primary" onclick="openCategoriaModal()">+ Nueva Categoría</button>
        </div>
        ${rows.length ? `<div class="admin-table-container">
            <table class="admin-table">
                <thead><tr><th>ID</th><th>Nombre</th><th>Descripción</th><th>Acciones</th></tr></thead>
                <tbody>
                    ${rows.map(c => `
                    <tr>
                        <td>${c.id_categoria}</td>
                        <td><strong>${c.nombre}</strong></td>
                        <td>${c.descripcion || '-'}</td>
                        <td class="table-actions">
                            <button class="btn btn-ghost btn-sm" onclick="openCategoriaModal(${c.id_categoria}, '${(c.nombre || '').replace(/'/g, "\\'")}', '${(c.descripcion || '').replace(/'/g, "\\'").replace(/\n/g, ' ')}')">✏️ Editar</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteCategoriaAction(${c.id_categoria})">🗑️</button>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>` : '<div class="empty-state"><h3>No hay categorías</h3></div>'}`;
}
// ── Admin: Atractivos ──
async function loadAdminAtractivos(container) {
    const atractivos = await api.getAtractivos();
    const rows = Array.isArray(atractivos) ? atractivos : [];
    container.innerHTML = `
        <div style="margin-bottom:16px;text-align:right;">
            <button class="btn btn-primary" onclick="openAtractivoModal()">+ Nuevo Atractivo</button>
        </div>
        ${rows.length ? `<div class="admin-table-container">
            <table class="admin-table">
                <thead><tr><th>ID</th><th>Nombre</th><th>Destino</th><th>Categoría</th><th>Acciones</th></tr></thead>
                <tbody>
                    ${rows.map(a => `
                    <tr>
                        <td>${a.id_atractivo}</td>
                        <td><strong>${a.nombre}</strong></td>
                        <td>${a.destino_nombre || '-'}</td>
                        <td>${a.categoria_nombre || '-'}</td>
                        <td class="table-actions">
                            <button class="btn btn-ghost btn-sm" onclick="openAtractivoModal(${a.id_atractivo})">✏️ Editar</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteAtractivoAction(${a.id_atractivo})">🗑️</button>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>` : '<div class="empty-state"><h3>No hay atractivos</h3></div>'}`;
}
// ── Admin: Usuarios ──
async function loadAdminUsuarios(container) {
    const usuarios = await api.getUsuarios();
    const rows = Array.isArray(usuarios) ? usuarios : [];
    container.innerHTML = `
        ${rows.length ? `<div class="admin-table-container">
            <table class="admin-table">
                <thead><tr><th>ID</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Registro</th><th>Acciones</th></tr></thead>
                <tbody>
                    ${rows.map(u => `
                    <tr>
                        <td>${u.id_usuario}</td>
                        <td><strong>${u.nombre}</strong></td>
                        <td>${u.correo}</td>
                        <td><span class="tag">${u.rol}</span></td>
                        <td>${formatDate(u.fecha_registro)}</td>
                        <td>
                            ${u.id_usuario !== api.usuario?.id_usuario ? `<button class="btn btn-danger btn-sm" onclick="deleteUsuarioAction(${u.id_usuario})">🗑️</button>` : '<span style="color:var(--clr-text-dim)">Tú</span>'}
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>` : '<div class="empty-state"><h3>No hay usuarios</h3></div>'}`;
}
// ── Modal Helpers ──
function showModal(html) {
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal">${html}</div>`;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('show'), 10);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}
function closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 300);
    }
}
// ── Categoría Modal ──
function openCategoriaModal(id = null, nombre = '', descripcion = '') {
    const isEdit = id !== null;
    showModal(`
        <div class="modal-header">
            <h2>${isEdit ? 'Editar' : 'Nueva'} Categoría</h2>
            <button class="modal-close" onclick="closeModal()">✕</button>
        </div>
        <form id="categoria-form">
            <div class="form-group">
                <label class="form-label">Nombre</label>
                <input type="text" class="form-input" id="cat-nombre" value="${nombre}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Descripción</label>
                <textarea class="form-textarea" id="cat-descripcion">${descripcion}</textarea>
            </div>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Actualizar' : 'Crear'}</button>
        </form>
    `);
    document.getElementById('categoria-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            nombre: document.getElementById('cat-nombre').value,
            descripcion: document.getElementById('cat-descripcion').value
        };
        try {
            const result = isEdit ? await api.updateCategoria(id, data) : await api.createCategoria(data);
            if (result.error) { showToast(result.error, 'error'); return; }
            showToast(`Categoría ${isEdit ? 'actualizada' : 'creada'}`, 'success');
            closeModal();
            loadAdminTab();
        } catch (err) { showToast('Error', 'error'); }
    });
}
// ── Destino Modal ──
async function openDestinoModal(id = null) {
    const categorias = await api.getCategorias();
    let destino = null;
    if (id) {
        destino = await api.getDestino(id);
    }
    const selectedCats = (destino?.categorias || []).map(c => c.id_categoria);
    const catList = Array.isArray(categorias) ? categorias : [];
    showModal(`
        <div class="modal-header">
            <h2>${id ? 'Editar' : 'Nuevo'} Destino</h2>
            <button class="modal-close" onclick="closeModal()">✕</button>
        </div>
        <form id="destino-form">
            <div class="form-group">
                <label class="form-label">Nombre</label>
                <input type="text" class="form-input" id="dest-nombre" value="${destino?.nombre || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Descripción</label>
                <textarea class="form-textarea" id="dest-descripcion">${destino?.descripcion || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">URL imagen portada</label>
                <input type="text" class="form-input" id="dest-imagen" value="${destino?.imagen_portada || ''}" placeholder="https://...">
            </div>
            <div class="form-group">
                <label class="form-label">Categorías</label>
                <div class="checkbox-group">
                    ${catList.map(c => `
                        <label class="checkbox-label">
                            <input type="checkbox" name="dest-cats" value="${c.id_categoria}" ${selectedCats.includes(c.id_categoria) ? 'checked' : ''}>
                            ${c.nombre}
                        </label>
                    `).join('')}
                </div>
            </div>
            <hr style="border-color:var(--clr-border);margin:16px 0;">
            <p style="font-weight:600;margin-bottom:12px;font-size:0.9rem;">Información Práctica (opcional)</p>
            <div class="form-group">
                <label class="form-label">Horario</label>
                <input type="text" class="form-input" id="dest-horario" value="${destino?.datos_destino?.horario || ''}" placeholder="9:00 AM - 6:00 PM">
            </div>
            <div class="form-group">
                <label class="form-label">Precio</label>
                <input type="text" class="form-input" id="dest-precio" value="${destino?.datos_destino?.precio || ''}" placeholder="Gratuito / $100 MXN">
            </div>
            <div class="form-group">
                <label class="form-label">Teléfono</label>
                <input type="text" class="form-input" id="dest-telefono" value="${destino?.datos_destino?.telefono || ''}" placeholder="+52 ...">
            </div>
            <div class="form-group">
                <label class="form-label">Dirección</label>
                <input type="text" class="form-input" id="dest-direccion" value="${destino?.datos_destino?.direccion || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Recomendaciones</label>
                <textarea class="form-textarea" id="dest-recomendaciones">${destino?.datos_destino?.recomendaciones || ''}</textarea>
            </div>
            <button type="submit" class="btn btn-primary">${id ? 'Actualizar' : 'Crear'} Destino</button>
        </form>
    `);
    document.getElementById('destino-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const cats = Array.from(document.querySelectorAll('input[name="dest-cats"]:checked')).map(cb => parseInt(cb.value));
        const data = {
            nombre: document.getElementById('dest-nombre').value,
            descripcion: document.getElementById('dest-descripcion').value,
            imagen_portada: document.getElementById('dest-imagen').value,
            categorias: cats,
            datos_destino: {
                horario: document.getElementById('dest-horario').value,
                precio: document.getElementById('dest-precio').value,
                telefono: document.getElementById('dest-telefono').value,
                direccion: document.getElementById('dest-direccion').value,
                recomendaciones: document.getElementById('dest-recomendaciones').value
            }
        };
        if (id) data.activo = true;
        try {
            const result = id ? await api.updateDestino(id, data) : await api.createDestino(data);
            if (result.error) { showToast(result.error, 'error'); return; }
            showToast(`Destino ${id ? 'actualizado' : 'creado'}`, 'success');
            closeModal();
            loadAdminTab();
        } catch (err) { showToast('Error', 'error'); }
    });
}
// ── Atractivo Modal ──
async function openAtractivoModal(id = null) {
    const [destinos, categorias] = await Promise.all([api.getDestinos(), api.getCategorias()]);
    let atractivo = null;
    if (id) atractivo = await api.getAtractivo(id);
    const destList = Array.isArray(destinos) ? destinos : [];
    const catList = Array.isArray(categorias) ? categorias : [];
    showModal(`
        <div class="modal-header">
            <h2>${id ? 'Editar' : 'Nuevo'} Atractivo</h2>
            <button class="modal-close" onclick="closeModal()">✕</button>
        </div>
        <form id="atractivo-form">
            <div class="form-group">
                <label class="form-label">Nombre</label>
                <input type="text" class="form-input" id="at-nombre" value="${atractivo?.nombre || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Descripción corta</label>
                <input type="text" class="form-input" id="at-desc-corta" value="${atractivo?.descripcion_corta || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Descripción detallada</label>
                <textarea class="form-textarea" id="at-desc-larga">${atractivo?.descripcion_detallada || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Destino</label>
                <select class="form-select" id="at-destino">
                    <option value="">Sin destino</option>
                    ${destList.map(d => `<option value="${d.id_destino}" ${atractivo?.id_destino == d.id_destino ? 'selected' : ''}>${d.nombre}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Categoría</label>
                <select class="form-select" id="at-categoria">
                    <option value="">Sin categoría</option>
                    ${catList.map(c => `<option value="${c.id_categoria}" ${atractivo?.id_categoria == c.id_categoria ? 'selected' : ''}>${c.nombre}</option>`).join('')}
                </select>
            </div>
            <button type="submit" class="btn btn-primary">${id ? 'Actualizar' : 'Crear'} Atractivo</button>
        </form>
    `);
    document.getElementById('atractivo-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            nombre: document.getElementById('at-nombre').value,
            descripcion_corta: document.getElementById('at-desc-corta').value,
            descripcion_detallada: document.getElementById('at-desc-larga').value,
            id_destino: document.getElementById('at-destino').value || null,
            id_categoria: document.getElementById('at-categoria').value || null
        };
        if (id) data.activo = true;
        try {
            const result = id ? await api.updateAtractivo(id, data) : await api.createAtractivo(data);
            if (result.error) { showToast(result.error, 'error'); return; }
            showToast(`Atractivo ${id ? 'actualizado' : 'creado'}`, 'success');
            closeModal();
            loadAdminTab();
        } catch (err) { showToast('Error', 'error'); }
    });
}
// ── Delete Actions ──
async function deleteDestinoAction(id) {
    if (!confirm('¿Eliminar este destino? Se eliminarán también sus datos asociados.')) return;
    try {
        await api.deleteDestino(id);
        showToast('Destino eliminado', 'success');
        loadAdminTab();
    } catch (err) { showToast('Error', 'error'); }
}
async function deleteCategoriaAction(id) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    try {
        await api.deleteCategoria(id);
        showToast('Categoría eliminada', 'success');
        loadAdminTab();
    } catch (err) { showToast('Error', 'error'); }
}
async function deleteAtractivoAction(id) {
    if (!confirm('¿Eliminar este atractivo?')) return;
    try {
        await api.deleteAtractivo(id);
        showToast('Atractivo eliminado', 'success');
        loadAdminTab();
    } catch (err) { showToast('Error', 'error'); }
}
async function deleteUsuarioAction(id) {
    if (!confirm('¿Eliminar este usuario? Se eliminarán sus reseñas.')) return;
    try {
        await api.deleteUsuario(id);
        showToast('Usuario eliminado', 'success');
        loadAdminTab();
    } catch (err) { showToast('Error', 'error'); }
}
