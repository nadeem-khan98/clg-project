import React, { useState } from 'react';
import api from '../services/api';
import { AlertCircle } from 'lucide-react';

const ProductCard = ({ product, onAddSuccess, onCancel, nutritionLimits, todaysSummary }) => {
  const [grams, setGrams] = useState(product?.initialGrams || 100);
  const [frequency, setFrequency] = useState(product?.initialDays && product.initialDays[0] !== 'Daily' ? 'Specific Days' : 'Daily');
  const [selectedDays, setSelectedDays] = useState(product?.initialDays && product.initialDays[0] !== 'Daily' ? product.initialDays : ['Monday']);
  const [loading, setLoading] = useState(false);

  // 1 & 6. PREVENT NaN AND INVALID DATA
  const isDataValid = product && product.productName && !isNaN(product.calories);

  const caloriesPer100 = Number(product?.calories) || 0;
  const proteinPer100 = Number(product?.protein) || 0;
  const fatPer100 = Number(product?.fat) || 0;
  const sugarPer100 = Number(product?.sugar) || 0;

  // 2. PARSE GRAMS SAFELY
  const gramsValue = Number(grams) || 0;

  // Real-time calculated properties based on slider
  const calcCalories = (caloriesPer100 / 100) * gramsValue;
  const calcProtein = (proteinPer100 / 100) * gramsValue;
  const calcFat = (fatPer100 / 100) * gramsValue;
  const calcSugar = (sugarPer100 / 100) * gramsValue;

  // 7. REAL-TIME CALCULATION & OVERFLOW ENGINE
  let warningMessage = null;
  let statusColor = "var(--accent-color)"; // Default / Safe

  if (nutritionLimits && todaysSummary && isDataValid) {
    // Determine the base state depending on if we're adding new vs editing existing
    const baseSugar = todaysSummary.totalSugar - (product.isEdit ? (sugarPer100 / 100) * product.initialGrams : 0);
    const baseFat = todaysSummary.totalFat - (product.isEdit ? (fatPer100 / 100) * product.initialGrams : 0);
    
    const projSugar = baseSugar + calcSugar;
    const projFat = baseFat + calcFat;

    if (projSugar > nutritionLimits.sugar) {
      statusColor = "var(--danger-color)";
      const remainingSugar = Math.max(0, nutritionLimits.sugar - baseSugar);
      const safeGramsSugar = sugarPer100 > 0 ? (remainingSugar / sugarPer100) * 100 : 0;
      warningMessage = `⚠ Adding ${gramsValue}g will exceed your sugar limit (${nutritionLimits.sugar}g). You can only add up to ${Math.floor(safeGramsSugar)}g safely.`;
    } 
    else if (projFat > nutritionLimits.fat) {
      statusColor = "var(--danger-color)";
      const remainingFat = Math.max(0, nutritionLimits.fat - baseFat);
      const safeGramsFat = fatPer100 > 0 ? (remainingFat / fatPer100) * 100 : 0;
      warningMessage = `⚠ Adding ${gramsValue}g will exceed your fat limit (${nutritionLimits.fat}g). You can only add up to ${Math.floor(safeGramsFat)}g safely.`;
    } 
    else if (projSugar > nutritionLimits.sugar * 0.85 || projFat > nutritionLimits.fat * 0.85) {
      statusColor = "#f59e0b"; // near limit yellow
      warningMessage = `⚠ You are nearing a macronutrient limit with this addition.`;
    }
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleDaySelect = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // 3. FIX API REQUEST ERROR
      const payload = {
        productName: product.productName,
        grams: gramsValue,
        calories: Number(calcCalories.toFixed(1)),
        sugar: Number(calcSugar.toFixed(1)),
        fat: Number(calcFat.toFixed(1)),
        protein: Number(calcProtein.toFixed(1)),
        days: frequency === 'Daily' ? ['Daily'] : selectedDays
      };

      // 5. FIX EDIT FUNCTIONALITY
      if (product.isEdit) {
        await api.put(`/intake/${product._id}`, payload);
      } else {
        await api.post('/intake', payload);
      }
      
      onAddSuccess(); // Triggers UI reload on Dashboard
    } catch (err) {
      // 4. HANDLE API ERRORS PROPERLY
      console.error(err.response?.data || err.message);
      alert(err.response?.data?.message || `Failed to ${product.isEdit ? 'update' : 'add'} product`);
    } finally {
      setLoading(false);
    }
  };

  if (!isDataValid) {
    return (
      <div className="glass-panel" style={{ marginTop: '24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--danger-color)', marginBottom: '16px' }}>⚠ Nutrition data not available for this product.</p>
        <button onClick={onCancel} className="btn">Close Window</button>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3>{product.productName} {product.isEdit && '(Editing)'}</h3>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2em' }}>×</button>
      </div>
      
      {warningMessage && (
        <div className="warning-box" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: statusColor }}>
          <AlertCircle size={18} />
          <span>{warningMessage}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '16px 0' }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>Per 100g Target</p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>Calories: {caloriesPer100.toFixed(1)} kcal</li>
            <li>Protein: {proteinPer100.toFixed(1)} g</li>
            <li>Fat: {fatPer100.toFixed(1)} g</li>
            <li>Sugar: {sugarPer100.toFixed(1)} g</li>
          </ul>
        </div>
        <div>
          <p style={{ color: statusColor, fontWeight: 'bold' }}>Live Calculated ({gramsValue}g)</p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>Calories: {calcCalories.toFixed(1)} kcal</li>
            <li>Protein: {calcProtein.toFixed(1)} g</li>
            <li>Fat: {calcFat.toFixed(1)} g</li>
            <li>Sugar: {calcSugar.toFixed(1)} g</li>
          </ul>
        </div>
      </div>

      <div style={{ margin: '16px 0' }}>
        <label>Serving Size (grams): </label>
        <input 
          className="input" 
          type="number" 
          value={grams}    
          onChange={(e) => setGrams(e.target.value)}
          min="1"
        />
      </div>

      <div style={{ margin: '16px 0' }}>
        <label>Frequency: </label>
        <select className="select" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          <option value="Daily">Daily</option>
          <option value="Specific Days">Specific Days</option>
        </select>
      </div>

      {frequency === 'Specific Days' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '16px 0' }}>
          {daysOfWeek.map(day => (
            <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input 
                type="checkbox" 
                checked={selectedDays.includes(day)}
                onChange={() => handleDaySelect(day)}
              />
              {day}
            </label>
          ))}
        </div>
      )}

      <button className="btn" onClick={handleSave} disabled={loading} style={{ width: '100%' }}>
        {loading ? 'Saving...' : (product.isEdit ? 'Update Intake' : 'Add to Diet Plan')}
      </button>
    </div>
  );
};

export default ProductCard;
