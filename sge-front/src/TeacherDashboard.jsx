import React, { useState, useEffect } from 'react';
import api from './api';

export default function TeacherDashboard() {
    // 🗂️ Gestion des filières et choix de la filière active
    const [filieres, setFilieres] = useState([]);
    const [selectedFiliere, setSelectedFiliere] = useState(null);
    const [activeSection, setActiveSection] = useState('students'); // 'students', 'courses', ou 'messages'

    // 👥 Données de la filière sélectionnée
    const [students, setStudents] = useState([]);
    const [messages, setMessages] = useState([]);
    const [gradesInputs, setGradesInputs] = useState({}); // Stocke temporairement les notes tapées

    // 📚 Formulaire d'ajout de cours
    const [courseTitle, setCourseTitle] = useState('');
    const [courseDesc, setCourseDesc] = useState('');
    const [courseLink, setCourseLink] = useState('');

    // 💬 Formulaire de réponse aux messages
    const [replyInputs, setReplyInputs] = useState({});

    const [statusMessage, setStatusMessage] = useState('');
    
    // 🏷️ Récupération sécurisée du nom de l'utilisateur connecté
    const teacherName = localStorage.getItem('user_name') || 'Professeur';

    // Charge les filières du professeur au démarrage
    useEffect(() => {
        const token = localStorage.getItem('token') || localStorage.getItem('access_token');
        if (!token) {
            setStatusMessage("⚠️ Erreur d'authentification : Aucun token trouvé. Veuillez vous reconnecter.");
            return;
        }
        fetchMyFilieres();
    }, []);

    // Recharge les données dès que le prof change de filière ou de section
    useEffect(() => {
        if (selectedFiliere) {
            if (activeSection === 'students') fetchStudents(selectedFiliere.id);
            if (activeSection === 'messages') fetchMessages(selectedFiliere.id);
        }
    }, [selectedFiliere, activeSection]);

    const fetchMyFilieres = async () => {
        try {
            const response = await api.get('/teacher/filieres');
            setFilieres(response.data);
            if (response.data.length > 0) {
                setSelectedFiliere(response.data[0]); // Sélectionne la 1ère filière par défaut
            }
        } catch (err) {
            console.error("Erreur filières", err);
            if (err.response?.status === 401) {
                setStatusMessage("Votre session a expiré. Veuillez vous reconnecter.");
            }
        }
    };

    const fetchStudents = async (filiereId) => {
        try {
            const response = await api.get(`/teacher/filieres/${filiereId}/students`);
            setStudents(response.data);
            
            // Remplit les inputs avec les notes existantes calculées par le backend
            const initialGrades = {};
            response.data.forEach(st => {
                initialGrades[st.id] = st.current_grade !== null ? st.current_grade : '';
            });
            setGradesInputs(initialGrades);
        } catch (err) {
            console.error("Erreur étudiants", err);
            if (err.response?.status === 401) {
                setStatusMessage("Impossible de charger les étudiants : session non autorisée.");
            }
        }
    };

    const fetchMessages = async (filiereId) => {
        try {
            const response = await api.get(`/teacher/filieres/${filiereId}/messages`);
            setMessages(response.data);
        } catch (err) {
            console.error("Erreur messages", err);
        }
    };

    const handleGradeChange = (studentId, value) => {
        setGradesInputs({ ...gradesInputs, [studentId]: value });
    };

    const handleSaveGrade = async (studentId) => {
        setStatusMessage('');
        const score = gradesInputs[studentId];
        if (score === '' || isNaN(score) || score < 0 || score > 20) {
            alert("Veuillez saisir une note valide entre 0 et 20.");
            return;
        }
        try {
            await api.post('/teacher/grades', {
                student_id: studentId,
                filiere_id: selectedFiliere.id,
                score: parseFloat(score)
            });
            setStatusMessage('Note enregistrée avec succès ! 📝');
            fetchStudents(selectedFiliere.id);
        } catch (err) {
            setStatusMessage("Erreur d'enregistrement de la note.");
        }
    };

    const handleAddCourse = async (e) => {
        e.preventDefault();
        setStatusMessage('');
        try {
            await api.post('/teacher/courses', {
                title: courseTitle,
                description: courseDesc,
                file_path: courseLink,
                filiere_id: selectedFiliere.id
            });
            setStatusMessage('Support de cours publié ! 📚');
            setCourseTitle(''); setCourseDesc(''); setCourseLink('');
        } catch (err) {
            setStatusMessage("Erreur lors de la publication du cours.");
        }
    };

    const handleReplyChange = (msgId, value) => {
        setReplyInputs({ ...replyInputs, [msgId]: value });
    };

    const handleSendReply = async (msgId) => {
        const replyText = replyInputs[msgId];
        if (!replyText || replyText.trim() === '') return;
        try {
            // FIX : Changement du paramètre envoyé ('contenu' au lieu de 'reply') pour s'aligner avec Laravel
            await api.put(`/teacher/messages/${msgId}/reply`, { contenu: replyText });
            setReplyInputs({ ...replyInputs, [msgId]: '' });
            setStatusMessage('Réponse envoyée avec succès ! 💬');
            fetchMessages(selectedFiliere.id);
        } catch (err) {
            console.error(err);
            setStatusMessage("Erreur lors de l'envoi de la réponse.");
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-[#0b0f19] flex text-slate-100 w-full font-sans">
            
            {/* 1. SIDEBAR : LISTE DES FILIÈRES DU PROF */}
            <div className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 p-6 flex flex-col justify-between select-none">
                <div>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                            P
                        </div>
                        <div>
                            <h2 className="font-bold text-sm tracking-wide">ENSA SGE</h2>
                            <p className="text-xs text-purple-400">Espace Enseignant</p>
                        </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Mes Filières d'Enseignement</p>
                    <nav className="space-y-2">
                        {filieres.map(f => (
                            <button 
                                key={f.id}
                                type="button"
                                onClick={() => setSelectedFiliere(f)}
                                className={`w-full flex items-center justify-between px-4 py-3 font-bold rounded-xl border text-left transition-all cursor-pointer ${
                                    selectedFiliere?.id === f.id 
                                    ? 'bg-purple-600/10 text-purple-400 border-purple-500/20 shadow-lg shadow-purple-500/5' 
                                    : 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200'
                                }`}
                            >
                                <span>📚 {f.code}</span>
                                <span className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-md">Assignée</span>
                            </button>
                        ))}
                        {filieres.length === 0 && (
                            <p className="text-xs text-slate-500 italic p-2">Aucune filière assignée. Contactez l'admin.</p>
                        )}
                    </nav>
                </div>

                <button onClick={handleLogout} className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold rounded-xl transition-all cursor-pointer text-sm">
                    🚪 Déconnexion
                </button>
            </div>

            {/* 2. ZONE PRINCIPALE DE GESTION */}
            <div className="flex-1 p-8 overflow-y-auto">
                
                {/* En-tête dynamique */}
                <div className="flex justify-between items-start mb-8 border-b border-slate-800/60 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">Bonjour, Pr. {teacherName} 👋</h1>
                        <p className="text-sm text-slate-400 mt-1">Gestion de la filière : <span className="text-purple-400 font-bold">{selectedFiliere ? `${selectedFiliere.code} - ${selectedFiliere.nom}` : '—'}</span></p>
                    </div>

                    {/* Onglets d'action */}
                    {selectedFiliere && (
                        <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800 shadow-inner">
                            <button onClick={() => setActiveSection('students')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeSection === 'students' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
                                👥 Étudiants & Notes
                            </button>
                            <button onClick={() => setActiveSection('courses')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeSection === 'courses' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
                                📖 Déposer un Cours
                            </button>
                            <button onClick={() => setActiveSection('messages')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeSection === 'messages' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
                                💬 Questions Étudiants
                            </button>
                        </div>
                    )}
                </div>

                {/* Notifications de succès / erreurs */}
                {statusMessage && (
                    <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-semibold rounded-xl">
                        {statusMessage}
                    </div>
                )}

                {/* SECTION 1 : TABLEAU DES ÉTUDIANTS & SAISIE DES NOTES */}
                {selectedFiliere && activeSection === 'students' && (
                    <div className="bg-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-slate-800 bg-slate-950/20 flex justify-between items-center">
                            <h3 className="text-base font-bold text-white">Liste de la promotion ({selectedFiliere.code})</h3>
                            <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full font-medium">{students.length} Étudiants</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase bg-slate-950/40 select-none">
                                        <th className="p-4">Nom Complet</th>
                                        <th className="p-4">Adresse Email</th>
                                        <th className="p-4 text-center" style={{ width: '240px' }}>Note finale / 20</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/40">
                                    {students.map(student => (
                                        <tr key={student.id} className="hover:bg-slate-800/10 transition-colors">
                                            <td className="p-4 font-bold text-slate-200">{student.name}</td>
                                            <td className="p-4 text-slate-400 text-sm">{student.email}</td>
                                            <td className="p-4 flex items-center justify-center gap-3">
                                                <input 
                                                    type="number" 
                                                    step="0.25"
                                                    min="0"
                                                    max="20"
                                                    placeholder="N/A"
                                                    value={gradesInputs[student.id] ?? ''}
                                                    onChange={(e) => handleGradeChange(student.id, e.target.value)}
                                                    className="w-20 text-center px-2 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white font-bold focus:outline-none focus:border-purple-500 text-sm"
                                                />
                                                {/* FIX : Ajout du texte "Valider" et ajustement esthétique du bouton note */}
                                                <button 
                                                    onClick={() => handleSaveGrade(student.id)}
                                                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                                                >
                                                    Valider
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {students.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="p-12 text-center text-slate-500 text-sm italic">Aucun étudiant n'est inscrit dans cette filière pour le moment.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* SECTION 2 : FORMULAIRE DE PUBLICATION DE COURS */}
                {selectedFiliere && activeSection === 'courses' && (
                    <div className="max-w-2xl bg-slate-900/30 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-1">Mettre un support de cours en ligne</h3>
                        <p className="text-xs text-slate-400 mb-6">Ajoutez les documents, TPs, ou références bibliographiques pour la classe.</p>
                        
                        <form onSubmit={handleAddCourse} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Intitulé du document</label>
                                <input type="text" required value={courseTitle} onChange={e => setCourseTitle(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm" placeholder="Ex: Cours Réseaux - Routage OSPF et BGP" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description ou Consignes</label>
                                <textarea rows="3" value={courseDesc} onChange={e => setCourseDesc(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm" placeholder="Ex: Exercices à préparer pour la séance de TP numéro 3..."></textarea>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lien URL du Support (Drive, PDF en ligne)</label>
                                <input type="text" value={courseLink} onChange={e => setCourseLink(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm" placeholder="https://drive.google.com/your-shared-file" />
                            </div>
                            <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-600/10 cursor-pointer text-sm">
                                🚀 Mettre à disposition de la filière
                            </button>
                        </form>
                    </div>
                )}

                {/* SECTION 3 : ESPACE DISCUSSIONS & FORUM AUX QUESTIONS */}
                {selectedFiliere && activeSection === 'messages' && (
                    <div className="space-y-4 max-w-4xl">
                        <h3 className="text-lg font-bold text-white mb-2">Questions posées par les étudiants</h3>
                        
                        {messages.map(msg => (
                            <div key={msg.id} className="p-5 bg-slate-900/30 border border-slate-800 rounded-2xl space-y-4 shadow-md">
                                <div className="flex justify-between items-center select-none">
                                    {/* FIX : On va chercher la relation expediteur.name au lieu de student_id */}
                                    <span className="text-xs font-bold text-purple-400 bg-purple-500/5 px-2.5 py-1 rounded-md border border-purple-500/10">
                                        👤 {msg.expediteur ? msg.expediteur.name : `Étudiant #${msg.expediteur_id}`}
                                    </span>
                                    <span className="text-xs text-slate-500">{new Date(msg.created_at).toLocaleDateString()}</span>
                                </div>
                                {/* FIX : On utilise msg.contenu qui vient de Laravel à la place de msg.content */}
                                <p className="text-slate-200 text-sm bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 font-medium italic">
                                    "{msg.contenu}"
                                </p>
                                
                                {msg.reply ? (
                                    <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                        <p className="text-xs font-bold text-emerald-400 mb-1">✓ Votre réponse envoyée :</p>
                                        <p className="text-sm text-slate-300 font-medium">{msg.reply}</p>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 pt-1">
                                        <input 
                                            type="text" 
                                            placeholder="Écrivez votre réponse éclairée..." 
                                            value={replyInputs[msg.id] || ''}
                                            onChange={(e) => handleReplyChange(msg.id, e.target.value)}
                                            className="flex-1 px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                                        />
                                        <button 
                                            onClick={() => handleSendReply(msg.id)}
                                            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                                        >
                                            Répondre
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {messages.length === 0 && (
                            <p className="text-sm text-slate-500 italic p-8 border border-dashed border-slate-800 rounded-2xl text-center select-none">Aucun message ou question n'a été envoyé par les étudiants de cette section.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}