<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'filiere_id', // ⚡ TRÈS IMPORTANT : Permet à Laravel d'enregistrer la filière de l'étudiant
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * 🎓 RELATION 1-TO-MANY (Pour l'Étudiant)
     * Un étudiant appartient à une seule filière.
     */
    public function filiere()
    {
        return $this->belongsTo(Filiere::class, 'filiere_id');
    }

    /**
     * 📚 RELATION MANY-TO-MANY (Pour le Professeur)
     * Un enseignant peut être affecté à plusieurs filières via la table pivot.
     */
    public function filieres()
    {
        return $this->belongsToMany(Filiere::class, 'filiere_user', 'user_id', 'filiere_id');
    }
}