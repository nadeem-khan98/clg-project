import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import BarcodeScanner from '../components/BarcodeScanner';
import ProductCard from '../components/ProductCard';
import HealthRiskIndicator from '../components/HealthRiskIndicator';
import { ScanBarcode, Trash2, Edit, TrendingUp, AlertCircle } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js globally
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ProgressBar = ({ label, current, target, unit, unitOnlyAtEnd }) => {
  const safeTarget = target || 1;
  const rawPercent = (current / safeTarget) * 100;
  const visualPercent = Math.min(rawPercent, 100);

  let color = '#22c55e';
  if (rawPercent > 80) color = '#f59e0b';
  if (rawPercent >= 100) color = '#ef4444';

  const currentDisplay = current % 1 === 0 ? current : current.toFixed(1);

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9em' }}>
        <span>{label}</span>
        <strong>
          {currentDisplay}{unitOnlyAtEnd ? '' : unit} / {target}{unit} ({Math.round(rawPercent)}%)
        </strong>
      </div>
      <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${visualPercent}%`, backgroundColor: color, height: '100%', transition: 'width 0.3s' }}></div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user: authUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [intakes, setIntakes] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [range, setRange] = useState(15); // default 15 days

  const [userProfile, setUserProfile] = useState(null);
  const [profileError, setProfileError] = useState('');

  const [nutrition, setNutrition] = useState(null);
  const [nutritionError, setNutritionError] = useState('');

  // Feature 2: Weight tracking states
  const [weightLogs, setWeightLogs] = useState([]);
  const [currentWeight, setCurrentWeight] = useState('');
  const [weightLoading, setWeightLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(true); // Added explicitly for loading states

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");
        console.log("USER:", res.data);
        setUserProfile(res.data);
      } catch (err) {
        console.error(err);
        setProfileError("Failed to load user");
      }
    };

    if (authUser) {
      fetchUser();
      fetchIntakes();
      fetchWeightLogs();
    }
  }, [authUser]);

  const fetchIntakes = async () => {
    try {
      const { data } = await api.get('/intake');
      console.log("INTAKE:", data);
      setIntakes(data);
    } catch (error) {
      console.error('Failed to fetch intakes', error);
    }
  };

  const fetchWeightLogs = async () => {
    setChartLoading(true);
    try {
      const { data } = await api.get('/weight');
      setWeightLogs(data);
    } catch (err) {
      console.error('Failed to fetch weight logs', err);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      const weight = Number(userProfile.weight) || 0;
      const height = Number(userProfile.height) || 0;
      const age = Number(userProfile.age) || 0;

      if (!weight || !height || !age) {
        setNutritionError("⚠ Unable to calculate nutrition. Check profile details.");
        return;
      }
      setNutritionError('');

      let bmr = (10 * weight) + (6.25 * height) - (5 * age);
      bmr += userProfile.gender === 'Male' ? 5 : -161;

      const activityFactors = {
        'Sedentary': 1.2,
        'Lightly Active': 1.375,
        'Moderately Active': 1.55,
        'Very Active': 1.725
      };

      let tdee = bmr * (activityFactors[userProfile.activityLevel] || 1.2);

      if (userProfile.goal === 'Weight Loss') tdee -= 300;
      if (userProfile.goal === 'Muscle Gain') tdee += 300;

      const calories = Math.max(Math.round(tdee), 1200);
      const protein = Math.round(weight * 1.8);
      const fat = Math.round((calories * 0.25) / 9);
      const sugar = 30;

      setNutrition({
        calories,
        protein,
        fat,
        sugar
      });
    }
  }, [userProfile]);

  const handleScanSuccess = async (barcode, resumeScanning) => {
    setShowScanner(false);
    setLoadingMsg(`Looking up product ${barcode}...`);
    try {
      const { data } = await api.get(`/scan/${barcode}`);
      setScannedProduct(data);
    } catch (error) {
      alert(error.response?.data?.message || 'Product not found');
      resumeScanning();
    } finally {
      setLoadingMsg('');
    }
  };

  const handleAddSuccess = () => {
    setScannedProduct(null);
    fetchIntakes();
  };

  const handleEdit = (intake) => {
    const ratio = intake.grams > 0 ? (100 / intake.grams) : 0;
    const fakeProductData = {
      _id: intake._id,
      productName: intake.productName,
      calories: intake.calories * ratio || 0,
      protein: intake.protein * ratio || 0,
      fat: intake.fat * ratio || 0,
      sugar: intake.sugar * ratio || 0,
      isEdit: true,
      initialGrams: intake.grams,
      initialDays: intake.days
    };
    setScannedProduct(fakeProductData);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this entry?')) {
      try {
        await api.delete(`/intake/${id}`);
        fetchIntakes();
      } catch (error) {
        alert('Failed to delete');
      }
    }
  };

  const handleSaveWeight = async () => {
    if (!currentWeight || Number(currentWeight) <= 0) return;
    setWeightLoading(true);
    try {
      await api.post('/weight', { weight: Number(currentWeight) });
      fetchWeightLogs();
      setCurrentWeight('');
      setUserProfile(prev => ({ ...prev, weight: Number(currentWeight) }));
    } catch (err) {
      console.error(err);
      alert('Failed to save weight');
    } finally {
      setWeightLoading(false);
    }
  };

  const todaysSummary = intakes.reduce((acc, curr) => {
    acc.totalCalories += curr.calories || 0;
    acc.totalFat += curr.fat || 0;
    acc.totalProtein += curr.protein || 0;
    acc.totalSugar += curr.sugar || 0;
    return acc;
  }, { totalCalories: 0, totalFat: 0, totalProtein: 0, totalSugar: 0 });

  if (!authUser || (!userProfile && !profileError)) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;
  }
  let suggestion = "";

if (nutrition) {
  if (todaysSummary.totalProtein < nutrition.protein) {
    suggestion = "⚠ Low protein. Add eggs, chicken, paneer.";
  } 
  else if (todaysSummary.totalCalories > nutrition.calories) {
    suggestion = "⚠ Calories exceeded. Reduce junk food.";
  } 
  else if (todaysSummary.totalSugar > nutrition.sugar) {
    suggestion = "⚠ High sugar intake. Avoid sugary drinks.";
  } 
  else {
    suggestion = "✅ Good job! Your diet is balanced.";
  }
}


  // Chart Logic (UPDATED WITH TOGGLE)
  const filteredLogs = weightLogs.slice(-range);

  const chartData = {
    labels: filteredLogs.map(log =>
      new Date(log.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      })
    ),
    datasets: [
      {
        label: 'Weight (kg)',
        data: filteredLogs.map(log => log.weight),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        pointBackgroundColor: '#fff',
        pointBorderColor: 'rgba(34, 197, 94, 1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const yMin =
    filteredLogs.length > 0
      ? Math.floor(Math.min(...filteredLogs.map(l => l.weight)) - 2)
      : 0;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      y: { min: Math.max(yMin, 0) }
    }
  };

  // Insight Generator
  let weightInsight = '';
  let insightColor = 'var(--accent-color)';
  if (weightLogs.length > 1) {
    const firstLog = weightLogs[0].weight;
    const lastLog = weightLogs[weightLogs.length - 1].weight;
    const delta = (lastLog - firstLog).toFixed(1);

    if (delta > 0) {
      if (userProfile?.goal === 'Muscle Gain') {
        weightInsight = `Awesome progress! Bulk is up ${delta}kg total. Keep eating dense calories!`;
        insightColor = '#22c55e';
      } else {
        weightInsight = `Trend Alert: You are up ${delta}kg overall. Keep a close eye on your caloric surplus.`;
        insightColor = '#f59e0b';
      }
    } else if (delta < 0) {
      if (userProfile?.goal === 'Weight Loss') {
        weightInsight = `Incredible cutting momentum! You've lost ${Math.abs(delta)}kg overall.`;
        insightColor = '#22c55e';
      } else {
        weightInsight = `Warning: Weight is dropping. You lost ${Math.abs(delta)}kg overall. Are you eating enough?`;
        insightColor = '#ef4444';
      }
    } else {
      weightInsight = `Weight has securely stabilized!`;
    }
  } else if (weightLogs.length === 1) {
    weightInsight = `Baseline captured! Check back in tomorrow to unlock algorithmic trend insights.`;
  }

  // Linear layout mapping for flawless mobile structure
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>

        {/* SECTION 1: WELCOME INTRO */}
        <div className="glass-panel">
          {profileError ? (
            <p className="warning-box">⚠ Failed to load data. Please re-login.</p>
          ) : userProfile ? (
            <>
              <h3>Welcome back, {userProfile.name}</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                Goal: {userProfile.goal} | Activity Level: {userProfile.activityLevel}
              </p>
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Loading profile data...</p>
          )}
        </div>

        {/* SECTION 2: DIET PLAN */}
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3>Your Diet Plan</h3>
            <button className="btn" onClick={() => setShowScanner(!showScanner)}>
              <ScanBarcode size={16} /> Scan Product
            </button>
          </div>

          {showScanner && (
            <div style={{ marginBottom: '24px' }}>
              <BarcodeScanner onScanSuccess={handleScanSuccess} />
            </div>
          )}

          {loadingMsg && <p style={{ color: 'var(--accent-color)', marginBottom: '16px' }}>{loadingMsg}</p>}

          {scannedProduct && (
            <div style={{ marginBottom: '24px' }}>
              <ProductCard
                product={scannedProduct}
                onAddSuccess={handleAddSuccess}
                onCancel={() => setScannedProduct(null)}
                nutritionLimits={nutrition}
                todaysSummary={todaysSummary}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {intakes.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No items in your diet plan yet.</p>}
            {intakes.map(intake => (
              <div key={intake._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                  <h4 style={{ color: 'var(--accent-color)' }}>{intake.productName}</h4>
                  <p style={{ fontSize: '0.9em', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {intake.grams}g • {intake.calories} kcal • {intake.days.join(', ')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEdit(intake)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer' }} title="Edit Intake">
                    <Edit size={20} />
                  </button>
                  <button onClick={() => handleDelete(intake._id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }} title="Delete Intake">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: NUTRITION SUMMARY */}
        <div className="glass-panel">
          <h3 style={{ marginBottom: '16px' }}>Daily Requirements vs Intake</h3>


          {profileError && (
            <div className="warning-box" style={{ marginTop: '16px' }}>
              ⚠ User data not loaded properly. Please re-login.
            </div>
          )}

          {!profileError && nutritionError && (
            <div className="warning-box" style={{ marginTop: '16px' }}>
              {nutritionError}
            </div>
          )}

          {!profileError && !nutritionError && !nutrition && (
            <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Calculating nutrition computations...</p>
          )}

          {!profileError && !nutritionError && nutrition && (
            <div style={{ marginTop: '20px' }}>
              <ProgressBar
                label="Calories (TDEE)"
                current={todaysSummary.totalCalories}
                target={nutrition.calories}
                unit=" kcal"
                unitOnlyAtEnd={true}
              />
              <ProgressBar
                label="Protein Base"
                current={todaysSummary.totalProtein}
                target={nutrition.protein}
                unit="g"
              />
              <ProgressBar
                label="Dietary Fat"
                current={todaysSummary.totalFat}
                target={nutrition.fat}
                unit="g"
              />
              <ProgressBar
                label="Max Sugar Threshold"
                current={todaysSummary.totalSugar}
                target={nutrition.sugar}
                unit="g"
              />
            </div>
          )}

          <div style={{ marginTop: '24px' }}>
            <HealthRiskIndicator userDiseases={userProfile?.diseases || authUser?.diseases || []} todaysSummary={todaysSummary} />
          </div>
        </div>

        <div style={{
  marginTop: "20px",
  padding: "12px",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "8px"
}}>
  <strong>AI Suggestion:</strong>
  <p>{suggestion}</p>
</div>

        {/* SECTION: WEIGHT TRACKING + CHART (COMBINED) */}
<div className="glass-panel">

  {/* 🔹 HEADER */}
  <h3 style={{ marginBottom: '16px' }}>Weight Tracking</h3>

  {/* 🔹 INPUT ROW */}
  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
    <input 
      type="number" 
      className="input" 
      placeholder="Today's Weight (kg)" 
      value={currentWeight}
      onChange={(e) => setCurrentWeight(e.target.value)}
      style={{ flex: 1, minWidth: '200px' }}
    />
    <button 
      className="btn" 
      onClick={handleSaveWeight} 
      disabled={weightLoading}
      style={{ minWidth: '140px' }}
    >
      {weightLoading ? 'Saving...' : 'Save Weight'}
    </button>
  </div>

  {/* 🔹 RANGE BUTTONS */}
  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
    <button 
      className="btn" 
      onClick={() => setRange(7)}
      style={{ background: range === 7 ? '#22c55e' : '' }}
    >
      7 Days
    </button>
    <button 
      className="btn" 
      onClick={() => setRange(15)}
      style={{ background: range === 15 ? '#22c55e' : '' }}
    >
      15 Days
    </button>
    <button 
      className="btn" 
      onClick={() => setRange(30)}
      style={{ background: range === 30 ? '#22c55e' : '' }}
    >
      30 Days
    </button>
  </div>

  {/* 🔹 CHART */}
  {chartLoading ? (
    <div style={{
      height: '220px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: '8px'
    }}>
      <p style={{ color: 'var(--text-muted)' }}>
        Loading chart calculations...
      </p>
    </div>
  ) : weightLogs.length > 0 ? (
    <>
      <div style={{
        position: 'relative',
        height: '260px',
        width: '100%',
        marginBottom: '16px'
      }}>
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* 🔹 INSIGHT */}
      {weightInsight && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: insightColor,
          backgroundColor: 'rgba(255,255,255,0.05)',
          padding: '12px',
          borderRadius: '8px'
        }}>
          <TrendingUp size={16} />
          <span style={{ fontSize: '0.95em' }}>
            {weightInsight}
          </span>
        </div>
      )}
    </>
  ) : (
    <div style={{
      height: '140px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: '8px'
    }}>
      <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
        No weight data available.<br/>
        Start logging above!
      </p>
    </div>
  )}

</div>

      </div>
    </div>
  );
};

export default Dashboard;
