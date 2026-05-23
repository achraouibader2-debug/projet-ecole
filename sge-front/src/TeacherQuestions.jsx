import React, { useState, useEffect } from 'react';
import api from './api'; // Ton instance axios

export default function TeacherQuestions({ selectedFiliereId }) {
    const [questions, setQuestions] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // 1. Charger les questions de la filière sélectionnée
    const fetchQuestions = () => {
        if (!selectedFiliereId) return;
        
        api.get(`/teacher/filieres/${selectedFiliereId}/messages`)
            .then(res => {
                // Laravel renvoie directement le tableau de messages ici
                setQuestions(res.data);
                setErrorMessage('');
            })
            .catch(err => {
                console.error("Erreur lors de la récupération des messages:", err);
                setErrorMessage("Impossible de charger les questions.");
            });
    };

    useEffect(() => {
        fetchQuestions();
        setSelectedQuestion(null);
    }, [selectedFiliereId]);

    // 2. Soumettre la réponse au backend
    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyContent.trim() || !selectedQuestion) return;

        setErrorMessage('');
        setSuccessMessage('');

        try {
            // Utilise l'ID du message sélectionné pour y répondre
            const res = await api.put(`/teacher/messages/${selectedQuestion.id}/reply`, {
                contenu: replyContent // Attend 'contenu' côté Laravel
            });

            setSuccessMessage("Réponse envoyée avec succès ! 💬");
            setReplyContent('');
            
            // Rafraîchir la liste et fermer ou actualiser la vue courante
            fetchQuestions();
            setSelectedQuestion(null);
        } catch (err) {
            console.error("Erreur lors du reply:", err);
            setErrorMessage("Erreur lors de l'envoi de la réponse.");
        }
    };

    return (
        <div className="space-y-4 mt-4">
            {/* Alertes d'état */}
            {errorMessage && (
                <div className="p-4 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 text-sm">
                    {errorMessage}
                </div>
            )}
            {successMessage && (
                <div className="p-4 rounded-xl bg-green-600/20 border border-green-500/40 text-green-400 text-sm">
                    {successMessage}
                </div>
            )}

            <div className="flex border border-slate-800 rounded-xl overflow-hidden bg-slate-900/20 h-[500px]">
                {/* 📄 LISTE DES QUESTIONS A GAUCHE */}
                <div className="w-1/3 border-r border-slate-800 p-4 overflow-y-auto bg-slate-950/20">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Questions reçues</h4>
                    <div className="space-y-2">
                        {questions.map(msg => (
                            <button
                                key={msg.id}
                                onClick={() => setSelectedQuestion(msg)}
                                className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer border ${
                                    selectedQuestion?.id === msg.id
                                        ? 'bg-purple-600/20 border-purple-500/40 text-purple-400'
                                        : 'bg-slate-900/40 text-slate-300 hover:bg-slate-800/50 border-transparent'
                                }`}
                            >
                                {/* Correction ici : lecture de expediteur.name */}
                                <div className="font-semibold text-sm">
                                    🎓 {msg.expediteur ? msg.expediteur.name : `Étudiant #${msg.expediteur_id}`}
                                </div>
                                {/* Correction ici : lecture de msg.contenu */}
                                <p className="text-xs text-slate-400 truncate mt-1">{msg.contenu}</p>
                            </button>
                        ))}
                        {questions.length === 0 && (
                            <p className="text-xs text-slate-500 text-center py-6">Aucune question pour le moment.</p>
                        )}
                    </div>
                </div>

                {/* 💬 ZONE DE LECTURE ET DE RÉPONSE A DROITE */}
                <div className="w-2/3 flex flex-col justify-between bg-slate-950/40">
                    {selectedQuestion ? (
                        <div className="flex flex-col h-full justify-between p-4">
                            {/* Affichage de la question reçue */}
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                                    <div className="text-xs text-purple-400 font-bold mb-1">
                                        QUESTION DE {selectedQuestion.expediteur?.name?.toUpperCase() || 'ÉTUDIANT'} :
                                    </div>
                                    <p className="text-sm text-slate-200 whitespace-pre-line">
                                        "{selectedQuestion.contenu}"
                                    </p>
                                    <span className="text-[10px] text-slate-500 mt-2 block">
                                        Reçu le : {new Date(selectedQuestion.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {/* Formulaire pour répondre */}
                            <form onSubmit={handleReply} className="space-y-2">
                                <input
                                    type="text"
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Écrivez votre réponse éclairée..."
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-purple-500"
                                />
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-600/20"
                                    >
                                        Répondre
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center flex-1 text-sm text-slate-500">
                            Sélectionnez la question d'un étudiant pour y répondre.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}