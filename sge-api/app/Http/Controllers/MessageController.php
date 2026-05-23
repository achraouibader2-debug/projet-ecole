<?php



namespace App\Http\Controllers;



use App\Models\Message; // Assure-toi que c'est le bon nom de ton modèle

use App\Models\User;

use Illuminate\Http\Request;



class MessageController extends Controller

{

    /**

     * 🎓 POUR L'ÉTUDIANT : Lister les profs de SA filière

     */

    public function getProfesseursPourEtudiant()

    {

        $etudiant = auth()->user();



        // Sécurité : On vérifie que c'est bien un étudiant qui demande

        if ($etudiant->role !== 'etudiant') {

            return response()->json(['message' => 'Accès refusé'], 403);

        }



        // On cherche les profs qui ont la filière de l'étudiant dans leur table pivot

        $filiereId = $etudiant->filiere_id;

        $professeurs = User::whereIn('role', ['professeur', 'enseignant'])

            ->whereHas('filieres', function ($query) use ($filiereId) {

                $query->where('filieres.id', $filiereId);

            })->get();



        return response()->json([

            'status' => 'success',

            'professeurs' => $professeurs

        ]);

    }



    /**

     * 👨‍🏫 POUR LE PROFESSEUR : Lister les étudiants de SES filières qui lui ont écrit

     */

    public function getEtudiantsPourProfesseur()

    {

        $prof = auth()->user();



        if (!in_array($prof->role, ['professeur', 'enseignant'])) {

            return response()->json(['message' => 'Accès refusé'], 403);

        }



        // On récupère les IDs des étudiants qui ont envoyé un message à CE prof

        $studentIds = Message::where('receiver_id', $prof->id)

            ->pluck('sender_id')

            ->unique();



        $etudiants = User::whereIn('id', $studentIds)

            ->with('filiere')

            ->get();



        return response()->json([

            'status' => 'success',

            'etudiants' => $etudiants

        ]);

    }



    /**

     * 💬 COMMUN : Récupérer la conversation entre l'utilisateur connecté et un autre

     */

    public function getConversation($contactId)

    {

        $authId = auth()->id();



        // Récupère l'historique des échanges entre l'utilisateur connecté et le contact sélectionné

        $messages = Message::where(function($q) use ($authId, $contactId) {

                $q->where('sender_id', $authId)->where('receiver_id', $contactId);

            })

            ->orWhere(function($q) use ($authId, $contactId) {

                $q->where('sender_id', $contactId)->where('receiver_id', $authId);

            })

            ->orderBy('created_at', 'asc')

            ->get();



        return response()->json([

            'status' => 'success',

            'messages' => $messages

        ]);

    }



    /**

     * ✉️ COMMUN : Envoyer un message

     */

    public function sendMessage(Request $request)

    {

        $request->validate([

            'receiver_id' => 'required|exists:users,id',

            'contenu' => 'required|string', // Remplace 'contenu' par le nom exact de ta colonne (ex: text, message)

        ]);



        $message = Message::create([

            'sender_id' => auth()->id(),

            'receiver_id' => $request->receiver_id,

            'contenu' => $request->contenu, // Ajuste le nom ici aussi si nécessaire

        ]);



        return response()->json([

            'status' => 'success',

            'message' => $message

        ], 201);

    }

}