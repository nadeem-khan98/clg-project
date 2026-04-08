import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const DISEASES = ['Diabetes', 'Heart Disease', 'Hypertension', 'Celiac Disease', 'High Cholesterol'];
const ACTIVITY_LEVELS = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'];
const GOALS = ['Weight Loss', 'Muscle Gain', 'Maintain Weight'];

// ── Defined OUTSIDE Signup so React never re-creates it on re-render ──
// If placed inside, every keystroke causes React to unmount + remount it,
// which kills focus on the active input.
const FieldWrapper = ({ children, label, required, error, span }) => (
  <div className={`form-field${span ? ' form-field--span' : ''}`}>
    <label className="form-label">
      {label}{required && <span className="required-star"> *</span>}
    </label>
    {children}
    {error && <p className="field-error">{error}</p>}
  </div>
);

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
  const [diseasesOpen, setDiseasesOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const diseasesRef = useRef(null);

  // Close diseases dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (diseasesRef.current && !diseasesRef.current.contains(e.target)) {
        setDiseasesOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDiseaseToggle = (disease) => {
    setForm(prev => ({
      ...prev,
      diseases: prev.diseases.includes(disease)
        ? prev.diseases.filter(d => d !== disease)
        : [...prev.diseases, disease],
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())       e.name = 'Full name is required';
    if (!form.email.trim())      e.email = 'Email is required';
    if (!form.password)          e.password = 'Password is required';
    if (!form.age)               e.age = 'Age is required';
    if (!form.gender)            e.gender = 'Please select a gender';
    if (!form.height)            e.height = 'Height is required';
    if (!form.weight)            e.weight = 'Weight is required';
    if (!form.activityLevel)     e.activityLevel = 'Please select an activity level';
    if (!form.goal)              e.goal = 'Please select a goal';
    return e;
  };

  const isFormValid =
    form.name.trim() && form.email.trim() && form.password &&
    form.age && form.gender && form.height && form.weight &&
    form.activityLevel && form.goal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstKey = Object.keys(validationErrors)[0];
      const el = formRef.current?.querySelector(`[name="${firstKey}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  const inputClass = (name) =>
    `input${errors[name] ? ' input--error' : ''}`;

  const selectClass = (name) =>
    `select${errors[name] ? ' input--error' : ''}${!form[name] ? ' select--placeholder' : ''}`;

  return (
    <div className="signup-page">
      <div className="auth-container glass-panel signup-panel">
        {/* Header */}
        <div className="signup-header">
          <div className="signup-icon">🥗</div>
          <h2>Create Your Account</h2>
          <p className="signup-subtitle">Start your personalized diet journey</p>
        </div>

        {globalError && (
          <div className="warning-box" role="alert">
            <span>⚠️</span> {globalError}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            {/* Full Name */}
            <FieldWrapper label="Full Name" required error={errors.name}>
              <input
                className={inputClass('name')}
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
              />
            </FieldWrapper>

            {/* Email */}
            <FieldWrapper label="Email Address" required error={errors.email}>
              <input
                className={inputClass('email')}
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </FieldWrapper>

            {/* Password */}
            <FieldWrapper label="Password" required error={errors.password}>
              <input
                className={inputClass('password')}
                name="password"
                type="password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </FieldWrapper>

            {/* Age */}
            <FieldWrapper label="Age" required error={errors.age}>
              <input
                className={inputClass('age')}
                name="age"
                type="number"
                placeholder="Your age in years"
                value={form.age}
                onChange={handleChange}
                min="10"
                max="120"
              />
            </FieldWrapper>

            {/* Gender */}
            <FieldWrapper label="Gender" required error={errors.gender}>
              <select
                className={selectClass('gender')}
                name="gender"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="" disabled>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </FieldWrapper>

            {/* Height */}
            <FieldWrapper label="Height (cm)" required error={errors.height}>
              <input
                className={inputClass('height')}
                name="height"
                type="number"
                placeholder="e.g. 170"
                value={form.height}
                onChange={handleChange}
                min="50"
                max="300"
              />
            </FieldWrapper>

            {/* Weight */}
            <FieldWrapper label="Weight (kg)" required error={errors.weight}>
              <input
                className={inputClass('weight')}
                name="weight"
                type="number"
                placeholder="e.g. 65"
                value={form.weight}
                onChange={handleChange}
                min="10"
                max="500"
              />
            </FieldWrapper>

            {/* Activity Level */}
            <FieldWrapper label="Activity Level" required error={errors.activityLevel}>
              <select
                className={selectClass('activityLevel')}
                name="activityLevel"
                value={form.activityLevel}
                onChange={handleChange}
              >
                <option value="" disabled>Select Activity Level</option>
                {ACTIVITY_LEVELS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </FieldWrapper>

            {/* Goal */}
            <FieldWrapper label="Your Goal" required error={errors.goal} span>
              <select
                className={selectClass('goal')}
                name="goal"
                value={form.goal}
                onChange={handleChange}
              >
                <option value="" disabled>Select Your Goal</option>
                {GOALS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </FieldWrapper>

            {/* Health Conditions Dropdown */}
            <div className="form-field form-field--span" ref={diseasesRef}>
              <label className="form-label">Health Conditions <span className="optional-tag">(Optional)</span></label>
              <div className="diseases-dropdown">
                <button
                  type="button"
                  className="diseases-trigger"
                  onClick={() => setDiseasesOpen(prev => !prev)}
                  aria-expanded={diseasesOpen}
                >
                  <span className="diseases-trigger-text">
                    {form.diseases.length === 0
                      ? 'Select Health Conditions'
                      : form.diseases.join(', ')}
                  </span>
                  <span className={`diseases-arrow ${diseasesOpen ? 'open' : ''}`}>▾</span>
                </button>

                {diseasesOpen && (
                  <div className="diseases-list" role="listbox" aria-multiselectable="true">
                    {DISEASES.map(disease => {
                      const checked = form.diseases.includes(disease);
                      return (
                        <label
                          key={disease}
                          className={`diseases-option${checked ? ' checked' : ''}`}
                          role="option"
                          aria-selected={checked}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleDiseaseToggle(disease)}
                            className="diseases-checkbox"
                          />
                          <span className="diseases-checkmark">{checked ? '☑' : '☐'}</span>
                          {disease}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              {form.diseases.length > 0 && (
                <div className="diseases-tags">
                  {form.diseases.map(d => (
                    <span key={d} className="disease-tag">
                      {d}
                      <button
                        type="button"
                        className="disease-tag-remove"
                        onClick={() => handleDiseaseToggle(d)}
                        aria-label={`Remove ${d}`}
                      >×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            className="btn btn-signup"
            type="submit"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <><span className="spinner"></span> Creating Account…</>
            ) : (
              '🚀 Create Account'
            )}
          </button>
        </form>

        <p className="signup-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
