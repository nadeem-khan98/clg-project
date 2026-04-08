import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    weight: '', height: '', age: '', activityLevel: '', goal: '', diseases: [], name: '', email: '', gender: ''
  });

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/profile');
      setProfile(data);
      setFormData({
        weight: data.weight || '',
        height: data.height || '',
        age: data.age || '',
        activityLevel: data.activityLevel || '',
        goal: data.goal || '',
        diseases: data.diseases || [],
        name: data.name || '',
        email: data.email || '',
        gender: data.gender || ''
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (e) => {
    const { options } = e.target;
    const selected = [];
    for (const option of options) {
      if (option.selected) selected.push(option.value);
    }
    setFormData(prev => ({ ...prev, diseases: selected }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/auth/update-profile', formData);
      setProfile(data);
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

  if (loading) return <div className="dashboard-container" style={{ textAlign: 'center', marginTop: '40px' }}>Loading profile...</div>;

  return (
    <div className="dashboard-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="glass-panel">
        <h2 style={{ marginBottom: '24px' }}>Profile Settings</h2>
        
        {message && <div style={{ color: 'var(--accent-color)', marginBottom: '16px', padding: '12px', border: '1px solid var(--accent-color)', borderRadius: '8px' }}>{message}</div>}

        {!isEditing ? (
          <div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li><strong style={{ color: 'var(--text-muted)' }}>Name:</strong> {profile.name}</li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Email:</strong> {profile.email}</li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Age:</strong> {profile.age} years</li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Gender:</strong> {profile.gender}</li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Weight:</strong> {profile.weight} kg</li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Height:</strong> {profile.height} cm</li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Activity Level:</strong> {profile.activityLevel}</li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Diet Goal:</strong> {profile.goal}</li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Conditions:</strong> {profile.diseases?.length > 0 ? profile.diseases.join(', ') : 'None selected'}</li>
            </ul>
            <button className="btn" style={{ marginTop: '24px', width: '100%' }} onClick={() => setIsEditing(true)}>Edit Profile</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Name</label>
                <input type="text" name="name" className="input" value={formData.name} onChange={handleChange} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Email</label>
                <input type="email" name="email" className="input" value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Age</label>
                <input type="number" name="age" className="input" value={formData.age} onChange={handleChange} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Weight (kg)</label>
                <input type="number" name="weight" className="input" value={formData.weight} onChange={handleChange} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Height (cm)</label>
                <input type="number" name="height" className="input" value={formData.height} onChange={handleChange} required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Gender</label>
              <select name="gender" className="select" value={formData.gender} onChange={handleChange} required>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Goal</label>
              <select name="goal" className="select" value={formData.goal} onChange={handleChange}>
                <option value="Weight Loss">Weight Loss</option>
                <option value="Maintain Weight">Maintain Weight</option>
                <option value="Muscle Gain">Muscle Gain</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Activity Level</label>
              <select name="activityLevel" className="select" value={formData.activityLevel} onChange={handleChange}>
                <option value="Sedentary">Sedentary</option>
                <option value="Lightly Active">Lightly Active</option>
                <option value="Moderately Active">Moderately Active</option>
                <option value="Very Active">Very Active</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Conditions</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '8px 0' }}>
                {['Diabetes', 'Heart Disease', 'Hypertension', 'High Cholesterol'].map(disease => (
                  <label key={disease} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                    <input 
                      type="checkbox" 
                      style={{ transform: 'scale(1.2)' }}
                      checked={formData.diseases.includes(disease)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, diseases: [...prev.diseases, disease] }));
                        } else {
                          setFormData(prev => ({ ...prev, diseases: prev.diseases.filter(d => d !== disease) }));
                        }
                      }}
                    />
                    <span>{disease}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <button type="submit" className="btn" style={{ flex: 1 }}>Save Changes</button>
              <button type="button" className="btn" style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--text-color)' }} onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
