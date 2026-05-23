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
    Schema::create('grades', function (Blueprint $table) {
        $table->id();
        $table->decimal('score', 4, 2); // Note sur 20 (ex: 15.50)
        $table->foreignId('student_id')->constrained('users')->onDelete('cascade'); // L'étudiant noté
        $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade'); // Le prof qui note
        $table->foreignId('filiere_id')->constrained()->onDelete('cascade'); // La filière
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};
