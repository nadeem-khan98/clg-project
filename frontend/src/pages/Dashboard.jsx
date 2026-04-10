import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target, 
  Zap, 
  Brain, 
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  UtensilsCrossed,
  Info,
  Flame
} from "lucide-react";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import Layout from "../components/Layout";

const Dashboard = () => {
  const { user: authUser } = useContext(AuthContext);
  const [userProfile, setUserProfile] = useState(null);
  const [weightLogs, setWeightLogs] = useState([]);
  const [intakes, setIntakes] = useState([]);
  const [nutrition, setNutrition] = useState(null);
  const [range, setRange] = useState(15);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authUser) {
      fetchAllData();
    }
  }, [authUser]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [profileRes, weightRes, intakeRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/weight"),
        api.get("/intake")
      ]);
      setUserProfile(profileRes.data);
      setWeightLogs(weightRes.data);
      setIntakes(intakeRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      const weight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : userProfile.weight;
      const { height, age, gender, activityLevel, goal } = userProfile;
      if (!weight || !height || !age) return;

      let bmr = 10 * weight + 6.25 * height - 5 * age + (gender === "Male" ? 5 : -161);
      const factors = { Sedentary: 1.2, "Lightly Active": 1.375, "Moderately Active": 1.55, "Very Active": 1.725 };
      let tdee = bmr * (factors[activityLevel] || 1.2);
      
      if (goal === "Weight Loss") tdee -= 300;
      if (goal === "Muscle Gain") tdee += 300;

      setNutrition({
        calories: Math.max(Math.round(tdee), 1200),
        protein: Math.round(weight * 1.8),
        fat: Math.round((tdee * 0.25) / 9),
        sugar: 30
      });
    }
  }, [userProfile, weightLogs]);

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

  const getAISuggestions = () => {
    if (!nutrition) return [];
    const suggestions = [];
    const { diseases } = userProfile || {};

    if (todaysSummary.totalProtein < nutrition.protein * 0.8) {
      suggestions.push({ type: 'warning', text: "Protein intake is low. Consider adding eggs or lean meat." });
    }
    if (todaysSummary.totalSugar > nutrition.sugar) {
      suggestions.push({ type: 'danger', text: "Sugar limit exceeded. Highly recommended to skip sweets today." });
    }
    
    if (diseases?.includes('Diabetes') && todaysSummary.totalSugar > 25) {
      suggestions.push({ type: 'danger', text: "Risk Alert: Sugar is high for your Diabetes profile!" });
    }
    if (diseases?.includes('Hypertension') && todaysSummary.totalFat > 50) {
      suggestions.push({ type: 'warning', text: "Hypertension Note: Moderate your fat intake for better blood pressure." });
    }

    if (suggestions.length === 0) {
      suggestions.push({ type: 'success', text: "Everything looks great! You're hitting your targets." });
    }
    return suggestions;
  };

  const getSmartMealSuggestions = () => {
    if (!nutrition) return [];
    const suggestions = [];
    
    if (todaysSummary.totalProtein < nutrition.protein * 0.7) {
      suggestions.push({ icon: '⚠️', text: "Low Protein: Include Eggs, Paneer, or Chicken Breast in your next meal." });
    }
    if (todaysSummary.totalCalories < nutrition.calories * 0.6) {
      suggestions.push({ icon: '⚠️', text: "Energy Gap: Add Rice, Oats, or Bananas to hit your calorie goal." });
    }
    if (todaysSummary.totalFat > nutrition.fat) {
      suggestions.push({ icon: '🚫', text: "Fat Limit Reached: Opt for steamed or grilled options; avoid oily foods." });
    }
    if (todaysSummary.totalSugar > nutrition.sugar) {
      suggestions.push({ icon: '🚫', text: "Sugar Alert: High sugar intake detected. Skip soft drinks and sweets today." });
    }

    if (suggestions.length === 0) {
      suggestions.push({ icon: '✅', text: "Your diet is perfectly balanced today. Keep up the clean eating!" });
    }
    return suggestions;
  };

  const chartData = weightLogs.slice(-range).map(log => ({
    date: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: log.weight
  }));

  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : (userProfile?.weight || 0);
  const startWeight = weightLogs.length > 0 ? weightLogs[0].weight : (userProfile?.weight || 0);
  
  let targetWeight = latestWeight;
  const isMaintain = userProfile?.goal === 'Maintain Weight';
  
  if (userProfile?.goal === 'Weight Loss') targetWeight = startWeight - 5;
  else if (userProfile?.goal === 'Muscle Gain') targetWeight = startWeight + 5;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentLogs = weightLogs.filter(log => new Date(log.date) >= sevenDaysAgo);
  
  let isOnTrack = true;
  let recentDiff = 0;
  if (recentLogs.length > 1) {
    const prevWeight = recentLogs[0].weight;
    const currentWeight = recentLogs[recentLogs.length - 1].weight;
    recentDiff = currentWeight - prevWeight;
    if (userProfile?.goal === 'Weight Loss') isOnTrack = currentWeight <= prevWeight;
    else if (userProfile?.goal === 'Muscle Gain') isOnTrack = currentWeight >= prevWeight;
    else isOnTrack = Math.abs(currentWeight - prevWeight) <= 0.5;
  }

  const weightDiff = weightLogs.length > 1 
    ? (latestWeight - startWeight).toFixed(1)
    : 0;

  const progressPercent = Math.abs(startWeight - targetWeight) > 0
    ? Math.min(Math.round(Math.abs(startWeight - latestWeight) / Math.abs(startWeight - targetWeight) * 100), 100)
    : 0;

  if (loading) return <Layout><div className="fade-in">Loading your health dashboard...</div></Layout>;

  return (
    <Layout>
      <div className="fade-in">
        <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="gradient-text">Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {userProfile?.name}. Here's your status.</p>
          </div>
          
          <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current</p>
              <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{latestWeight}kg</p>
            </div>
            <div style={{ width: '1px', background: 'var(--glass-border)', height: '24px' }} />
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target</p>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-neon)' }}>{isMaintain ? latestWeight : targetWeight}kg</p>
            </div>
            <div style={{ width: '1px', background: 'var(--glass-border)', height: '24px' }} />
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isOnTrack ? 'var(--accent-neon)' : 'var(--danger)' }}>
                {isOnTrack ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{isOnTrack ? 'On Track' : 'Off Track'}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' }}>
          
          {/* Main Stat Cards */}
          <StatCard 
            icon={<Zap size={22} />} 
            label="Daily Energy" 
            current={todaysSummary.totalCalories} 
            target={nutrition?.calories} 
            color="var(--secondary-blue)" 
          />
          <StatCard 
            icon={<Target size={22} />} 
            label="Total Change" 
            current={weightDiff} 
            unit="kg" 
            color={Number(weightDiff) <= 0 ? "var(--accent-neon)" : "var(--danger)"} 
            isTrend
          />
          <StatCard 
            icon={<Flame size={22} />} 
            label="Daily Protein" 
            current={todaysSummary.totalProtein} 
            target={nutrition?.protein} 
            unit="g"
            color="#a855f7" 
          />

          {/* Row 1: Chart & AI Insights */}
          <div className="glass-panel grid-span-full-mobile" style={{ gridColumn: 'span 8', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={20} className="text-secondary-blue" /> Weight progress</h3>
              <div className="glass-card" style={{ padding: '4px', display: 'flex', gap: '4px' }}>
                {[7, 15, 30].map(d => (
                  <button key={d} onClick={() => setRange(d)} style={{ 
                    padding: '4px 10px', borderRadius: '6px', border: 'none', 
                    background: range === d ? 'var(--secondary-blue)' : 'transparent',
                    color: range === d ? 'white' : 'var(--text-secondary)',
                    fontSize: '0.7rem', cursor: 'pointer'
                  }}>{d}D</button>
                ))}
              </div>
            </div>
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-neon)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-neon)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 10}} dy={10} />
                  <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '12px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="weight" stroke="var(--accent-neon)" strokeWidth={2} fillOpacity={1} fill="url(#colorWeight)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel grid-span-full-mobile" style={{ gridColumn: 'span 4', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Brain size={18} style={{ color: 'var(--accent-neon)' }} />
              <h3>AI Insights</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {getAISuggestions().map((s, i) => (
                <div key={i} className="glass-card" style={{ 
                  display: 'flex', gap: '10px', padding: '12px',
                  borderColor: s.type === 'danger' ? 'rgba(239, 68, 68, 0.3)' : 'var(--glass-border)',
                  background: s.type === 'danger' ? 'rgba(239, 68, 68, 0.05)' : 'var(--glass-highlight)'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, color: s.type === 'danger' ? 'var(--danger)' : s.type === 'warning' ? 'var(--warning)' : 'var(--accent-neon)' }} />
                  <p style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2: Goal Progress & Meal Suggestions */}
          <div className="glass-panel grid-span-full-mobile" style={{ gridColumn: 'span 4', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1rem', width: '100%' }}>Goal status</h3>
            {isMaintain ? (
              <div className="fade-in">
                <div style={{ 
                  width: '120px', height: '120px', borderRadius: '50%', margin: '0 auto 16px',
                  border: `4px solid ${isOnTrack ? 'var(--accent-neon)' : 'var(--warning)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.02)'
                }}>
                  <Target size={40} style={{ color: isOnTrack ? 'var(--accent-neon)' : 'var(--warning)' }} />
                </div>
                <h4 style={{ color: isOnTrack ? 'var(--accent-neon)' : 'var(--warning)', fontSize: '1.25rem' }}>
                  {isOnTrack ? 'Stable' : 'Fluctuating'}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Weekly change: {recentDiff > 0 ? `+${recentDiff.toFixed(1)}` : recentDiff.toFixed(1)}kg
                </p>
              </div>
            ) : (
              <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="70" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                  <circle 
                    cx="80" cy="80" r="70" fill="transparent" 
                    stroke="var(--accent-neon)" strokeWidth="12" 
                    strokeDasharray={440} strokeDashoffset={440 - (440 * progressPercent) / 100}
                    strokeLinecap="round" transform="rotate(-90 80 80)"
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                  />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{progressPercent}%</p>
                  <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Achieved</p>
                </div>
              </div>
            )}
            {!isMaintain && (
              <p style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Target: {targetWeight}kg
              </p>
            )}
          </div>

          <div className="glass-panel grid-span-full-mobile" style={{ gridColumn: 'span 8', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <UtensilsCrossed size={18} style={{ color: 'var(--secondary-blue)' }} />
              <h3>Smart Meal Suggestions</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-mobile-1">
              {getSmartMealSuggestions().map((s, i) => (
                <div key={i} className="glass-card" style={{ display: 'flex', gap: '12px', padding: '16px', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.25rem' }}>{s.icon}</span>
                  <p style={{ fontSize: '0.8rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>{s.text}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

const StatCard = ({ icon, label, current, target, unit = "", color, isTrend = false }) => {
  const percent = target ? Math.min((current/target)*100, 100) : 0;
  return (
    <div className="glass-panel grid-span-full-mobile" style={{ gridColumn: 'span 4', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
      <div style={{ background: `${color}15`, padding: '10px', borderRadius: '12px', color }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <h3 style={{ fontSize: '1.25rem', marginTop: '4px' }}>
          {current}{unit} {target && <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ {target}{unit}</span>}
        </h3>
        {!isTrend && target && (
          <div className="progress-bar-bg" style={{ marginTop: '8px', height: '4px' }}>
            <div className="progress-bar-fill" style={{ width: `${percent}%`, backgroundColor: color }}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
