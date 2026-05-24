# Projet École — Système de Gestion Scolaire (SGE)

Une plateforme centralisée pour améliorer la communication et la gestion académique entre les différents acteurs de l'établissement.

---

## Description

Le SGE est une application web complète qui permet de gérer les relations entre trois types d'utilisateurs : **Administrateur**, **Professeur** et **Étudiant**. Elle centralise la gestion des membres, des filières, des notes, des absences, des cours et de la communication interne.

---

## Technologies utilisées

### Frontend
- **React.js** — Interface utilisateur
- **Vite** — Bundler et serveur de développement
- **CSS** — Mise en forme et responsive design

### Backend
- **Laravel (PHP)** — API RESTful
- **MySQL** — Base de données

---

## Installation et lancement du projet

### Prérequis
- Node.js (v18+)
- PHP (v8.1+)
- Composer
- MySQL

---

### 1. Cloner le dépôt

```bash
git clone https://github.com/achraouibader2-debug/projet-ecole.git
cd projet-ecole
```

---

### 2. Lancer le Backend (API Laravel)

```bash
cd sge-api
composer install
cp .env.example .env
php artisan key:generate
```

Configurer la base de données dans le fichier `.env` :

```
DB_DATABASE=projet_ecole
DB_USERNAME=root
DB_PASSWORD=
```

Puis :

```bash
php artisan migrate
php artisan serve
```

> L'API sera accessible sur : `http://localhost:8000`

---

### 3. Lancer le Frontend (React)

```bash
cd sge-front
npm install
npm run dev
```

> L'application sera accessible sur : `http://localhost:5173`

---

## Rôles et fonctionnalités

### Administrateur
- Créer, modifier et supprimer des membres (professeurs et étudiants)
- Gérer les filières (ajout, modification, suppression)
- Voir la liste des étudiants par filière
- Recevoir et traiter les demandes d'attestation des étudiants
- Saisir et modifier le nombre d'absences pour chaque étudiant

### Professeur
- Consulter la liste de ses étudiants
- Saisir et modifier les notes des étudiants
- Déposer des cours pour les étudiants
- Recevoir et répondre aux questions des étudiants

### Etudiant
- Consulter ses notes
- Consulter son nombre d'absences
- Envoyer des messages/questions au professeur
- Faire une demande d'attestation à l'administration
- Consulter les cours déposés par le professeur

---

## Structure du projet

```
projet-ecole/
├── sge-api/        # Backend Laravel (API REST)
└── sge-front/      # Frontend React
```

---

## Auteurs

Projet réalisé dans le cadre d'un projet scolaire.
