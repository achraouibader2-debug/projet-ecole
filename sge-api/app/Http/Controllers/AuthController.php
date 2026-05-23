<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Gère la connexion des utilisateurs (Admin, Prof, Étudiant)
     */
    public function login(Request $request)
    {
        // 1. Validation des données reçues depuis React
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // 2. Recherche de l'utilisateur par son email
        $user = User::where('email', $request->email)->first();

        // 3. Vérification de l'utilisateur et du mot de passe
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Les identifiants sont incorrects.'
            ], 401);
        }

        // 4. Génération du Token de sécurité Sanctum
        $token = $user->createToken('auth_token')->plainTextToken;

        // 5. On renvoie la réponse à React avec les infos importantes
        return response()->json([
            'message' => 'Connexion réussie',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role // Permettra à React de savoir quoi afficher
            ]
        ], 200);
    }

    /**
     * Gère la déconnexion (Suppression du token)
     */
    public function logout(Request $request)
    {
        // Révoque (supprime) le token actuel de l'utilisateur
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie'
        ], 200);
    }
}