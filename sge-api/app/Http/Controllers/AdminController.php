<?php



namespace App\Http\Controllers;



use App\Models\User;

use App\Models\Absence;

use App\Models\Document;

use App\Models\Filiere;

use Illuminate\Http\Request;

use Illuminate\Support\Facades\Hash;

use Illuminate\Support\Facades\Storage;



class AdminController extends Controller

{

    // === 1. GESTION DES UTILISATEURS (AVEC FILTRE) ===



    // Récupérer tous les utilisateurs (ou filtrés par filière)

    public function getUsers(Request $request)

    {

        // 🧠 On charge à la fois la filière unique (étudiant) et les filières multiples (professeur)

        $query = User::with(['filiere', 'filieres']);



        // Si React envoie un filiere_id, on filtre la requête SQL

        if ($request->has('filiere_id') && $request->filiere_id != '') {

            $filiereId = $request->filiere_id;

            $query->where(function($q) use ($filiereId) {

                // Filtre si c'est sa filière principale (Étudiant)

                $q->where('filiere_id', $filiereId)

                  // OU s'il possède cette filière dans sa table pivot (Professeur)

                  ->orWhereHas('filieres', function($subQuery) use ($filiereId) {

                      $subQuery->where('filieres.id', $filiereId);

                  });

            });

        }



        $users = $query->get();



        return response()->json([

            'status' => 'success',

            'users' => $users

        ], 200);

    }



    // Créer un utilisateur (Étudiant ou Enseignant)

    public function createUser(Request $request)

    {

        // 🛠️ Validation des données issues de React

        $request->validate([

            'name' => 'required|string|max:255',

            'email' => 'required|string|email|max:255|unique:users',

            'password' => 'required|string|min:6',

            'role' => 'required|string|in:admin,enseignant,professeur,teacher,etudiant,student',

            'filiere_id' => 'nullable|exists:filieres,id',

            'filiere_ids' => 'nullable|array', // ⚡ Reçu depuis React pour les profs

            'filiere_ids.*' => 'exists:filieres,id',

        ]);



        $role = $request->role;



        $user = User::create([

            'name' => $request->name,

            'email' => $request->email,

            'password' => Hash::make($request->password),

            'role' => $role,

            // On affecte la filière directe uniquement si ce n'est pas un prof

            'filiere_id' => ($role === 'etudiant' || $role === 'student') ? $request->filiere_id : null,

        ]);



        // Attacher les filières multiples dans la table pivot si c'est un professeur

        if (($role === 'professeur' || $role === 'enseignant') && $request->has('filiere_ids')) {

            // Synchro des IDs reçus dans la relation Many-to-Many

            $user->filieres()->sync($request->filiere_ids);

        }



        // Recharger les relations pour renvoyer un objet complet à React

        $user->load(['filiere', 'filieres']);



        return response()->json([

            'status' => 'success',

            'message' => 'Utilisateur créé avec succès ! ✨',

            'user' => $user

        ], 201);

    }



    // 🔄 MODIFIER un utilisateur (Étudiant ou Enseignant)

    public function updateUser(Request $request, $id)

    {

        $user = User::find($id);



        if (!$user) {

            return response()->json(['status' => 'error', 'message' => 'Utilisateur non trouvé'], 404);

        }



        // Validation dynamique des données (permet d'ignorer l'email actuel du même utilisateur)

        $request->validate([

            'name' => 'required|string|max:255',

            'email' => 'required|string|email|max:255|unique:users,email,' . $id,

            'password' => 'nullable|string|min:6', // Optionnel lors de la modification

            'role' => 'required|string|in:admin,enseignant,professeur,teacher,etudiant,student',

            'filiere_id' => 'nullable|exists:filieres,id',

            'filiere_ids' => 'nullable|array',

            'filiere_ids.*' => 'exists:filieres,id',

        ]);



        $role = $request->role;



        // Préparation des données de base

        $updateData = [

            'name' => $request->name,

            'email' => $request->email,

            'role' => $role,

            'filiere_id' => ($role === 'etudiant' || $role === 'student') ? $request->filiere_id : null,

        ];



        // Si l'admin a tapé un nouveau mot de passe, on le modifie

        if ($request->filled('password')) {

            $updateData['password'] = Hash::make($request->password);

        }



        // Mise à jour de l'utilisateur

        $user->update($updateData);



        // Gestion des filières selon le rôle

        if ($role === 'professeur' || $role === 'enseignant') {

            if ($request->has('filiere_ids')) {

                // Met à jour la table pivot

                $user->filieres()->sync($request->filiere_ids);

            }

        } else {

            // Si le rôle a changé (ex: prof devenu étudiant), on nettoie ses anciennes filières pivots

            $user->filieres()->detach();

        }



        // Recharger les relations mises à jour pour React

        $user->load(['filiere', 'filieres']);



        return response()->json([

            'status' => 'success',

            'message' => 'Utilisateur mis à jour avec succès ! 🔄',

            'user' => $user

        ], 200);

    }



    // ❌ SUPPRIMER un utilisateur

    public function deleteUser($id)

    {

        $user = User::find($id);



        if (!$user) {

            return response()->json(['status' => 'error', 'message' => 'Utilisateur non trouvé'], 404);

        }



        if ($user->id === auth()->id()) {

            return response()->json(['status' => 'error', 'message' => 'Vous ne pouvez pas supprimer votre propre compte'], 403);

        }



        // Détacher d'abord les filières si c'est un prof pour éviter les bugs de clés étrangères

        $user->filieres()->detach();

        $user->delete();



        return response()->json([

            'status' => 'success',

            'message' => 'Utilisateur supprimé avec succès !'

        ], 200);

    }





    // === 2. GESTION DES ABSENCES ===



    // ⚠️ SAISIR une absence pour un étudiant

    public function addAbsence(Request $request)

    {

        $request->validate([

            'etudiant_id' => 'required|exists:users,id',

            'module_id' => 'required|exists:modules,id',

            'date' => 'required|date',

            'justifie' => 'required|boolean',

        ]);



        $absence = Absence::create([

            'etudiant_id' => $request->etudiant_id,

            'module_id' => $request->module_id,

            'date' => $request->date,

            'justifie' => $request->justifie,

        ]);



        return response()->json([

            'status' => 'success',

            'message' => 'Absence enregistrée avec succès !',

            'absence' => $absence

        ], 201);

    }





    // === 3. TRAITEMENT DES ATTESTATIONS (AVEC FILTRE) ===



    // Voir toutes les demandes d'attestations (ou filtrées par filière de l'étudiant)

    public function getAttestationRequests(Request $request)

    {

        $query = Document::with(['user.filiere'])

            ->where('type', 'attestation');



        if ($request->has('filiere_id') && $request->filiere_id != '') {

            $query->whereHas('user', function($q) use ($request) {

                $q->where('filiere_id', $request->filiere_id);

            });

        }



        $requests = $query->orderBy('created_at', 'desc')->get();



        return response()->json([

            'status' => 'success',

            'requests' => $requests

        ], 200);

    }



    // 📄 UPLOADER l'attestation PDF demandée par l'étudiant

    public function uploadAttestation(Request $request, $documentId)

    {

        $request->validate([

            'fichier' => 'required|file|mimes:pdf|max:2048',

        ]);



        $document = Document::find($documentId);



        if (!$document) {

            return response()->json(['status' => 'error', 'message' => 'Demande introuvable'], 404);

        }



        if ($request->file('fichier')) {

            $path = $request->file('fichier')->store('attestations', 'public');

           

            $document->update([

                'fichier_path' => $path

            ]);



            return response()->json([

                'status' => 'success',

                'message' => 'Attestation envoyée à l\'étudiant avec succès ! 🚀',

                'document' => $document

            ], 200);

        }



        return response()->json(['status' => 'error', 'message' => 'Fichier manquant'], 400);

    }





    // === 4. RECUPERER LES FILIERES ===



    public function getFilieres()

    {

        $filieres = Filiere::all();

        return response()->json([

            'status' => 'success',

            'filieres' => $filieres

        ], 200);

    }

}