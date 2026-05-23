import React, { useState, useEffect } from 'react';
import api from './api';
import FiliereSelector from './FiliereSelector'; // ⚡ Importé depuis le même niveau

export default function AdminDashboard() {
    // Gestion de l'onglet actif : 'users', 'filieres', 'absences', ou 'attestations'
    const [activeTab, setActiveTab] = useState('users');

    // NOUVEAU : État global pour la filière sélectionnée dans le filtre supérieur
    const [selectedFiliereId, setSelectedFiliereId] = useState('');

    // États pour les Utilisateurs (Création)
    const [users, setUsers] = useState([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('etudiant');
    const [selectedFiliereIds, setSelectedFiliereIds] = useState([]);

    // 🔄 NOUVEAUX ÉTATS : Pour la modification d'un utilisateur
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'etudiant',
        filiere_id: '',
        filiere_ids: []
    });

    // États pour les Filières
    const [filieres, setFilieres] = useState([]);
    const [filiereCode, setFiliereCode] = useState('');
    const [filiereNom, setFiliereNom] = useState('');

    // NOUVEAUX ÉTATS : Absences & Attestations
    const [absences, setAbsences] = useState([]);
    const [absenceStudentId, setAbsenceStudentId] = useState('');
    const [absenceModuleId, setAbsenceModuleId] = useState('');
    const [absenceDate, setAbsenceDate] = useState('');
    const [absenceJustifie, setAbsenceJustifie] = useState(false);
    
    const [attestations, setAttestations] = useState([]);
    const [pdfFiles, setPdfFiles] = useState({}); // Stocke les fichiers sélectionnés par ID de demande
    const [uploadLoading, setUploadLoading] = useState(false);

    const [message, setMessage] = useState('');
    const adminName = localStorage.getItem('user_name') || 'Admin';

    // Charger les filières globales une seule fois au montage du composant
    useEffect(() => {
        fetchFilieres();
    }, []);

    // ⚡ Déclencheur intelligent : recharge les données dès que l'onglet change OU qu'on filtre par filière
    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'attestations') {
            fetchAttestations();
        }
    }, [activeTab, selectedFiliereId]);

    // Réinitialiser les filières sélectionnées quand on change de rôle dans le formulaire de création
    useEffect(() => {
        setSelectedFiliereIds([]);
    }, [role]);

    // --- ENVOIS & RÉCUPÉRATIONS API ---

    const fetchUsers = async () => {
        try {
            // 🧠 On passe le paramètre 'filiere_id' à notre API Laravel modifiée
            const response = await api.get(`/admin/users?filiere_id=${selectedFiliereId}`);
            setUsers(response.data.users || response.data);
        } catch (err) {
            console.error("Erreur récupération utilisateurs", err);
        }
    };

    const fetchFilieres = async () => {
        try {
            const response = await api.get('/admin/filieres');
            // Gère si Laravel renvoie la clé { filieres: [...] } ou un tableau brut
            setFilieres(response.data.filieres || response.data);
        } catch (err) {
            console.error("Erreur récupération filières", err);
        }
    };

    const fetchAttestations = async () => {
        try {
            // 🧠 On passe également le paramètre 'filiere_id' pour filtrer les attestations
            const response = await api.get(`/admin/attestations?filiere_id=${selectedFiliereId}`);
            if (response.data.status === 'success') {
                setAttestations(response.data.requests);
            }
        } catch (err) {
            console.error("Erreur récupération attestations", err);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setMessage('');
        
        if (role !== 'admin' && selectedFiliereIds.length === 0) {
            setMessage('⚠️ Veuillez sélectionner au moins une filière.');
            return;
        }

        try {
            await api.post('/admin/users', { 
                name, 
                email, 
                password, 
                role, // Envoie "professeur", "etudiant" ou "admin" proprement
                filiere_id: selectedFiliereIds[0] || null,
                filiere_ids: selectedFiliereIds
            });

            setMessage('Utilisateur créé avec succès ! ✨');
            setName(''); 
            setEmail(''); 
            setPassword('');
            setSelectedFiliereIds([]);
            fetchUsers();
        } catch (err) {
            setMessage(err.response?.data?.message || "Erreur lors de la création.");
        }
    };

    // 🔄 NOUVEAU : Traitement de la modification d'un utilisateur
    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setMessage('');

        if (editForm.role !== 'admin' && !editForm.filiere_id && editForm.filiere_ids.length === 0) {
            setMessage('⚠️ Veuillez affecter au moins une filière.');
            return;
        }

        try {
            const payload = {
                name: editForm.name,
                email: editForm.email,
                role: editForm.role,
                filiere_id: ['etudiant', 'student'].includes(editForm.role) ? editForm.filiere_id : null,
                filiere_ids: ['professeur', 'enseignant'].includes(editForm.role) ? editForm.filiere_ids : []
            };

            // On n'ajoute le mot de passe que s'il a été saisi
            if (editForm.password.trim() !== '') {
                payload.password = editForm.password;
            }

            const response = await api.put(`/admin/users/${editingUser.id}`, payload);

            if (response.data.status === 'success') {
                setMessage('Utilisateur mis à jour avec succès ! 🔄');
                setEditingUser(null); // Fermer le modal
                fetchUsers(); // Rafraîchir la table
            }
        } catch (err) {
            setMessage(err.response?.data?.message || "Erreur lors de la modification.");
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("🔴 Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;
        setMessage('');
        try {
            const response = await api.delete(`/admin/users/${id}`);
            if (response.data.status === 'success') {
                setMessage('Utilisateur supprimé avec succès ! ❌');
                fetchUsers();
            }
        } catch (err) {
            setMessage(err.response?.data?.message || "Erreur lors de la suppression.");
        }
    };

    const handleCreateFiliere = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            await api.post('/admin/filieres', { code: filiereCode, nom: filiereNom });
            setMessage('Filière ajoutée avec succès ! 📚');
            setFiliereCode(''); setFiliereNom('');
            fetchFilieres();
        } catch (err) {
            setMessage(err.response?.data?.message || "Erreur lors de la création.");
        }
    };

    const handleAddAbsence = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const response = await api.post('/admin/absences', {
                etudiant_id: absenceStudentId,
                module_id: absenceModuleId,
                date: absenceDate,
                justifie: absenceJustifie
            });
            if (response.data.status === 'success') {
                setMessage('Absence enregistrée avec succès ! ⚠️');
                setAbsenceStudentId('');
                setAbsenceModuleId('');
                setAbsenceDate('');
                setAbsenceJustifie(false);
            }
        } catch (err) {
            setMessage(err.response?.data?.message || "Erreur lors de la saisie de l'absence.");
        }
    };

    const handleFileChange = (id, e) => {
        setPdfFiles({ ...pdfFiles, [id]: e.target.files[0] });
    };

    const handleUploadAttestation = async (id) => {
        const file = pdfFiles[id];
        if (!file) {
            setMessage("⚠️ Veuillez sélectionner un fichier PDF d'abord.");
            return;
        }

        const formData = new FormData();
        formData.append('fichier', file);

        setUploadLoading(true);
        setMessage('');
        try {
            const response = await api.post(`/admin/attestations/${id}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.status === 'success') {
                setMessage("Attestation officielle transmise à l'étudiant ! 🚀");
                fetchAttestations();
            }
        } catch (err) {
            setMessage("Erreur lors de l'envoi du document PDF.");
        }
        setUploadLoading(false);
    };

    const handleCheckboxChange = (filiereId) => {
        if (selectedFiliereIds.includes(filiereId)) {
            setSelectedFiliereIds(selectedFiliereIds.filter(id => id !== filiereId));
        } else {
            setSelectedFiliereIds([...selectedFiliereIds, filiereId]);
        }
    };

    // 🔄 NOUVEAU : Gérer les cases à cocher de modification (Profs)
    const handleEditCheckboxChange = (filiereId) => {
        if (editForm.filiere_ids.includes(filiereId)) {
            setEditForm({
                ...editForm,
                filiere_ids: editForm.filiere_ids.filter(id => id !== filiereId)
            });
        } else {
            setEditForm({
                ...editForm,
                filiere_ids: [...editForm.filiere_ids, filiereId]
            });
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-[#0b0f19] flex text-slate-100 relative">
            
            {/* 1. MENU LATÉRAL (SIDEBAR) */}
            <div className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 p-6 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg">
                            A
                        </div>
                        <div>
                            <h2 className="font-bold text-sm tracking-wide">ENSA SGE</h2>
                            <p className="text-xs text-slate-400">Panneau Admin</p>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        <button 
                            type="button"
                            onClick={() => { setActiveTab('users'); setMessage(''); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl border text-left transition-all cursor-pointer ${
                                activeTab === 'users' 
                                ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' 
                                : 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200'
                            }`}
                        >
                            👥 Gestion Utilisateurs
                        </button>
                        
                        <button 
                            type="button"
                            onClick={() => { setActiveTab('filieres'); setMessage(''); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl border text-left transition-all cursor-pointer ${
                                activeTab === 'filieres' 
                                ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' 
                                : 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200'
                            }`}
                        >
                            📚 Gestion Filières
                        </button>

                        <button 
                            type="button"
                            onClick={() => { setActiveTab('absences'); setMessage(''); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl border text-left transition-all cursor-pointer ${
                                activeTab === 'absences' 
                                ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' 
                                : 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200'
                            }`}
                        >
                            ⚠️ Saisir Absence
                        </button>

                        <button 
                            type="button"
                            onClick={() => { setActiveTab('attestations'); setMessage(''); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl border text-left transition-all cursor-pointer ${
                                activeTab === 'attestations' 
                                ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' 
                                : 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200'
                            }`}
                        >
                            📄 Demandes Attestations
                        </button>
                    </nav>
                </div>

                <button onClick={handleLogout} className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium rounded-xl transition-all cursor-pointer">
                    🚪 Déconnexion
                </button>
            </div>

            {/* 2. ZONE DE CONTENU PRINCIPAL */}
            <div className="flex-1 p-8 overflow-y-auto">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Bonjour, {adminName} 👋</h1>
                        <p className="text-sm text-slate-400">Voici le panneau de contrôle de l'établissement.</p>
                    </div>

                    {/* ⚡ Intégration du composant de filtrage s'il s'agit des utilisateurs ou des attestations */}
                    {(activeTab === 'users' || activeTab === 'attestations') && (
                        <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800/60">
                            <FiliereSelector 
                                selectedFiliere={selectedFiliereId} 
                                setSelectedFiliere={setSelectedFiliereId} 
                            />
                        </div>
                    )}
                </div>

                {message && (
                    <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm rounded-xl">
                        {message}
                    </div>
                )}

                {/* TAB : GESTION DES UTILISATEURS */}
                {activeTab === 'users' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Formulaire d'ajout */}
                        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl h-fit">
                            <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Ajouter un membre</h3>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Nom Complet</label>
                                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500" placeholder="Ex: Ahmed Alami" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Adresse Email</label>
                                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500" placeholder="nom@ensa.ma" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Mot de passe</label>
                                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500" placeholder="••••••••" />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Rôle</label>
                                    <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500">
                                        <option value="etudiant">Étudiant 🎓</option>
                                        <option value="professeur">Professeur 👨‍🏫</option>
                                        <option value="admin">Administrateur 🛠️</option>
                                    </select>
                                </div>

                                {role === 'etudiant' && (
                                    <div className="p-3 bg-slate-950/30 border border-slate-800/60 rounded-xl">
                                        <label className="block text-xs font-semibold text-blue-400 uppercase mb-2">Affecter une Filière</label>
                                        <select 
                                            required
                                            value={selectedFiliereIds[0] || ''} 
                                            onChange={e => setSelectedFiliereIds(e.target.value ? [parseInt(e.target.value)] : [])}
                                            className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="">-- Choisir la filière --</option>
                                            {filieres.map(f => (
                                                <option key={f.id} value={f.id}>{f.code} - {f.nom}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {role === 'professeur' && (
                                    <div className="p-3 bg-slate-950/30 border border-slate-800/60 rounded-xl">
                                        <label className="block text-xs font-semibold text-purple-400 uppercase mb-2">Filières d'enseignement (Multiples)</label>
                                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                            {filieres.map(f => (
                                                <label key={f.id} className="flex items-center gap-3 px-3 py-2 bg-slate-950/40 border border-slate-800/40 rounded-lg cursor-pointer hover:bg-slate-800/30 transition-colors">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedFiliereIds.includes(f.id)}
                                                        onChange={() => handleCheckboxChange(f.id)}
                                                        className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-800 focus:ring-0" 
                                                    />
                                                    <span className="text-sm font-medium text-slate-300"><span className="text-purple-400 font-bold">{f.code}</span> - {f.nom}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-lg cursor-pointer">
                                    Créer le compte
                                </button>
                            </form>
                        </div>

                        {/* Liste des membres + Boutons Actions */}
                        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-slate-800"><h3 className="text-lg font-bold">Comptes Utilisateurs</h3></div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase bg-slate-950/20">
                                            <th className="p-4">Nom / Email</th>
                                            <th className="p-4">Rôle</th>
                                            <th className="p-4">Filière(s)</th>
                                            <th className="p-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {users.map(user => (
                                            <tr key={user.id} className="hover:bg-slate-800/20 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-medium text-slate-200">{user.name}</div>
                                                    <div className="text-xs text-slate-500">{user.email}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                                                        user.role === 'admin' ? 'bg-red-500/10 text-red-400' :
                                                        user.role === 'professeur' || user.role === 'enseignant' ? 'bg-purple-500/10 text-purple-400' :
                                                        'bg-green-500/10 text-green-400'
                                                    }`}>{user.role}</span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.filieres && user.filieres.map(f => (
                                                            <span key={f.id} className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded text-[11px] font-bold uppercase">
                                                                {f.code}
                                                            </span>
                                                        ))}
                                                        {user.filiere && (
                                                            <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded text-[11px] font-bold uppercase">
                                                                {user.filiere.code}
                                                            </span>
                                                        )}
                                                        {(!user.filieres || user.filieres.length === 0) && !user.filiere && (
                                                            <span className="text-xs text-slate-600">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {/* 🔄 NOUVEAU : Bouton pour déclencher le Modal de modification */}
                                                        <button 
                                                            onClick={() => {
                                                                setEditingUser(user);
                                                                setEditForm({
                                                                    name: user.name,
                                                                    email: user.email,
                                                                    password: '', // Vide par défaut
                                                                    role: user.role,
                                                                    filiere_id: user.filiere_id || (user.filiere ? user.filiere.id : ''),
                                                                    filiere_ids: user.filieres ? user.filieres.map(f => f.id) : []
                                                                });
                                                            }}
                                                            className="text-xs bg-blue-500/10 hover:bg-blue-600 border border-blue-500/20 text-blue-400 hover:text-white px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                                                        >
                                                            ✏️ Modifier
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="text-xs bg-red-500/10 hover:bg-red-600 border border-red-500/20 text-red-400 hover:text-white px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                                                        >
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB : GESTION DES FILIÈRES */}
                {activeTab === 'filieres' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl h-fit">
                            <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Ajouter une Filière</h3>
                            <form onSubmit={handleCreateFiliere} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Code de la Filière</label>
                                    <input type="text" required value={filiereCode} onChange={e => setFiliereCode(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500" placeholder="Ex: GINF" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Nom Complet</label>
                                    <input type="text" required value={filiereNom} onChange={e => setFiliereNom(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500" placeholder="Ex: Génie Informatique" />
                                </div>
                                <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg cursor-pointer">
                                    Ajouter la filière
                                </button>
                            </form>
                        </div>

                        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-slate-800"><h3 className="text-lg font-bold">Filières Accréditées (ENSA)</h3></div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase bg-slate-950/20">
                                            <th className="p-4">Code</th>
                                            <th className="p-4">Nom de la Filière</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {filieres.map(fil => (
                                            <tr key={fil.id} className="hover:bg-slate-800/20 transition-colors">
                                                <td className="p-4 font-bold text-indigo-400">{fil.code}</td>
                                                <td className="p-4 text-slate-200">{fil.nom}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB : SAISIE DES ABSENCES */}
                {activeTab === 'absences' && (
                    <div className="max-w-xl mx-auto bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-xl">
                        <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Saisir une Absence Étudiante</h3>
                        <form onSubmit={handleAddAbsence} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Sélectionner l'Étudiant</label>
                                <select 
                                    required 
                                    value={absenceStudentId} 
                                    onChange={e => setAbsenceStudentId(e.target.value)} 
                                    className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">-- Choisir un étudiant --</option>
                                    {users
                                        .filter(u => u.role === 'etudiant')
                                        .map(student => (
                                            <option key={student.id} value={student.id}>
                                                {student.name} ({student.email})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">ID du Module / Matière</label>
                                <input type="number" required placeholder="Ex: 12" value={absenceModuleId} onChange={e => setAbsenceModuleId(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Date d'absence</label>
                                <input type="date" required value={absenceDate} onChange={e => setAbsenceDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500 text-slate-300" />
                            </div>
                            <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                                <input type="checkbox" id="justifieBox" checked={absenceJustifie} onChange={e => setAbsenceJustifie(e.target.checked)} className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-800 focus:ring-0" />
                                <label htmlFor="justifieBox" className="text-sm font-medium text-slate-300 cursor-pointer select-none">L'absence est déjà justifiée</label>
                            </div>
                            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-lg cursor-pointer">
                                Enregistrer l'Absence
                            </button>
                        </form>
                    </div>
                )}

                {/* TAB : DEMANDES D'ATTESTATIONS */}
                {activeTab === 'attestations' && (
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden p-6 shadow-xl">
                        <h3 className="text-lg font-bold mb-4">Demandes d'Attestations Reçues</h3>
                        {attestations.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">Aucune demande en attente pour cette filière.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase bg-slate-950/20">
                                            <th className="p-4">Étudiant</th>
                                            <th className="p-4">Type de Document</th>
                                            <th className="p-4">Statut</th>
                                            <th className="p-4">Action / Téléversement</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {attestations.map(req => (
                                            <tr key={req.id} className="hover:bg-slate-800/20 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-medium text-slate-200">{req.student?.name}</div>
                                                    <div className="text-xs text-slate-500">{req.student?.email}</div>
                                                </td>
                                                <td className="p-4 text-sm text-slate-300">
                                                    {req.type_document === 'scolarite' ? '📄 Certificat de Scolarité' : '🎓 Attestation de Réussite'}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${req.statut === 'termine' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                                        {req.statut === 'termine' ? 'Transmis' : 'En attente'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {req.statut === 'termine' ? (
                                                        <span className="text-xs text-slate-500 flex items-center gap-1">✔️ Fichier envoyé (<a href={`http://localhost:8000/storage/${req.fichier_path}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Voir</a>)</span>
                                                    ) : (
                                                        <div className="flex items-center gap-3">
                                                            <input type="file" accept=".pdf" onChange={(e) => handleFileChange(req.id, e)} className="text-xs text-slate-400 block w-full file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600/10 file:text-blue-400 hover:file:bg-blue-600/20 file:cursor-pointer" />
                                                            <button onClick={() => handleUploadAttestation(req.id)} disabled={uploadLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium text-xs rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap">
                                                                {uploadLoading ? 'Envoi...' : '🚀 Envoyer'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* 🔄 NOUVEAU : FENÊTRE MODALE DE MODIFICATION (S'affiche uniquement si editingUser n'est pas null) */}
            {editingUser && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
                        
                        {/* Entête du Modal */}
                        <div className="flex justify-between items-center mb-6 border-b border-slate-800/80 pb-3">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                ✏️ Modifier le Profil : <span className="text-blue-400">{editingUser.name}</span>
                            </h3>
                            <button 
                                onClick={() => setEditingUser(null)}
                                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xl"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Formulaire interne du Modal */}
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Nom Complet</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={editForm.name} 
                                    onChange={e => setEditForm({...editForm, name: e.target.value})} 
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500" 
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Adresse Email</label>
                                <input 
                                    type="email" 
                                    required 
                                    value={editForm.email} 
                                    onChange={e => setEditForm({...editForm, email: e.target.value})} 
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500" 
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Nouveau mot de passe (Laisser vide si inchangé)</label>
                                <input 
                                    type="password" 
                                    value={editForm.password} 
                                    onChange={e => setEditForm({...editForm, password: e.target.value})} 
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500" 
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Rôle</label>
                                <select 
                                    value={editForm.role} 
                                    onChange={e => setEditForm({...editForm, role: e.target.value, filiere_id: '', filiere_ids: []})} 
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                                >
                                    <option value="etudiant">Étudiant 🎓</option>
                                    <option value="professeur">Professeur 👨‍🏫</option>
                                    <option value="admin">Administrateur 🛠️</option>
                                </select>
                            </div>

                            {/* Cas Étudiant : Sélection unique */}
                            {['etudiant', 'student'].includes(editForm.role) && (
                                <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
                                    <label className="block text-xs font-semibold text-green-400 uppercase mb-2">Modifier la Filière Affectée</label>
                                    <select 
                                        required
                                        value={editForm.filiere_id} 
                                        onChange={e => setEditForm({...editForm, filiere_id: e.target.value ? parseInt(e.target.value) : ''})}
                                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="">-- Choisir la filière --</option>
                                        {filieres.map(f => (
                                            <option key={f.id} value={f.id}>{f.code} - {f.nom}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Cas Professeur : Sélection multiple (Cases à cocher adaptées) */}
                            {['professeur', 'enseignant'].includes(editForm.role) && (
                                <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
                                    <label className="block text-xs font-semibold text-purple-400 uppercase mb-2">Filières d'enseignement (Multiples)</label>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                        {filieres.map(f => (
                                            <label key={f.id} className="flex items-center gap-3 px-3 py-2 bg-slate-900 border border-slate-800/60 rounded-lg cursor-pointer hover:bg-slate-800/30 transition-colors">
                                                <input 
                                                    type="checkbox" 
                                                    checked={editForm.filiere_ids.includes(f.id)}
                                                    onChange={() => handleEditCheckboxChange(f.id)}
                                                    className="w-4 h-4 rounded text-purple-600 bg-slate-950 border-slate-800 focus:ring-0" 
                                                />
                                                <span className="text-sm font-medium text-slate-300">
                                                    <span className="text-purple-400 font-bold">{f.code}</span> - {f.nom}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions du Modal */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm transition-all cursor-pointer"
                                >
                                    Annuler
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-all shadow-md cursor-pointer"
                                >
                                    Enregistrer les changements
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}