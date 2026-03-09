/**
 * Mock data for Stitch screens until backend provides real data.
 * Ensures every screen renders a complete, functional UI.
 */

import type { AIAnalysis } from "@/types/database";

export const MOCK_ANALYSIS: AIAnalysis = {
  postureScore: 82,
  symmetryScore: 78,
  keyInsights: [
    "Keep your shoulders relaxed and aligned.",
    "Try landing under your center of mass for better balance.",
    "Slight heel strike on left—focus on midfoot landing."
  ],
  gaitPhases: [
    { timestamp: 0, phase: "Stance" },
    { timestamp: 0.35, phase: "Swing" },
    { timestamp: 0.52, phase: "Stance" },
    { timestamp: 0.88, phase: "Swing" }
  ],
  message: "Great consistency today. Your cadence is steady—keep it up!"
};

export const MOCK_WORKOUT = {
  id: "w1",
  title: "Posture Recovery Flow",
  durationMinutes: 12,
  exercises: [
    { id: "e1", name: "Heel-to-Toe Walk", duration: 60, completed: true },
    { id: "e2", name: "Single-Leg Balance", duration: 45, completed: true },
    { id: "e3", name: "Calf Raises", duration: 90, completed: false },
    { id: "e4", name: "Hip Circles", duration: 60, completed: false }
  ],
  currentExerciseIndex: 2,
  totalProgress: 0.5
};

export const MOCK_EXERCISES = [
  {
    id: "ex1",
    name: "Heel-to-Toe Walk",
    duration: 60,
    description: "Improves balance and proprioception. Walk in a straight line placing heel directly in front of toes.",
    icon: "walk" as const,
    sets: 3
  },
  {
    id: "ex2",
    name: "Single-Leg Balance",
    duration: 45,
    description: "Strengthens stabilizing muscles. Stand on one leg, eyes open, then closed.",
    icon: "body" as const,
    sets: 2
  },
  {
    id: "ex3",
    name: "Calf Raises",
    duration: 90,
    description: "Builds ankle strength for better push-off. Rise onto toes, hold, lower slowly.",
    icon: "fitness" as const,
    sets: 3
  },
  {
    id: "ex4",
    name: "Hip Circles",
    duration: 60,
    description: "Mobilizes hips for smoother gait. Stand on one leg, circle the other hip outward.",
    icon: "ellipse-outline" as const,
    sets: 2
  },
  {
    id: "ex5",
    name: "Glute Bridge",
    duration: 120,
    description: "Activates glutes for proper stride. Lie on back, lift hips, squeeze glutes at top.",
    icon: "body" as const,
    sets: 3
  }
];

export const MOCK_CHALLENGES = [
  {
    id: "ch1",
    name: "7-Day Posture Streak",
    type: "streak" as const,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    prize: "Premium month",
    created_at: new Date().toISOString()
  },
  {
    id: "ch2",
    name: "10K Steps Challenge",
    type: "distance" as const,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    prize: "Smart insoles discount",
    created_at: new Date().toISOString()
  }
];

export const MOCK_LEADERBOARD_ENTRIES = [
  { id: "lb1", challenge_id: "ch1", user_id: "u1", score: 7, rank: 1, created_at: new Date().toISOString(), username: "walker_pro", avgPosture: 85, avatar: null },
  { id: "lb2", challenge_id: "ch1", user_id: "u2", score: 6, rank: 2, created_at: new Date().toISOString(), username: "gait_master", avgPosture: 82, avatar: null },
  { id: "lb3", challenge_id: "ch1", user_id: "u3", score: 5, rank: 3, created_at: new Date().toISOString(), username: "stride_queen", avgPosture: 79, avatar: null }
];

export const MOCK_SUBSCRIPTION_PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$9.99",
    period: "/month",
    features: ["AI Coach", "Plantar Pressure", "Unlimited scans"],
    popular: false
  },
  {
    id: "annual",
    name: "Annual",
    price: "$79.99",
    period: "/year",
    features: ["Everything in Monthly", "Save 33%", "Priority support"],
    popular: true
  }
];
