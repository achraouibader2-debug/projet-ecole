<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\Absence;
use App\Models\Message;
use App\Models\Document;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StudentController extends Controller
{
    // 1. Récupérer les Notes et les Absences de l'étudiant connecté
    public function getDashboardData()
    {
        $student = Auth::user();

        // Aligné sur ton modèle Grade : on cherche par 'student_id'
        $grades = Grade::where('student_id', $student->id)->get();

        // Aligné sur ta migration Absences : on cherche par 'etudiant_id'
        $absences = Absence::with('module')
            ->where('etudiant_id', $student->id)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'grades' => $grades,
                'absences' => $absences,
                'filiere_id' => $student->filiere_id
            ]
        ], 200);
    }

    // 2. Récupérer les profs de SA filière
    public function getMyTeachers()
    {
        $student = Auth::user();

        // 🛠️ Synchronisé avec les rôles acceptés dans l'application (enseignant, professeur, teacher)
        $teachers = User::whereIn('role', ['enseignant', 'professeur', 'teacher'])
            ->whereHas('filieres', function($query) use ($student) {
                $query->where('filieres.id', $student->filiere_id);
            })->get();

        return response()->json([
            'status' => 'success',
            'teachers' => $teachers
        ], 200);
    }

    // 3. Récupérer la discussion avec un prof spécifique
    public function getMessagesWithTeacher($teacherId)
    {
        $studentId = Auth::id();

        // 🧠 Charger avec les relations permet à React d'afficher les noms directement si besoin
        $messages = Message::with(['expediteur', 'destinataire'])
            ->where(function($q) use ($studentId, $teacherId) {
                $q->where('expediteur_id', $studentId)->where('destinataire_id', $teacherId);
            })
            ->orWhere(function($q) use ($studentId, $teacherId) {
                $q->where('expediteur_id', $teacherId)->where('destinataire_id', $studentId);
            })
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'messages' => $messages
        ], 200);
    }

    // 4. Envoyer un message à un prof
    public function sendMessageToTeacher(Request $request)
    {
        $request->validate([
            'destinataire_id' => 'required|exists:users,id',
            'contenu' => 'required|string',
        ]);

        $student = Auth::user();

        // 🔒 SÉCURITÉ : Vérifier que le prof destinataire appartient bien à sa filière
        $isTeacherValid = User::where('id', $request->destinataire_id)
            ->whereHas('filieres', function($query) use ($student) {
                $query->where('filieres.id', $student->filiere_id);
            })->exists();

        if (!$isTeacherValid) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ce professeur n\'enseigne pas dans votre filière.'
            ], 403);
        }

        $message = Message::create([
            'expediteur_id' => $student->id,
            'destinataire_id' => $request->destinataire_id,
            'contenu' => $request->contenu,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => $message->load(['expediteur', 'destinataire'])
        ], 201);
    }

    // 5. Demander une attestation de scolarité
    public function requestAttestation()
    {
        $document = Document::create([
            'titre' => 'Demande d\'attestation de scolarité - ' . Auth::user()->name,
            'type' => 'attestation',
            'fichier_path' => 'en_attente', 
            'user_id' => Auth::id(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Demande d\'attestation envoyée avec succès ! 📄',
            'document' => $document
        ], 201);
    }

    // 6. Voir ses documents (Attestations et Emploi du temps de sa filière)
    public function getMyDocuments()
    {
        $student = Auth::user();

        $documents = Document::where('user_id', $student->id)
            ->orWhere(function($q) {
                $q->where('type', 'emploi_du_temps');
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'documents' => $documents
        ], 200);
    }
}