<?php



namespace App\Http\Controllers;



use App\Models\Course;

use App\Models\Grade;

use App\Models\Message;

use App\Models\User;

use App\Models\Filiere;

use Illuminate\Http\Request;

use Illuminate\Support\Facades\Auth;



class TeacherController extends Controller

{

    // 1. Récupérer les filières attribuées au professeur connecté

    public function getMyFilieres()

    {

        $teacher = Auth::user();

        return response()->json($teacher->filieres, 200);

    }



    // 2. Récupérer uniquement les étudiants d'une filière spécifique avec leurs notes

    public function getStudentsByFiliere($filiere)

    {

        try {

            // 1. Récupération des étudiants

            $students = User::where('role', 'etudiant')

                            ->where('filiere_id', $filiere)

                            ->get();



            // 2. Récupération des notes

            foreach ($students as $student) {

                $grade = Grade::where('student_id', $student->id)

                              ->where('teacher_id', Auth::id())

                              ->where('filiere_id', $filiere)

                              ->first();

               

                $student->current_grade = $grade ? $grade->score : null;

            }



            return response()->json($students, 200);



        } catch (\Exception $e) {

            return response()->json([

                'status' => 'error',

                'message' => 'Une erreur est survenue dans le code PHP ou SQL.',

                'error_details' => $e->getMessage()

            ], 500);

        }

    }



    // 3. Poser ou modifier la note d'un étudiant

    public function saveGrade(Request $request)

    {

        $validated = $request->validate([

            'student_id' => 'required|exists:users,id',

            'filiere_id' => 'required|exists:filieres,id',

            'score' => 'required|numeric|min:0|max:20',

        ]);



        $grade = Grade::updateOrCreate(

            [

                'student_id' => $validated['student_id'],

                'teacher_id' => Auth::id(),

                'filiere_id' => $validated['filiere_id'],

            ],

            [

                'score' => $validated['score']

            ]

        );



        return response()->json(['message' => 'Note enregistrée ! 📝', 'grade' => $grade], 200);

    }



    // 4. Déposer un nouveau support de cours

    public function addCourse(Request $request)

    {

        $validated = $request->validate([

            'title' => 'required|string|max:255',

            'description' => 'nullable|string',

            'filiere_id' => 'required|exists:filieres,id',

            'file_path' => 'nullable|string',

        ]);



        $course = Course::create([

            'title' => $validated['title'],

            'description' => $validated['description'],

            'file_path' => $validated['file_path'],

            'filiere_id' => $validated['filiere_id'],

            'user_id' => Auth::id(),

        ]);



        return response()->json(['message' => 'Cours publié avec succès ! 📚', 'course' => $course], 201);

    }



    // 5. Voir les questions posées par les étudiants d'une filière spécifique

    public function getMessages($filiereId)

    {

        $teacherId = Auth::id();



        // On récupère les messages reçus par ce prof, dont l'expéditeur appartient à la filière demandée

        $messages = Message::with(['expediteur'])

            ->where('destinataire_id', $teacherId)

            ->whereHas('expediteur', function($query) use ($filiereId) {

                $query->where('filiere_id', $filiereId);

            })

            ->orderBy('created_at', 'desc')

            ->get();



        return response()->json($messages, 200);

    }



    // 6. Répondre à la question d'un étudiant (Création d'un nouveau message croisé)

    public function replyMessage(Request $request, $id)

    {

        $validated = $request->validate([

            'contenu' => 'required|string', // Aligné sur ta colonne 'contenu'

        ]);



        // Trouver le message d'origine envoyé par l'étudiant

        $messageInitial = Message::findOrFail($id);



        // Sécurité : s'assurer que ce message était bien destiné au professeur connecté

        if ($messageInitial->destinataire_id !== Auth::id()) {

            return response()->json(['message' => 'Action non autorisée.'], 403);

        }



        // Pour répondre, on crée un NOUVEAU message :

        // Le prof devient l'expéditeur, l'étudiant devient le destinataire.

        $reponse = Message::create([

            'expediteur_id' => Auth::id(),

            'destinataire_id' => $messageInitial->expediteur_id,

            'contenu' => $validated['contenu']

        ]);



        return response()->json([

            'message' => 'Réponse envoyée ! 💬',

            'data' => $reponse->load(['expediteur', 'destinataire'])

        ], 200);

    }

}