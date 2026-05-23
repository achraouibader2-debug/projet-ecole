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
    Schema::create('courses', function (Blueprint $table) {
        $table->id();
        $table->string('title');
        $table->text('description')->nullable();
        $table->string('file_path')->nullable(); // Lien ou chemin du fichier PDF
        $table->foreignId('filiere_id')->constrained()->onDelete('cascade'); // La filière visée
        $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Le prof qui a créé le cours
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
