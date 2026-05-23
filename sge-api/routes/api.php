<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\FiliereController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Si une requête non authentifiée tente d'appeler une route protégée
Route::get('/login', function () {
    return response()->json(['message' => 'Non authentifié. Token manquant ou invalide.'], 401);
})->name('login');

// Route publique de connexion
Route::post('/login', [AuthController::class, 'login']);

// 🔒 TOUTES LES ROUTES PROTÉGÉES (Nécessitent un Token valide)
Route::middleware('auth:sanctum')->group(function () {
    
    // --- AUTHENTIFICATION & PROFIL ---
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // --- 👥 ESPACE ADMINISTRATEUR ---
    // Gestion des Utilisateurs
    Route::get('/admin/users', [AdminController::class, 'getUsers']);
    Route::post('/admin/users', [AdminController::class, 'createUser']);
    Route::delete('/admin/users/{id}', [AdminController::class, 'deleteUser']);

    // Gestion des Filières
    Route::get('/admin/filieres', [FiliereController::class, 'index']);
    Route::post('/admin/filieres', [FiliereController::class, 'store']);

    // Gestion des Absences
    Route::post('/admin/absences', [AdminController::class, 'addAbsence']);

    // Traitement des Attestations
    Route::get('/admin/attestations', [AdminController::class, 'getAttestationRequests']);
    Route::post('/admin/attestations/{id}/upload', [AdminController::class, 'uploadAttestation']);


    // --- 👨‍🏫 ESPACE ENSEIGNANT (PROFESSEUR) ---
    Route::prefix('teacher')->group(function () {
        Route::get('/filieres', [TeacherController::class, 'getMyFilieres']);
        Route::get('/filieres/{filiere}/students', [TeacherController::class, 'getStudentsByFiliere']);
        Route::post('/courses', [TeacherController::class, 'addCourse']);
        Route::post('/grades', [TeacherController::class, 'saveGrade']);
        
        // Messagerie Enseignant
        Route::get('/filieres/{filiere}/messages', [TeacherController::class, 'getMessages']); // Questions des étudiants de sa filière
        Route::put('/messages/{id}/reply', [TeacherController::class, 'replyMessage']);      // Répondre à une question
    });


    // --- 🎓 ESPACE ÉTUDIANT ---
    Route::prefix('student')->group(function () {
        // Consultations générales (Notes, absences, documents)
        Route::get('/dashboard', [StudentController::class, 'getDashboardData']);
        Route::get('/documents', [StudentController::class, 'getMyDocuments']);
        Route::post('/attestation/request', [StudentController::class, 'requestAttestation']);
        
        // Messagerie Étudiant
        Route::get('/teachers', [StudentController::class, 'getMyTeachers']);                     // Trouver les profs de sa filière
        Route::get('/messages/{teacherId}', [StudentController::class, 'getMessagesWithTeacher']); // Historique avec un prof spécifique
        Route::post('/messages', [StudentController::class, 'sendMessageToTeacher']);             // Poser une question à un prof
    });

});