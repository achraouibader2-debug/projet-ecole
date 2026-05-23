import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api'; // Importe ton instance Axios configurée avec l'intercepteur

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 🚀 Envoi des identifiants au backend Laravel via notre instance centrale
            const response = await api.post('/login', { email, password });
            
            // 🔑 Sécurité : On récupère le token. On teste 'access_token' ou à défaut 'token'
            const token = response.data.access_token || response.data.token;
            
            if (!token) {
                throw new Error("Le serveur n'a renvoyé aucun token d'authentification.");
            }

            // 💾 Stockage local propre pour que l'intercepteur d'api.js puisse l'attraper
            localStorage.setItem('token', token);
            localStorage.setItem('user_role', response.data.user.role);
            localStorage.setItem('user_name', response.data.user.name);

            // 🗺️ Redirection dynamique selon le rôle de l'utilisateur
            const role = response.data.user.role;
            if (role === 'admin') {
                navigate('/admin');
            } else if (role === 'professeur' || role === 'teacher') {
                navigate('/prof'); // Assure-toi que cette route correspond bien à ton TeacherDashboard dans App.jsx
            } else {
                navigate('/student');
            }

        } catch (err) {
            console.error("Erreur d'authentification :", err);
            setError(err.response?.data?.message || 'Identifiants incorrects ou serveur indisponible.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-[#0b0f19] overflow-hidden">
            {/* Orbes de lumière en arrière-plan */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse delay-1000"></div>

            {/* Carte Glassmorphism */}
            <div className="relative w-full max-w-md p-8 mx-4 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl transition-all duration-300 hover:border-slate-700">
                
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/30 mb-4">
                        <span className="text-2xl font-bold text-white">E</span>
                    </div>
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                        Portail ENSA SGE
                    </h2>
                    <p className="text-sm text-slate-400 mt-2">Connectez-vous à votre espace universitaire</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            Adresse Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nom@ensa.ma"
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="relative w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all duration-150 flex items-center justify-center disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            'Se connecter'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}