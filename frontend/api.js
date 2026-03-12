// api.js — Módulo centralizado para llamadas a la API
const API_BASE = 'http://localhost:5000/api';
class ApiService {
    constructor() {
        this.token = localStorage.getItem('token');
        this.usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    }
    getHeaders(withAuth = false) {
        const headers = { 'Content-Type': 'application/json' };
        if (withAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }
    setAuth(token, usuario) {
        this.token = token;
        this.usuario = usuario;
        localStorage.setItem('token', token);
        localStorage.setItem('usuario', JSON.stringify(usuario));
    }
    clearAuth() {
        this.token = null;
        this.usuario = null;
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
    }
    isLoggedIn() {
        return !!this.token;
    }
    isAdmin() {
        return this.usuario?.rol === 'admin';
    }
    // ── Auth ──
    async register(nombre, correo, contrasena) {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ nombre, correo, contrasena })
        });
        return res.json();
    }
    async login(correo, contrasena) {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ correo, contrasena })
        });
        const data = await res.json();
        if (data.token) {
            this.setAuth(data.token, data.usuario);
        }
        return data;
    }
    // ── Destinos ──
    async getDestinos() {
        const res = await fetch(`${API_BASE}/destinos`);
        return res.json();
    }
    async getDestino(id) {
        const res = await fetch(`${API_BASE}/destinos/${id}`);
        return res.json();
    }
    async createDestino(data) {
        const res = await fetch(`${API_BASE}/destinos`, {
            method: 'POST',
            headers: this.getHeaders(true),
            body: JSON.stringify(data)
        });
        return res.json();
    }
    async updateDestino(id, data) {
        const res = await fetch(`${API_BASE}/destinos/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(true),
            body: JSON.stringify(data)
        });
        return res.json();
    }
    async deleteDestino(id) {
        const res = await fetch(`${API_BASE}/destinos/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(true)
        });
        return res.json();
    }
    // ── Categorías ──
    async getCategorias() {
        const res = await fetch(`${API_BASE}/categorias`);
        return res.json();
    }
    async createCategoria(data) {
        const res = await fetch(`${API_BASE}/categorias`, {
            method: 'POST',
            headers: this.getHeaders(true),
            body: JSON.stringify(data)
        });
        return res.json();
    }
    async updateCategoria(id, data) {
        const res = await fetch(`${API_BASE}/categorias/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(true),
            body: JSON.stringify(data)
        });
        return res.json();
    }
    async deleteCategoria(id) {
        const res = await fetch(`${API_BASE}/categorias/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(true)
        });
        return res.json();
    }
    // ── Atractivos ──
    async getAtractivos(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        const res = await fetch(`${API_BASE}/atractivos${params ? '?' + params : ''}`);
        return res.json();
    }
    async getAtractivo(id) {
        const res = await fetch(`${API_BASE}/atractivos/${id}`);
        return res.json();
    }
    async createAtractivo(data) {
        const res = await fetch(`${API_BASE}/atractivos`, {
            method: 'POST',
            headers: this.getHeaders(true),
            body: JSON.stringify(data)
        });
        return res.json();
    }
    async updateAtractivo(id, data) {
        const res = await fetch(`${API_BASE}/atractivos/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(true),
            body: JSON.stringify(data)
        });
        return res.json();
    }
    async deleteAtractivo(id) {
        const res = await fetch(`${API_BASE}/atractivos/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(true)
        });
        return res.json();
    }
    // ── Reseñas ──
    async getResenas(id_atractivo) {
        const res = await fetch(`${API_BASE}/resenas/atractivo/${id_atractivo}`);
        return res.json();
    }
    async createResena(data) {
        const res = await fetch(`${API_BASE}/resenas`, {
            method: 'POST',
            headers: this.getHeaders(true),
            body: JSON.stringify(data)
        });
        return res.json();
    }
    async deleteResena(id) {
        const res = await fetch(`${API_BASE}/resenas/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(true)
        });
        return res.json();
    }
    // ── Usuarios ──
    async getPerfil() {
        const res = await fetch(`${API_BASE}/usuarios/perfil`, {
            headers: this.getHeaders(true)
        });
        return res.json();
    }
    async getUsuarios() {
        const res = await fetch(`${API_BASE}/usuarios`, {
            headers: this.getHeaders(true)
        });
        return res.json();
    }
    async deleteUsuario(id) {
        const res = await fetch(`${API_BASE}/usuarios/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(true)
        });
        return res.json();
    }
    // ── Health ──
    async health() {
        const res = await fetch(`${API_BASE}/health`);
        return res.json();
    }
}
const api = new ApiService();
