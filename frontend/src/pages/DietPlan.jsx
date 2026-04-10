import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  Plus, 
  Trash2, 
  Utensils, 
  Info, 
  Edit2, 
  Clock, 
  AlertTriangle,
  X,
  Save
} from "lucide-react";
import Layout from "../components/Layout";

const DietPlan = () => {
  const { user: authUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [intakes, setIntakes] = useState([]);
  const [nutrition, setNutrition] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editingIntake, setEditingIntake] = useState(null);
  const [editGrams, setEditGrams] = useState("");

  useEffect(() => {
    if (authUser) {
      fetchData();
    }
  }, [authUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [intakeRes, userRes] = await Promise.all([
        api.get("/intake"),
        api.get("/auth/me")
      ]);
      setIntakes(intakeRes.data);
      
      const user = userRes.data;
      const bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + (user.gender === "Male" ? 5 : -161);
      const activityFactors = { Sedentary: 1.2, "Lightly Active": 1.375, "Moderately Active": 1.55, "Very Active": 1.725 };
      let tdee = bmr * (activityFactors[user.activityLevel] || 1.2);
      if (user.goal === "Weight Loss") tdee -= 300;
      if (user.goal === "Muscle Gain") tdee += 300;
      
      setNutrition({
        calories: Math.max(Math.round(tdee), 1200),
        protein: Math.round(user.weight * 1.8),
        fat: Math.round((tdee * 0.25) / 9),
        sugar: 30
      });
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this entry?")) {
      try {
        await api.delete(`/intake/${id}`);
        setIntakes(prev => prev.filter(i => i._id !== id));
      } catch (err) {
        alert("Delete failed");
      }
    }
  };

  const handleEditInit = (intake) => {
    setEditingIntake(intake);
    setEditGrams(intake.grams);
  };

  const handleUpdateGrams = async () => {
    if (!editGrams || isNaN(editGrams)) return;
    try {
      // Assuming backend supports updating grams on intake
      await api.put(`/intake/${editingIntake._id}`, { grams: Number(editGrams) });
      setEditingIntake(null);
      fetchData(); // Refresh to get recalculated nutrition if backend does that, or update local state
    } catch (err) {
      alert("Failed to update grams");
    }
  };

  const todaysSummary = intakes.reduce(
    (acc, curr) => {
      acc.totalCalories += curr.calories || 0;
      acc.totalFat += curr.fat || 0;
      acc.totalProtein += curr.protein || 0;
      acc.totalSugar += curr.sugar || 0;
      return acc;
    },
    { totalCalories: 0, totalFat: 0, totalProtein: 0, totalSugar: 0 }
  );

  const getMealType = (dateString) => {
    const hour = new Date(dateString).getHours();
    if (hour >= 6 && hour < 11) return "Breakfast";
    if (hour >= 11 && hour < 15) return "Lunch";
    if (hour >= 18 && hour < 22) return "Dinner";
    return "Snack";
  };

  if (loading) return <Layout><div className="fade-in">Loading diet plan...</div></Layout>;

  return (
    <Layout>
      <div className="fade-in">
        <header style={{ marginBottom: '32px' }}>
          <h1 className="gradient-text">Diet Plan</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Log and manage your daily nutrition targets.</p>
        </header>

        <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', alignItems: 'start' }}>
          
          <div className="glass-panel grid-span-full-mobile" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Utensils className="text-accent-neon" size={20} /> Daily Intake Log
              </h3>
              <button className="btn btn-primary" onClick={() => navigate('/scan')}>
                <Plus size={18} /> Add Food
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {intakes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <Info size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p>No records found for today.</p>
                </div>
              ) : (
                intakes.map((intake) => (
                  <IntakeCard 
                    key={intake._id} 
                    intake={intake} 
                    onDelete={handleDelete} 
                    onEdit={handleEditInit}
                    mealType={getMealType(intake.createdAt)}
                  />
                ))
              )}
            </div>
          </div>

          <div className="glass-panel grid-span-full-mobile" style={{ padding: '24px', position: 'sticky', top: '24px' }}>
            <h3 style={{ marginBottom: '20px' }}>Daily Progress</h3>
            {nutrition && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <NutritionStat label="Calories" current={todaysSummary.totalCalories} target={nutrition.calories} unit="kcal" color="var(--secondary-blue)" />
                <NutritionStat label="Protein" current={todaysSummary.totalProtein} target={nutrition.protein} unit="g" color="var(--accent-neon)" />
                <NutritionStat label="Fats" current={todaysSummary.totalFat} target={nutrition.fat} unit="g" color="#a855f7" />
                <NutritionStat label="Sugar" current={todaysSummary.totalSugar} target={nutrition.sugar} unit="g" color="orange" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Edit Popup */}
      {editingIntake && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '360px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Quick Edit</h3>
              <button onClick={() => setEditingIntake(null)} className="btn-ghost" style={{ padding: '4px' }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Update weight for <strong>{editingIntake.productName}</strong></p>
            <div className="input-group">
              <label className="label">Weight (grams)</label>
              <input 
                type="number" 
                className="input" 
                value={editGrams} 
                onChange={(e) => setEditGrams(e.target.value)}
                autoFocus
              />
            </div>
            <button onClick={handleUpdateGrams} className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
              <Save size={18} /> Update Grams
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

const IntakeCard = ({ intake, onDelete, onEdit, mealType }) => {
  const time = new Date(intake.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isHighSugar = intake.sugar > 10;
  const isHighFat = intake.fat > 15;

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'var(--glass-highlight)', color: 'var(--accent-neon)', textTransform: 'uppercase' }}>
              {mealType}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Clock size={10} /> {time}
            </span>
          </div>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600 }}>{intake.productName}</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {intake.grams}g • {intake.calories} kcal • Protein: {intake.protein}g
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => onEdit(intake)} className="btn btn-ghost" style={{ padding: '8px' }}>
            <Edit2 size={16} />
          </button>
          <button onClick={() => onDelete(intake._id)} className="btn btn-ghost" style={{ padding: '8px', color: 'var(--danger)' }}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: '8px', borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
          <span title="Protein">🥩 {intake.protein}g</span>
          <span title="Fat">🧈 {intake.fat}g</span>
          <span title="Sugar">🍬 {intake.sugar}g</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isHighSugar && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--warning)', fontWeight: 600 }}>
              <AlertTriangle size={12} /> High Sugar
            </span>
          )}
          {isHighFat && (
             <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--warning)', fontWeight: 600 }}>
                <AlertTriangle size={12} /> High Fat
             </span>
          )}
        </div>
      </div>
    </div>
  );
};

const NutritionStat = ({ label, current, target, unit, color }) => {
  const percent = Math.min((current / target) * 100, 100);
  return (
    <div className="progress-wrapper">
      <div className="progress-header">
        <span style={{ fontSize: '0.85rem' }}>{label}</span>
        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{Math.round(current)}{unit} / {target}{unit}</span>
      </div>
      <div className="progress-bar-bg" style={{ height: '6px' }}>
        <div className="progress-bar-fill" style={{ width: `${percent}%`, backgroundColor: color }}></div>
      </div>
    </div>
  );
};

export default DietPlan;
