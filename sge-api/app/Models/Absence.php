<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Absence extends Model
{
    // On s'assure que Laravel utilise bien le bon nom de table
    protected $table = 'absences';

    // 🛠️ On adapte les colonnes fillable selon TA migration
    protected $fillable = [
        'etudiant_id',
        'module_id',
        'date',
        'justifie'
    ];

    // Relation : L'absence appartient à un étudiant (User)
    public function etudiant()
    {
        return $this->belongsTo(User::class, 'etudiant_id');
    }

    // Relation : L'absence concerne un module (Matière)
    public function module()
    {
        return $this->belongsTo(Module::class, 'module_id');
    }
}