import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import {
  TrendingUp,
  Target,
  Zap,
  Brain,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  UtensilsCrossed,
  Flame,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  TrendingDown,
  Sparkles,
  Salad,
  Egg,
  Coffee,
  Apple,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import Layout from "../components/Layout";

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Check if an intake record applies to a given weekday name */
const intakeMatchesDay = (intake, dayName) => {
  if (!intake.days || intake.days.length === 0) return true; // no days → always show
  return intake.days.includes(dayName) || intake.days.includes('Daily');
};

const sumIntakes = (records) =>
  records.reduce(
    (acc, curr) => {
      acc.calories += curr.calories || 0;
      acc.fat += curr.fat || 0;
      acc.protein += curr.protein || 0;
      acc.sugar += curr.sugar || 0;
      return acc;
    },
    { calories: 0, fat: 0, protein: 0, sugar: 0 }
  );

/**
 * Returns the warning zone level for a nutrient:
 * 'safe'    →  0–70 %
 * 'warning' →  70–100 %
 * 'danger'  →  100 %+
 */
const getZone = (current, limit) => {
  if (!limit) return "safe";
  const pct = (current / limit) * 100;
  if (pct >= 100) return "danger";
  if (pct >= 70) return "warning";
  return "safe";
};

const ZONE_META = {
  safe: {
    color: "var(--accent-neon)",
    bg: "rgba(34, 197, 94, 0.07)",
    border: "rgba(34, 197, 94, 0.25)",
    badgeBg: "rgba(34, 197, 94, 0.15)",
    badgeText: "#16a34a",
    label: "Safe",
  },
  warning: {
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.07)",
    border: "rgba(245, 158, 11, 0.30)",
    badgeBg: "rgba(245, 158, 11, 0.15)",
    badgeText: "#b45309",
    label: "Warning",
  },
  danger: {
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.07)",
    border: "rgba(239, 68, 68, 0.28)",
    badgeBg: "rgba(239, 68, 68, 0.15)",
    badgeText: "#dc2626",
    label: "Danger",
  },
};

/* ─────────────────────────────────────────────
   AI INSIGHTS GENERATOR (warnings / alerts only)
───────────────────────────────────────────── */
const buildAIInsights = (today, yesterday, nutrition, userProfile) => {
  if (!nutrition) return [];
  const insights = [];
  const { diseases = [] } = userProfile || {};

  const pct = (val, limit) => (limit ? (val / limit) * 100 : 0);

  /* ── Nutrient zone checks ── */
  // Sugar
  const sugarPct = pct(today.sugar, nutrition.sugar);
  if (sugarPct >= 100) {
    insights.push({
      zone: "danger",
      icon: "❌",
      title: "Sugar limit exceeded",
      detail: `${today.sugar.toFixed(1)}g consumed vs ${nutrition.sugar}g limit.`,
    });
  } else if (sugarPct >= 70) {
    const msg =
      sugarPct >= 99
        ? "Sugar limit reached"
        : "Approaching sugar limit";
    insights.push({
      zone: "warning",
      icon: "⚠️",
      title: msg,
      detail: `${today.sugar.toFixed(1)}g / ${nutrition.sugar}g (${Math.round(sugarPct)}%).`,
    });
  }

  // Fat
  const fatPct = pct(today.fat, nutrition.fat);
  if (fatPct >= 100) {
    insights.push({
      zone: "danger",
      icon: "❌",
      title: "High fat intake detected",
      detail: `Fat intake ${today.fat.toFixed(1)}g exceeds ${nutrition.fat}g target.`,
    });
  } else if (fatPct >= 70) {
    insights.push({
      zone: "warning",
      icon: "⚠️",
      title: "Fat intake approaching limit",
      detail: `${today.fat.toFixed(1)}g / ${nutrition.fat}g (${Math.round(fatPct)}%).`,
    });
  }

  // Protein — warn when low
  const proteinPct = pct(today.protein, nutrition.protein);
  if (proteinPct < 50 && today.calories > 200) {
    insights.push({
      zone: "warning",
      icon: "⚠️",
      title: "Low protein intake",
      detail: `Only ${today.protein.toFixed(1)}g of ${nutrition.protein}g protein goal met.`,
    });
  } else if (proteinPct >= 70 && proteinPct < 100) {
    insights.push({
      zone: "safe",
      icon: "✅",
      title: "Protein goal nearly achieved",
      detail: `${today.protein.toFixed(1)}g / ${nutrition.protein}g — keep going!`,
    });
  }

  // Calories — warn when too low
  const calPct = pct(today.calories, nutrition.calories);
  if (calPct < 40 && new Date().getHours() >= 14) {
    insights.push({
      zone: "warning",
      icon: "⚠️",
      title: "Low calorie intake",
      detail: `Only ${today.calories} kcal consumed by afternoon. Fuel up!`,
    });
  }

  /* ── Disease-specific alerts ── */
  if (diseases.includes("Diabetes") && today.sugar > 20) {
    insights.push({
      zone: "danger",
      icon: "❌",
      title: "Diabetes risk alert",
      detail: `Sugar is high (${today.sugar.toFixed(1)}g) for your Diabetes profile!`,
    });
  }
  if (diseases.includes("Hypertension") && today.fat > 50) {
    insights.push({
      zone: "warning",
      icon: "⚠️",
      title: "Hypertension caution",
      detail: `High fat (${today.fat.toFixed(1)}g) may affect blood pressure.`,
    });
  }

  /* ── Pattern detection ── */
  if (sugarPct >= 70 && proteinPct < 50) {
    insights.push({
      zone: "danger",
      icon: "❌",
      title: "Unhealthy pattern detected",
      detail: "High sugar combined with low protein is harmful. Rebalance your meals.",
    });
  }

  /* ── Progress vs yesterday ── */
  if (yesterday) {
    const proteinImproved = today.protein > yesterday.protein + 5;
    const sugarWorsened = today.sugar > yesterday.sugar + 5;

    if (proteinImproved) {
      insights.push({
        zone: "safe",
        icon: "✅",
        title: "Improved protein intake",
        detail: `+${(today.protein - yesterday.protein).toFixed(1)}g more protein than yesterday.`,
      });
    }
    if (sugarWorsened) {
      insights.push({
        zone: "warning",
        icon: "⚠️",
        title: "Sugar intake increased today",
        detail: `+${(today.sugar - yesterday.sugar).toFixed(1)}g more sugar than yesterday.`,
      });
    }
  }

  /* ── Balanced diet ── */
  const allNutrientsPct = [sugarPct, fatPct, proteinPct, calPct];
  const allInSafeRange = allNutrientsPct.every((p) => p >= 60 && p < 100);
  if (allInSafeRange) {
    insights.push({
      zone: "safe",
      icon: "✅",
      title: "Balanced diet today! 🎉",
      detail: "All nutrients are within healthy range. Excellent discipline!",
    });
  }

  /* ── Motivational fallback ── */
  if (insights.length === 0) {
    if (today.calories > 0) {
      insights.push({
        zone: "safe",
        icon: "✅",
        title: "Good progress – keep consistency",
        detail: "You're on track. Stay consistent for best results.",
      });
    } else {
      insights.push({
        zone: "warning",
        icon: "⚠️",
        title: "No food logged yet today",
        detail: "Start logging meals to get personalised AI insights.",
      });
    }
  }

  return insights;
};

/* ─────────────────────────────────────────────
   SMART MEAL SUGGESTIONS (food recommendations only)
───────────────────────────────────────────── */
const buildMealSuggestions = (today, nutrition, userProfile) => {
  if (!nutrition) return [];
  const suggestions = [];
  const { diseases = [], goal } = userProfile || {};

  const proteinPct = nutrition.protein ? (today.protein / nutrition.protein) * 100 : 0;
  const calPct = nutrition.calories ? (today.calories / nutrition.calories) * 100 : 0;
  const fatPct = nutrition.fat ? (today.fat / nutrition.fat) * 100 : 0;
  const sugarPct = nutrition.sugar ? (today.sugar / nutrition.sugar) * 100 : 0;

  /* Low protein → protein-rich food cards */
  if (proteinPct < 70) {
    suggestions.push({
      icon: <Egg size={20} />,
      color: "#f59e0b",
      label: "Boost Protein",
      foods: ["Eggs", "Paneer", "Chicken Breast", "Greek Yogurt", "Lentils"],
      reason: `Only ${today.protein.toFixed(1)}g / ${nutrition.protein}g protein met.`,
    });
  }

  /* Low calories → energy-dense foods */
  if (calPct < 60) {
    suggestions.push({
      icon: <Zap size={20} />,
      color: "#3b82f6",
      label: "Add Energy",
      foods: ["Brown Rice", "Oats", "Banana", "Sweet Potato", "Whole Wheat Bread"],
      reason: `Energy gap: ${today.calories} / ${nutrition.calories} kcal.`,
    });
  }

  /* High fat → light alternatives */
  if (fatPct >= 90) {
    suggestions.push({
      icon: <Salad size={20} />,
      color: "#22c55e",
      label: "Switch to Light Options",
      foods: ["Steamed Veggies", "Grilled Fish", "Salads", "Fruit Bowl", "Sprouts"],
      reason: "Fat intake near/over limit — opt for low-fat alternatives.",
    });
  }

  /* High sugar → replacements */
  if (sugarPct >= 70) {
    suggestions.push({
      icon: <Apple size={20} />,
      color: "#a855f7",
      label: "Reduce Sugar, Eat Smart",
      foods: ["Berries", "Cucumber", "Nuts", "Hummus", "Dark Chocolate (small)"],
      reason: "Replace sweet snacks with these low-sugar options.",
    });
  }

  /* Disease-specific */
  if (diseases.includes("Diabetes")) {
    suggestions.push({
      icon: <Coffee size={20} />,
      color: "#06b6d4",
      label: "Diabetes-Friendly Picks",
      foods: ["Methi Roti", "Bitter Gourd Juice", "Almonds", "Flaxseeds", "Low-GI Rice"],
      reason: "Foods that help manage blood sugar levels.",
    });
  }
  if (diseases.includes("Hypertension")) {
    suggestions.push({
      icon: <Salad size={20} />,
      color: "#10b981",
      label: "Hypertension-Safe Choices",
      foods: ["Spinach", "Bananas", "Beets", "Garlic", "Low-sodium Dal"],
      reason: "These foods support healthy blood pressure.",
    });
  }

  /* Goal-based suggestion */
  if (goal === "Muscle Gain" && proteinPct >= 70) {
    suggestions.push({
      icon: <Flame size={20} />,
      color: "#ef4444",
      label: "Muscle Gain Top-Ups",
      foods: ["Cottage Cheese", "Quinoa", "Tuna", "Edamame", "Whey Protein Shake"],
      reason: "Maintain muscle synthesis with these high-protein additions.",
    });
  }

  /* All-good fallback */
  if (suggestions.length === 0) {
    suggestions.push({
      icon: <Sparkles size={20} />,
      color: "#22c55e",
      label: "You're Eating Great Today!",
      foods: ["Keep it up!", "Stay hydrated", "Don't skip meals", "Sleep well"],
      reason: "All nutritional targets are on track — maintain this pattern.",
    });
  }

  return suggestions;
};

/* ─────────────────────────────────────────────
   INSIGHT CARD (AI Insights section)
───────────────────────────────────────────── */
const InsightCard = ({ insight, index }) => {
  const meta = ZONE_META[insight.zone];
  const ZoneIcon =
    insight.zone === "danger"
      ? ShieldX
      : insight.zone === "warning"
      ? ShieldAlert
      : ShieldCheck;

  return (
    <div
      className="fade-in"
      style={{
        display: "flex",
        gap: "12px",
        padding: "14px 16px",
        borderRadius: "14px",
        border: `1px solid ${meta.border}`,
        background: meta.bg,
        animationDelay: `${index * 0.08}s`,
        transition: "all 0.3s ease",
      }}
    >
      {/* Zone icon */}
      <div
        style={{
          flexShrink: 0,
          width: 34,
          height: 34,
          borderRadius: "10px",
          background: meta.badgeBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: meta.color,
        }}
      >
        <ZoneIcon size={17} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {insight.title}
          </p>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "20px",
              background: meta.badgeBg,
              color: meta.badgeText,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {insight.zone === "danger" ? "❌ Danger" : insight.zone === "warning" ? "⚠ Warning" : "✅ Safe"}
          </span>
        </div>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "3px", lineHeight: 1.5 }}>
          {insight.detail}
        </p>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MEAL SUGGESTION CARD
───────────────────────────────────────────── */
const MealCard = ({ suggestion, index }) => (
  <div
    className="glass-card fade-in"
    style={{
      padding: "18px",
      animationDelay: `${index * 0.1}s`,
      borderLeft: `3px solid ${suggestion.color}`,
    }}
  >
    {/* Header */}
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "10px",
          background: `${suggestion.color}20`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: suggestion.color,
          flexShrink: 0,
        }}
      >
        {suggestion.icon}
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--text-primary)" }}>
          {suggestion.label}
        </p>
        <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "1px" }}>
          {suggestion.reason}
        </p>
      </div>
    </div>

    {/* Food tags */}
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {suggestion.foods.map((food, fi) => (
        <span
          key={fi}
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: "20px",
            background: `${suggestion.color}15`,
            color: suggestion.color,
            border: `1px solid ${suggestion.color}30`,
          }}
        >
          {food}
        </span>
      ))}
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
const StatCard = ({ icon, label, current, target, unit = "", color, isTrend = false }) => {
  const percent = target ? Math.min((current / target) * 100, 100) : 0;
  const zone = isTrend ? "safe" : getZone(current, target);
  const barColor =
    zone === "danger" ? "#ef4444" : zone === "warning" ? "#f59e0b" : color;

  return (
    <div
      className="glass-panel grid-span-full-mobile"
      style={{ gridColumn: "span 4", padding: "20px", display: "flex", gap: "16px", alignItems: "center" }}
    >
      <div style={{ background: `${color}15`, padding: "10px", borderRadius: "12px", color }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </p>
        <h3 style={{ fontSize: "1.25rem", marginTop: "4px" }}>
          {current}{unit}{" "}
          {target && (
            <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "var(--text-muted)" }}>
              / {target}{unit}
            </span>
          )}
        </h3>
        {!isTrend && target && (
          <div className="progress-bar-bg" style={{ marginTop: "8px", height: "4px" }}>
            <div
              className="progress-bar-fill"
              style={{ width: `${percent}%`, backgroundColor: barColor, transition: "width 0.8s ease" }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
const Dashboard = () => {
  const { user: authUser } = useContext(AuthContext);
  const [userProfile, setUserProfile] = useState(null);
  const [weightLogs, setWeightLogs] = useState([]);
  const [intakes, setIntakes] = useState([]);
  const [nutrition, setNutrition] = useState(null);
  const [range, setRange] = useState(15);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authUser) fetchAllData();
  }, [authUser]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [profileRes, weightRes, intakeRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/weight"),
        api.get("/intake"),
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

  /* ── Compute nutrition targets ── */
  useEffect(() => {
    if (!userProfile) return;
    const weight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : userProfile.weight;
    const { height, age, gender, activityLevel, goal } = userProfile;
    if (!weight || !height || !age) return;

    let bmr = 10 * weight + 6.25 * height - 5 * age + (gender === "Male" ? 5 : -161);
    const factors = {
      Sedentary: 1.2,
      "Lightly Active": 1.375,
      "Moderately Active": 1.55,
      "Very Active": 1.725,
    };
    let tdee = bmr * (factors[activityLevel] || 1.2);
    if (goal === "Weight Loss") tdee -= 300;
    if (goal === "Muscle Gain") tdee += 300;

    setNutrition({
      calories: Math.max(Math.round(tdee), 1200),
      protein: Math.round(weight * 1.8),
      fat: Math.round((tdee * 0.25) / 9),
      sugar: 30,
    });
  }, [userProfile, weightLogs]);

  /* ── Derive today & yesterday summaries ── */
  const todayDate = new Date();
  const todayDayName = WEEKDAYS[todayDate.getDay()];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayDayName = WEEKDAYS[yesterdayDate.getDay()];

  // Filter intakes by weekday name in their `days` array
  const todayIntakes = intakes.filter((r) => intakeMatchesDay(r, todayDayName));
  const yesterdayIntakes = intakes.filter((r) => intakeMatchesDay(r, yesterdayDayName));

  const todaySum = sumIntakes(todayIntakes);
  const yesterdaySum = sumIntakes(yesterdayIntakes);
  const hasYesterday = yesterdayIntakes.length > 0;

  /* ── Chart data ── */
  const chartData = weightLogs.slice(-range).map((log) => ({
    date: new Date(log.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    weight: log.weight,
  }));

  /* ── Weight tracking ── */
  const latestWeight =
    weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : userProfile?.weight || 0;
  const startWeight =
    weightLogs.length > 0 ? weightLogs[0].weight : userProfile?.weight || 0;
  const isMaintain = userProfile?.goal === "Maintain Weight";

  let targetWeight = latestWeight;
  if (userProfile?.goal === "Weight Loss") targetWeight = startWeight - 5;
  else if (userProfile?.goal === "Muscle Gain") targetWeight = startWeight + 5;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentLogs = weightLogs.filter((log) => new Date(log.date) >= sevenDaysAgo);

  let isOnTrack = true;
  let recentDiff = 0;
  if (recentLogs.length > 1) {
    const prevWeight = recentLogs[0].weight;
    const currentWeight = recentLogs[recentLogs.length - 1].weight;
    recentDiff = currentWeight - prevWeight;
    if (userProfile?.goal === "Weight Loss") isOnTrack = currentWeight <= prevWeight;
    else if (userProfile?.goal === "Muscle Gain") isOnTrack = currentWeight >= prevWeight;
    else isOnTrack = Math.abs(currentWeight - prevWeight) <= 0.5;
  }

  const weightDiff =
    weightLogs.length > 1 ? (latestWeight - startWeight).toFixed(1) : 0;

  const progressPercent =
    Math.abs(startWeight - targetWeight) > 0
      ? Math.min(
          Math.round(
            (Math.abs(startWeight - latestWeight) / Math.abs(startWeight - targetWeight)) * 100
          ),
          100
        )
      : 0;

  /* ── Build insight lists ── */
  const aiInsights = nutrition
    ? buildAIInsights(todaySum, hasYesterday ? yesterdaySum : null, nutrition, userProfile)
    : [];

  const mealSuggestions = nutrition
    ? buildMealSuggestions(todaySum, nutrition, userProfile)
    : [];

  if (loading)
    return (
      <Layout>
        <div className="fade-in" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          Loading your health dashboard…
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="fade-in">
        {/* ── Header ── */}
        <header
          style={{
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h1 className="gradient-text">Dashboard</h1>
            <p style={{ color: "var(--text-secondary)" }}>
              Welcome back, {userProfile?.name}. Here's your status.
            </p>
          </div>

          <div
            className="glass-card"
            style={{ padding: "8px 16px", display: "flex", gap: "16px", alignItems: "center" }}
          >
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Current</p>
              <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>{latestWeight}kg</p>
            </div>
            <div style={{ width: "1px", background: "var(--glass-border)", height: "24px" }} />
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Target</p>
              <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--accent-neon)" }}>
                {isMaintain ? latestWeight : targetWeight}kg
              </p>
            </div>
            <div style={{ width: "1px", background: "var(--glass-border)", height: "24px" }} />
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Status</p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  color: isOnTrack ? "var(--accent-neon)" : "var(--danger)",
                }}
              >
                {isOnTrack ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                  {isOnTrack ? "On Track" : "Off Track"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Grid ── */}
        <div
          className="grid-mobile-1"
          style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px" }}
        >
          {/* Stat Cards */}
          <StatCard
            icon={<Zap size={22} />}
            label="Daily Energy"
            current={Math.round(todaySum.calories)}
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
            current={Math.round(todaySum.protein)}
            target={nutrition?.protein}
            unit="g"
            color="#a855f7"
          />

        {/* ── Chart & Insights Row ── */}
        <div className="dashboard-row grid-span-full-mobile" style={{ gridColumn: "span 12", marginBottom: "20px" }}>
          {/* Weight Chart */}
          <div
            className="glass-panel"
            style={{ padding: "24px", display: "flex", flexDirection: "column" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <TrendingUp size={20} className="text-secondary-blue" /> Weight Progress
              </h3>
              <div className="glass-card" style={{ padding: "4px", display: "flex", gap: "4px" }}>
                {[7, 15, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setRange(d)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      border: "none",
                      background: range === d ? "var(--secondary-blue)" : "transparent",
                      color: range === d ? "white" : "var(--text-secondary)",
                      fontSize: "0.7rem",
                      cursor: "pointer",
                    }}
                  >
                    {d}D
                  </button>
                ))}
              </div>
            </div>
            <div style={{ width: "100%", height: "250px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-neon)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent-neon)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                    dy={10}
                  />
                  <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="var(--accent-neon)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorWeight)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── AI INSIGHTS ── */}
          <div
            className="glass-panel"
            style={{ padding: "20px", display: "flex", flexDirection: "column" }}
          >
            {/* Section header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "10px",
                  background: "rgba(34,197,94,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-neon)",
                }}
              >
                <Brain size={17} />
              </div>
              <h3 style={{ fontSize: "1rem" }}>AI Insights</h3>
            </div>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "16px" }}>
              Health alerts, warnings &amp; progress notes
            </p>

            {/* Insight cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {aiInsights.map((insight, i) => (
                <InsightCard key={i} insight={insight} index={i} />
              ))}
            </div>

            {/* Yesterday comparison note */}
            {hasYesterday && (
              <div
                style={{
                  marginTop: "14px",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  background: "rgba(59,130,246,0.07)",
                  border: "1px solid rgba(59,130,246,0.15)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Clock size={12} style={{ color: "var(--secondary-blue)", flexShrink: 0 }} />
                <p style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                  Comparing with yesterday's intake data
                </p>
              </div>
            )}
          </div>
        </div>

          {/* Goal Status */}
          <div
            className="glass-panel grid-span-full-mobile"
            style={{
              gridColumn: "span 4",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <h3 style={{ marginBottom: "20px", fontSize: "1rem", width: "100%" }}>Goal Status</h3>
            {isMaintain ? (
              <div className="fade-in">
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    margin: "0 auto 16px",
                    border: `4px solid ${isOnTrack ? "var(--accent-neon)" : "var(--warning)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <Target size={40} style={{ color: isOnTrack ? "var(--accent-neon)" : "var(--warning)" }} />
                </div>
                <h4 style={{ color: isOnTrack ? "var(--accent-neon)" : "var(--warning)", fontSize: "1.25rem" }}>
                  {isOnTrack ? "Stable" : "Fluctuating"}
                </h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "8px" }}>
                  Weekly change: {recentDiff > 0 ? `+${recentDiff.toFixed(1)}` : recentDiff.toFixed(1)}kg
                </p>
              </div>
            ) : (
              <div style={{ position: "relative", width: "160px", height: "160px" }}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="70" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="transparent"
                    stroke="var(--accent-neon)"
                    strokeWidth="12"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * progressPercent) / 100}
                    strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                    style={{ transition: "stroke-dashoffset 1s ease-out" }}
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>{progressPercent}%</p>
                  <p style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "var(--text-muted)" }}>
                    Achieved
                  </p>
                </div>
              </div>
            )}
            {!isMaintain && (
              <p style={{ marginTop: "16px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Target: {targetWeight}kg
              </p>
            )}
          </div>

          {/* ── SMART MEAL SUGGESTIONS ── */}
          <div
            className="glass-panel grid-span-full-mobile"
            style={{ gridColumn: "span 8", padding: "24px" }}
          >
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "10px",
                  background: "rgba(59,130,246,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--secondary-blue)",
                }}
              >
                <UtensilsCrossed size={17} />
              </div>
              <h3 style={{ fontSize: "1rem" }}>Smart Meal Suggestions</h3>
            </div>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "18px" }}>
              Personalised food recommendations based on your current intake
            </p>

            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}
              className="grid-mobile-1"
            >
              {mealSuggestions.map((s, i) => (
                <MealCard key={i} suggestion={s} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
