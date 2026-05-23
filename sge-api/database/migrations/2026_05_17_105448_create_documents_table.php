<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('titre');
            $table->enum('type', ['cours', 'emploi_du_temps', 'certificat_medical', 'attestation']);
            
            // 1. AJOUT DU STATUT : Initialisé automatiquement à "En attente"
            $table->string('status')->default('En attente'); 
            
            // 2. MODIFICATION ICI : ->nullable() est obligatoire car au moment de la demande de l'étudiant, il n'y a pas encore de PDF !
            $table->string('fichier_path')->nullable(); 
            
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); 
            $table->foreignId('module_id')->nullable()->constrained('modules')->onDelete('cascade'); 
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};