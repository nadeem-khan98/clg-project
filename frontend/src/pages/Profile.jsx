import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import {
  User,
  Settings,
  Save,
  X,
  Activity,
  Target,
  Shield,
  Ruler,
  Weight,
  Calendar,
  Zap,
  ChevronRight,
  LogOut
} from 'lucide-react';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user: authUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    weight: '', height: '', age: '', activityLevel: '', goal: '', diseases: [], name: '', email: '', gender: ''
  });

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/me');
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <Layout><div className="fade-in">Loading profile...</div></Layout>;

  return (
    <Layout>
      <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header style={{ marginBottom: '32px' }}>
          <h1 className="gradient-text">Profile Settings</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Configure your physical metrics and targets.</p>
        </header>

        {message && (
          <div className="glass-card fade-in" style={{ marginBottom: '24px', borderColor: 'var(--accent-neon)', color: 'var(--accent-neon)', padding: '16px' }}>
            {message}
          </div>
        )}

        <div className="glass-panel profile-panel">

          {/* Header Section */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-neon) 0%, var(--secondary-blue) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 8px 16px rgba(34, 197, 94, 0.2)'
              }}>
                <User size={36} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{profile.name}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>{profile.email}</p>
                <div style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '20px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--accent-neon)', fontSize: '0.75rem', fontWeight: 600 }}>
                  {profile.goal}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {!isEditing ? (
                <>
                  <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                    <Settings size={18} /> Edit Profile
                  </button>
                  <button className="btn btn-ghost" onClick={handleLogout} style={{ border: 'none', color: 'var(--danger)' }}>
                    <LogOut size={18} />
                  </button>
                </>
              ) : (
                <button className="btn btn-ghost" onClick={() => setIsEditing(false)}>
                  <X size={18} /> Cancel
                </button>
              )}
            </div>
          </div>

          {!isEditing ? (
            <div className="profile-metrics-grid">

              {/* Biometrics Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <SectionHeader title="Physical Metrics" icon={<Activity size={18} />} />
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <ProfileItem icon={<Calendar size={18} />} label="Age" value={`${profile.age} yrs`} color="#3b82f6" />
                  <Divider />
                  <ProfileItem icon={<User size={18} />} label="Gender" value={profile.gender} color="#a855f7" />
                  <Divider />
                  <ProfileItem icon={<Weight size={18} />} label="Current Weight" value={`${profile.weight} kg`} color="#22c55e" />
                  <Divider />
                  <ProfileItem icon={<Ruler size={18} />} label="Height" value={`${profile.height} cm`} color="#f59e0b" />
                </div>
              </div>

              {/* Preferences Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <SectionHeader title="Goals & Activity" icon={<Target size={18} />} />
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <ProfileItem icon={<Zap size={18} />} label="Activity Level" value={profile.activityLevel} color="#6366f1" />
                  <Divider />
                  <ProfileItem icon={<Target size={18} />} label="Main Goal" value={profile.goal} color="#ec4899" />
                  <Divider />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
                      <Shield size={18} style={{ color: '#ef4444' }} />
                      <span style={{ fontSize: '0.85rem' }}>Health Conditions</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingLeft: '30px' }}>
                      {profile.diseases?.length > 0 ? profile.diseases.map(d => (
                        <span key={d} style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                          {d}
                        </span>
                      )) : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None recorded</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Account Actions (Desktop) */}
              <div className="grid-span-full" style={{ marginTop: '12px' }}>
                <button className="glass-card" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', cursor: 'default' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Shield size={18} className="text-secondary-blue" />
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Data Privacy
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Your health data is encrypted and secure.
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-muted" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="fade-in">
              <div className="profile-form-grid">
                <InputGroup label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
                <InputGroup label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required />
                <InputGroup label="Age" name="age" type="number" value={formData.age} onChange={handleChange} required />
                <div className="input-field">
                  <label className="label">Gender</label>
                  <select name="gender" className="select" value={formData.gender} onChange={handleChange} required>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <InputGroup label="Weight (kg)" name="weight" type="number" value={formData.weight} onChange={handleChange} required />
                <InputGroup label="Height (cm)" name="height" type="number" value={formData.height} onChange={handleChange} required />
                <div className="input-field">
                  <label className="label">Activity Level</label>
                  <select name="activityLevel" className="select" value={formData.activityLevel} onChange={handleChange}>
                    <option value="Sedentary">Sedentary</option>
                    <option value="Lightly Active">Lightly Active</option>
                    <option value="Moderately Active">Moderately Active</option>
                    <option value="Very Active">Very Active</option>
                  </select>
                </div>
                <div className="input-field">
                  <label className="label">Diet Goal</label>
                  <select name="goal" className="select" value={formData.goal} onChange={handleChange}>
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Maintain Weight">Maintain Weight</option>
                    <option value="Muscle Gain">Muscle Gain</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Shield size={16} /> Health Conditions (Check all that apply)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {['Diabetes', 'Heart Disease', 'Hypertension', 'High Cholesterol'].map(disease => (
                    <label key={disease} className="glass-card" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      padding: '12px 20px',
                      background: formData.diseases.includes(disease) ? 'rgba(34, 197, 94, 0.1)' : 'var(--glass-highlight)',
                      borderColor: formData.diseases.includes(disease) ? 'var(--accent-neon)' : 'var(--glass-border)',
                      borderRadius: '16px'
                    }}>
                      <input
                        type="checkbox"
                        style={{ display: 'none' }}
                        checked={formData.diseases.includes(disease)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, diseases: [...prev.diseases, disease] }));
                          } else {
                            setFormData(prev => ({ ...prev, diseases: prev.diseases.filter(d => d !== disease) }));
                          }
                        }}
                      />
                      <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: formData.diseases.includes(disease) ? 'var(--accent-neon)' : 'var(--text-secondary)'
                      }}>
                        {disease}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '16px' }}>
                  <Save size={20} /> Save Changes
                </button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
};

const SectionHeader = ({ title, icon }) => (
  <h4 style={{
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 700,
    marginBottom: '8px'
  }}>
    {icon} {title}
  </h4>
);

const ProfileItem = ({ icon, label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ color }}>{icon}</div>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{label}</span>
    </div>
    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{value}</span>
  </div>
);

const InputGroup = ({ label, ...props }) => (
  <div className="input-field">
    <label className="label">{label}</label>
    <input className="input" {...props} />
  </div>
);

const Divider = () => (
  <div style={{ height: '1px', background: 'var(--glass-border)', opacity: 0.5 }} />
);

export default Profile;
