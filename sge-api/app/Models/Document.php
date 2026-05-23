<?php



namespace App\Models;



use Illuminate\Database\Eloquent\Model;



class Document extends Model

{

    protected $table = 'documents';



    // 🛠️ Synchronisé exactement avec tes colonnes en français

    protected $fillable = [

        'titre',

        'type',

        'fichier_path',

        'user_id',

        'module_id'

    ];



    // Relation : Un document appartient à un utilisateur (Étudiant, Prof ou Admin)

    public function user()

    {

        return $this->belongsTo(User::class, 'user_id');

    }



    // Relation : Un document peut être lié à un module (Optionnel, ex: pour les cours)

    public function module()

    {

        return $this->belongsTo(Module::class, 'module_id');

    }

}