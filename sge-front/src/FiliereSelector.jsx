import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FiliereSelector = ({ selectedFiliere, setSelectedFiliere }) => {
  const [filieres, setFilieres] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Récupération des filières via la route existante
    const token = localStorage.getItem('token'); // Ajuste si tu stockes ton token ailleurs
    
    axios.get('http://localhost:8000/api/admin/filieres', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      // Si ton FiliereController renvoie un objet avec une clé 'filieres'
      const data = res.data.filieres || res.data;
      setFilieres(Array.isArray(data) ? data : []);
    })
    .catch(err => {
      console.error("Erreur lors du chargement des filières", err);
      setError('Impossible de charger les filières');
    });
  }, []);

  return (
    <div style={{ marginBottom: '20px' }}>
      <label htmlFor="filiere-select" style={{ marginRight: '10px', fontWeight: 'bold', color: '#333' }}>
        Filtrer par Filière :
      </label>
      <select
        id="filiere-select"
        value={selectedFiliere}
        onChange={(e) => setSelectedFiliere(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          backgroundColor: '#white',
          width: '250px',
          cursor: 'pointer'
        }}
      >
        <option value="">-- Toutes les filières --</option>
        {filieres.map(filiere => (
          <option key={filiere.id} value={filiere.id}>
            {filiere.nom || filiere.name}
          </option>
        ))}
      </select>
      {error && <span style={{ color: 'red', marginLeft: '10px', fontSize: '14px' }}>{error}</span>}
    </div>
  );
};

export default FiliereSelector;