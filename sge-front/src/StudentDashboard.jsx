import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dashboardData, setDashboardData] = useState({ grades: [], absences: [] });
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [messageSuccess, setMessageSuccess] = useState('');

    // URL de ton API Laravel (Ajuste le port si nécessaire, ex: 8000)
    const API_URL = 'http://127.0.0.1:8000/api/student';
    const token = localStorage.getItem('token'); 
    const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

    // Charger les données en fonction de l'onglet actif
    useEffect(() => {
        if (activeTab === 'dashboard') fetchDashboardData();
        if (activeTab === 'messages') fetchTeachers();
        if (activeTab === 'documents') fetchDocuments();
    }, [activeTab]);

    // Charger et rafraîchir la discussion avec un prof toutes les 5 secondes
    useEffect(() => {
        if (selectedTeacher) {
            fetchMessages(selectedTeacher.id);
            const interval = setInterval(() => fetchMessages(selectedTeacher.id), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedTeacher]);

    // --- REQUÊTES AXIOS ---
    const fetchDashboardData = async () => {
        try {
            const res = await axios.get(`${API_URL}/dashboard`, axiosConfig);
            if (res.data.status === 'success') setDashboardData(res.data.data);
        } catch (err) { console.error("Erreur chargement dashboard", err); }
    };

    const fetchTeachers = async () => {
        try {
            const res = await axios.get(`${API_URL}/teachers`, axiosConfig);
            if (res.data.status === 'success') setTeachers(res.data.teachers);
        } catch (err) { console.error("Erreur chargement enseignants", err); }
    };

    const fetchMessages = async (teacherId) => {
        try {
            const res = await axios.get(`${API_URL}/messages/${teacherId}`, axiosConfig);
            if (res.data.status === 'success') setMessages(res.data.messages);
        } catch (err) { console.error("Erreur chargement messages", err); }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedTeacher) return;
        try {
            const res = await axios.post(`${API_URL}/messages`, {
                destinataire_id: selectedTeacher.id,
                contenu: newMessage
            }, axiosConfig);
            if (res.data.status === 'success') {
                setMessages([...messages, res.data.message]);
                setNewMessage('');
            }
        } catch (err) { console.error("Erreur envoi message", err); }
    };

    const handleRequestAttestation = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/attestation/request`, {}, axiosConfig);
            if (res.data.status === 'success') {
                setMessageSuccess(res.data.message);
                fetchDocuments();
                setTimeout(() => setMessageSuccess(''), 4000);
            }
        } catch (err) { console.error("Erreur demande attestation", err); }
        setLoading(false);
    };

    const fetchDocuments = async () => {
        try {
            const res = await axios.get(`${API_URL}/documents`, axiosConfig);
            if (res.data.status === 'success') setDocuments(res.data.documents);
        } catch (err) { console.error("Erreur chargement documents", err); }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            {/* Barre supérieure */}
            <header className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 text-white font-bold p-2 rounded-lg">E</div>
                    <h1 className="text-xl font-bold tracking-wide">Espace Étudiant — ENSA SGE</h1>
                </div>
                <button 
                    onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
                    className="text-sm bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-4 py-2 rounded-lg border border-red-500/20 transition-all"
                >
                    Déconnexion
                </button>
            </header>

            {/* Onglets de Navigation */}
            <nav className="bg-slate-900/50 border-b border-slate-800 p-2 flex gap-2 justify-center">
                <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                    📊 Notes & Absences
                </button>
                <button 
                    onClick={() => setActiveTab('messages')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'messages' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                    💬 Contacter un Prof
                </button>
                <button 
                    onClick={() => setActiveTab('documents')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'documents' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                    📄 Attestations & Emploi du temps
                </button>
            </nav>

            {/* Zone de contenu principal */}
            <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
                {messageSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl mb-6 text-center">
                        {messageSuccess}
                    </div>
                )}

                {/* 1. NOTES & ABSENCES */}
                {activeTab === 'dashboard' && (
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Bloc Notes */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                            <h2 className="text-lg font-bold mb-4 text-blue-400">📝 Mes Notes</h2>
                            {dashboardData.grades.length === 0 ? (
                                <p className="text-slate-500 text-sm italic">Aucune note saisie pour le moment.</p>
                            ) : (
                                <div className="overflow-hidden rounded-xl border border-slate-800">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-800 text-slate-400">
                                            <tr>
                                                <th className="p-3">Module</th>
                                                <th className="p-3 text-right">Note</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {dashboardData.grades.map((g) => (
                                                <tr key={g.id} className="hover:bg-slate-800/40">
                                                    <td className="p-3 font-medium text-slate-300">Module (ID: {g.filiere_id})</td>
                                                    <td className={`p-3 text-right font-bold ${g.score >= 10 ? 'text-emerald-400' : 'text-rose-400'}`}>{g.score} / 20</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Bloc Absences */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                            <h2 className="text-lg font-bold mb-4 text-amber-400">⚠️ Mes Absences</h2>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-black text-emerald-400">{dashboardData.absences.filter(a => a.justifie).length}</div>
                                    <div className="text-xs text-slate-400 uppercase mt-1">Justifiées</div>
                                </div>
                                <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-black text-rose-400">{dashboardData.absences.filter(a => !a.justifie).length}</div>
                                    <div className="text-xs text-slate-400 uppercase mt-1">Non Justifiées</div>
                                </div>
                            </div>
                            {dashboardData.absences.length > 0 && (
                                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-800 divide-y divide-slate-800 text-sm">
                                    {dashboardData.absences.map((abs) => (
                                        <div key={abs.id} className="p-3 flex justify-between items-center">
                                            <div>
                                                <div className="font-medium text-slate-300">{abs.module?.nom || `Module ID: ${abs.module_id}`}</div>
                                                <div className="text-xs text-slate-500">{abs.date}</div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${abs.justifie ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                {abs.justifie ? 'Justifiée' : 'Non Justifiée'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. MESSAGERIE PROFS */}
                {activeTab === 'messages' && (
                    <div className="grid md:grid-cols-3 gap-6 bg-slate-900 border border-slate-800 rounded-2xl min-h-[450px] overflow-hidden shadow-xl">
                        {/* Colonne Gauche : Choix du Prof */}
                        <div className="border-r border-slate-800 p-4 bg-slate-900/40">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Professeurs disponibles</h3>
                            <div className="space-y-1">
                                {teachers.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedTeacher(t)}
                                        className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${selectedTeacher?.id === t.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-700 font-bold flex items-center justify-center text-xs uppercase">{t.name.substring(0,2)}</div>
                                        <span className="font-medium text-sm">{t.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Colonne Droite : Discussion */}
                        <div className="col-span-2 flex flex-col bg-slate-950/20">
                            {selectedTeacher ? (
                                <>
                                    <div className="p-4 border-b border-slate-800 bg-slate-900/20 font-bold text-slate-200">
                                        Discussion avec {selectedTeacher.name}
                                    </div>
                                    <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[300px]">
                                        {messages.map((m) => (
                                            <div key={m.id} className={`max-w-[75%] p-3 rounded-2xl text-sm ${m.expediteur_id === selectedTeacher.id ? 'bg-slate-800 text-slate-200 mr-auto rounded-tl-none' : 'bg-blue-600 text-white ml-auto rounded-tr-none'}`}>
                                                <p>{m.contenu}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/40 flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Posez votre question ici..."
                                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                                        />
                                        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl text-sm">Envoyer</button>
                                    </form>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 italic text-sm">
                                    Sélectionnez un professeur pour commencer à chatter.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 3. ATTESTATIONS ET EMPLOI DU TEMPS */}
                {activeTab === 'documents' && (
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-200">Demander un document administratif</h3>
                                <p className="text-slate-400 text-sm mt-1">Votre demande sera immédiatement envoyée au secrétariat de l'école.</p>
                            </div>
                            <button
                                onClick={handleRequestAttestation}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm whitespace-nowrap"
                            >
                                {loading ? 'Envoi...' : '📄 Demander une attestation de scolarité'}
                            </button>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                            <h3 className="text-lg font-bold mb-4 text-slate-200">Mes Documents récents & Emploi du temps</h3>
                            {documents.length === 0 ? (
                                <p className="text-slate-500 text-sm italic">Aucun fichier disponible.</p>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {documents.map((doc) => (
                                        <div key={doc.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                                            <div className="truncate">
                                                <div className="font-semibold text-sm text-slate-300 truncate">{doc.titre}</div>
                                                <div className="text-xs text-blue-400 font-bold uppercase mt-1">{doc.type}</div>
                                            </div>
                                            <div>
                                                {doc.fichier_path === 'en_attente' ? (
                                                    <span className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">Traitement Admin</span>
                                                ) : (
                                                    <a 
                                                        href={`http://127.0.0.1:8000/storage/${doc.fichier_path}`} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-500 hover:text-white transition-all"
                                                    >
                                                        Ouvrir / Voir
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default StudentDashboard;