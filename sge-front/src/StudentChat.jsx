import React, { useState, useEffect } from 'react';
import api from './api'; // Ton instance Axios configurée avec le Token Bearer

export default function StudentChat() {
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    
    const currentUserId = parseInt(localStorage.getItem('user_id'));

    // 1. Charger les profs de la filière de l'étudiant
    useEffect(() => {
        api.get('/student/teachers')
            .then(res => {
                if (res.data.status === 'success') setTeachers(res.data.teachers);
            })
            .catch(err => console.error("Erreur profs:", err));
    }, []);

    // 2. Charger la discussion quand un prof est sélectionné
    useEffect(() => {
        if (selectedTeacher) {
            fetchConversation(selectedTeacher.id);
        }
    }, [selectedTeacher]);

    const fetchConversation = (teacherId) => {
        api.get(`/student/messages/${teacherId}`)
            .then(res => {
                if (res.data.status === 'success') setMessages(res.data.messages);
            })
            .catch(err => console.error("Erreur historique:", err));
    };

    // 3. Envoyer un message au prof
    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedTeacher) return;

        try {
            const res = await api.post('/student/messages', {
                destinataire_id: selectedTeacher.id,
                contenu: newMessage
            });
            
            if (res.data.status === 'success') {
                setNewMessage('');
                // On ajoute instantanément le message à l'écran
                setMessages([...messages, res.data.message]);
            }
        } catch (err) {
            console.error("Erreur d'envoi:", err);
        }
    };

    return (
        <div className="flex border border-slate-800 rounded-xl overflow-hidden bg-slate-900/10 h-[550px]">
            {/* Barre Latérale Gauche : Liste des profs */}
            <div className="w-1/3 border-r border-slate-800 p-4 overflow-y-auto bg-slate-950/20">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Professeurs Disponibles</h4>
                <div className="space-y-2">
                    {teachers.map(prof => (
                        <button
                            key={prof.id}
                            onClick={() => setSelectedTeacher(prof)}
                            className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${
                                selectedTeacher?.id === prof.id 
                                ? 'bg-blue-600/20 border border-blue-500/40 text-blue-400' 
                                : 'bg-slate-900/40 text-slate-300 hover:bg-slate-800/50 border border-transparent'
                            }`}
                        >
                            <div className="font-semibold text-sm">👨‍🏫 {prof.name}</div>
                            <div className="text-xs text-slate-500 truncate">{prof.email}</div>
                        </button>
                    ))}
                    {teachers.length === 0 && <p className="text-xs text-slate-500">Aucun professeur assigné à votre filière.</p>}
                </div>
            </div>

            {/* Zone de Chat Droite : Discussion courante */}
            <div className="w-2/3 flex flex-col justify-between bg-slate-950/40">
                {selectedTeacher ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-slate-800 bg-slate-900/30">
                            <h4 className="font-bold text-sm text-slate-200">Discussion avec {selectedTeacher.name}</h4>
                        </div>

                        {/* Fenêtre de messages */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-3">
                            {messages.map(msg => {
                                const isMe = msg.expediteur_id === currentUserId;
                                return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                                            isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/40'
                                        }`}>
                                            {msg.contenu}
                                        </div>
                                        <span className="text-[9px] text-slate-600 mt-0.5 px-1">
                                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input d'envoi */}
                        <form onSubmit={handleSend} className="p-4 border-t border-slate-800 flex gap-2 bg-slate-900/20">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                placeholder="Posez votre question ici..."
                                className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                            />
                            <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-600/10">
                                Envoyer
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex items-center justify-center flex-1 text-sm text-slate-500">
                        Sélectionnez un professeur pour commencer à chatter.
                    </div>
                )}
            </div>
        </div>
    );
}