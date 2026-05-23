<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Filiere extends Model
{
    use HasFactory;

    // On autorise Laravel à remplir le code et le nom
    protected $fillable = ['code', 'nom'];
}