<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    // 🛠️ ON CHANGE ICI : On pointe vers la vraie table validée par ta migration
    protected $table = 'grades'; 

    // Autorise enfin Laravel à enregistrer ces colonnes
    protected $fillable = [
        'student_id',
        'teacher_id',
        'filiere_id',
        'score'
    ];
}