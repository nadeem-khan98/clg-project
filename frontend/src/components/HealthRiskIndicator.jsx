import React from 'react';
import { AlertTriangle } from 'lucide-react';

const HealthRiskIndicator = ({ userDiseases, todaysSummary }) => {
  const warnings = [];

  const { totalSugar, totalFat, totalCalories } = todaysSummary;

  // Simple risk logic based on user diseases
  if (userDiseases.includes('Diabetes') && totalSugar > 30) {
    warnings.push('High sugar intake detected. Please monitor your levels carefully as you have Diabetes.');
  }

  if (userDiseases.includes('Heart Disease') && totalFat > 45) {
    warnings.push('High fat intake detected. This may increase risks associated with Heart Disease.');
  }
  
  if (userDiseases.includes('Hypertension') && totalFat > 55) {
    warnings.push('High fat/sodium linked foods may exacerbate Hypertension.');
  }

  if (userDiseases.includes('High Cholesterol') && totalFat > 40) {
    warnings.push('Monitor your fat intake carefully given your High Cholesterol condition.');
  }

  if (warnings.length === 0) return null;

  return (
    <div style={{ marginTop: '24px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning-color)' }}>
        <AlertTriangle size={20} /> Health Risk Warnings
      </h3>
      {warnings.map((msg, idx) => (
        <div key={idx} className="warning-box">
          {msg}
        </div>
      ))}
    </div>
  );
};

export default HealthRiskIndicator;
