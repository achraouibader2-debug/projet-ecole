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
    Schema::create('filiere_user', function (Blueprint $table) {
        $table->id();
        // Lie la table filiere_user à la table users
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        // Lie la table filiere_user à la table filieres
        $table->foreignId('filiere_id')->constrained()->onDelete('cascade');
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('filiere_user');
    }
};
