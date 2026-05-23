import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api', // URL de base de ton API Laravel
});

// Intercepteur pour injecter automatiquement le Token et analyser les requêtes
api.interceptors.request.use(
    (config) => {
        // 🔍 Tentative de récupération du token sous toutes ses formes possibles
        const token = localStorage.getItem('token') || 
                      localStorage.getItem('access_token') || 
                      localStorage.getItem('user_token');
        
        // 🌐 Forcer Laravel à comprendre qu'on attend uniquement du JSON
        config.headers['Accept'] = 'application/json';
        config.headers['Content-Type'] = 'application/json';
        
        // 📊 Affichage d'un diagnostic clair dans la console du navigateur
        if (token) {
            console.log(`%c🔑 [Axios] Jeton trouvé ! Injection dans l'en-tête pour : ${config.url}`, 'color: #00ff00; font-weight: bold;');
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            console.warn(`%c❌ [Axios] ATTENTION : Aucun jeton (token) trouvé dans le LocalStorage pour la requête : ${config.url}`, 'color: #ff9900; font-weight: bold;');
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;