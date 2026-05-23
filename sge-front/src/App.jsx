import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import StudentDashboard from "./StudentDashboard"; // ✅ Ton vrai composant complet
import TeacherDashboard from './TeacherDashboard';
import AdminDashboard from './AdminDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Route publique */}
        <Route path="/login" element={<Login />} />
        
        {/* Espace Étudiant (Pointé sur ton vrai tableau de bord) */}
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/student" element={<Navigate to="/student-dashboard" replace />} />
        
        {/* Espace Enseignant (Professeur) */}
        <Route path="/prof" element={<TeacherDashboard />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        
        {/* Espace Administrateur */}
        <Route path="/admin" element={<AdminDashboard />} /> 
        
        {/* Redirection automatique par défaut si la route n'existe pas */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}