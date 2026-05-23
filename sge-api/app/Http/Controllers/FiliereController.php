<?php

namespace App\Http\Controllers;

use App\Models\Filiere;
use Illuminate\Http\Request;

class FiliereController extends Controller
{
    // 1. Récupérer toutes les filières pour les afficher dans le tableau React
    public function index()
    {
        return response()->json(Filiere::orderBy('code')->get(), 200);
    }

    // 2. Enregistrer une nouvelle filière depuis le formulaire React
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:10|unique:filieres',
            'nom' => 'required|string|max:255',
        ]);

        $filiere = Filiere::create($validated);

        return response()->json($filiere, 201);
    }
}