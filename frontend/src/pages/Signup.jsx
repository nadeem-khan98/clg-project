import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Lock, Activity, Target, Shield, Heart } from 'lucide-react';

const DISEASES = ['Diabetes', 'Heart Disease', 'Hypertension', 'Celiac Disease', 'High Cholesterol'];
const ACTIVITY_LEVELS = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'];
const GOALS = ['Weight Loss', 'Muscle Gain', 'Maintain Weight'];

const Signup = () => {
  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [form, setForm] = useState({
    name: '', email: '', password: '', age: '', gender: '',
    height: '', weight: '', activityLevel: '', goal: '',
    diseases: []
  });

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    if (!form.password) e.password = 'Required';
    if (!form.age) e.age = 'Required';
    if (!form.gender) e.gender = 'Required';
    if (!form.height) e.height = 'Required';
    if (!form.weight) e.weight = 'Required';
    if (!form.activityLevel) e.activityLevel = 'Required';
    if (!form.goal) e.goal = 'Required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...form, diseases: form.diseases.length ? form.diseases : ['None'] };
      await signup(payload);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setGlobalError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper fade-in" style={{ padding: '40px 16px' }}>
      <div className="glass-panel auth-card" style={{ maxWidth: '500px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '64px', height: '64px', background: 'rgba(34, 197, 94, 0.1)', 
            borderRadius: '16px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', margin: '0 auto 16px', color: 'var(--accent-neon)' 
          }}>
            <Heart size={32} />
          </div>
          <h2 className="gradient-text">Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Join the AI Diet Coach community</p>
        </div>

        {globalError && (
          <div className="glass-card" style={{ marginBottom: '24px', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="input-group" style={{ gridColumn: 'span 2', marginBottom: '0' }}>
              <label className="label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                <input className="input" style={{ paddingLeft: '40px' }} name="name" placeholder="John Doe" value={form.name} onChange={handleChange} required />
              </div>
            </div>

            <div className="input-group" style={{ gridColumn: 'span 2', marginBottom: '0' }}>
              <label className="label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                <input className="input" style={{ paddingLeft: '40px' }} name="email" type="email" placeholder="john@example.com" value={form.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="input-group" style={{ gridColumn: 'span 2', marginBottom: '0' }}>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                <input className="input" style={{ paddingLeft: '40px' }} name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '0' }}>
              <label className="label">Age</label>
              <input className="input" name="age" type="number" placeholder="25" value={form.age} onChange={handleChange} required />
            </div>

            <div className="input-group" style={{ marginBottom: '0' }}>
              <label className="label">Gender</label>
              <select className="select" name="gender" value={form.gender} onChange={handleChange} required>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: '0' }}>
              <label className="label">Weight (kg)</label>
              <input className="input" name="weight" type="number" placeholder="70" value={form.weight} onChange={handleChange} required />
            </div>

            <div className="input-group" style={{ marginBottom: '0' }}>
              <label className="label">Height (cm)</label>
              <input className="input" name="height" type="number" placeholder="175" value={form.height} onChange={handleChange} required />
            </div>

            <div className="input-group" style={{ gridColumn: 'span 2', marginBottom: '0' }}>
              <label className="label">Activity Level</label>
              <select className="select" name="activityLevel" value={form.activityLevel} onChange={handleChange} required>
                <option value="">Select Level</option>
                {ACTIVITY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="input-group" style={{ gridColumn: 'span 2', marginBottom: '0' }}>
              <label className="label">Health Goal</label>
              <select className="select" name="goal" value={form.goal} onChange={handleChange} required>
                <option value="">Select Goal</option>
                {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={14} /> Health Conditions (Optional)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {DISEASES.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForm(prev => ({
                    ...prev,
                    diseases: prev.diseases.includes(d) ? prev.diseases.filter(item => item !== d) : [...prev.diseases, d]
                  }))}
                  style={{
                    padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)',
                    background: form.diseases.includes(d) ? 'rgba(34, 197, 94, 0.1)' : 'var(--glass-highlight)',
                    color: form.diseases.includes(d) ? 'var(--accent-neon)' : 'var(--text-secondary)',
                    fontSize: '0.75rem', cursor: 'pointer', transition: 'var(--transition-smooth)'
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={isSubmitting} style={{ width: '100%' }}>
            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-neon)', fontWeight: 600 }}>Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
