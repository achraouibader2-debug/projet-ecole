<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Crée automatiquement le compte Admin s'il n'existe pas
        User::create([
            'name' => 'Bader Admin',
            'email' => 'admin@ensa.ma',
            'password' => Hash::make('admin1234'), // <-- Ton mot de passe sera : admin1234
            'role' => 'admin',
        ]);
    }
}