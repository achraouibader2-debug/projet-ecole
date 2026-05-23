<?php



namespace App\Models;



use Illuminate\Database\Eloquent\Model;



class Message extends Model

{

    protected $table = 'messages';



    // 🛠️ Synchronisé exactement avec tes colonnes en français

    protected $fillable = [

        'expediteur_id',

        'destinataire_id',

        'contenu'

    ];



    // Relation : L'utilisateur qui a envoyé le message

    public function expediteur()

    {

        return $this->belongsTo(User::class, 'expediteur_id');

    }



    // Relation : L'utilisateur qui reçoit le message

    public function destinataire()

    {

        return $this->belongsTo(User::class, 'destinataire_id');

    }

} 