// ---- Profile ----
// Matches backend ProfileResponse schema exactly

export interface Profile {
  id: number;
  name: string;
  email?: string;
  handicap_index?: number;
  home_course?: string;
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  years_playing?: number;
  dominant_hand?: string;
  goals?: string;
  practice_hours_per_week?: number;
  fitness_notes?: string;
  // Golf Life History
  age_started?: number;
  best_handicap_ever?: number;
  best_score_ever?: number;
  tournament_experience?: string;
  num_tournaments?: number;
  typical_tee_yardage?: number;
  driving_distance?: number;
  swing_speed?: number;
  typical_miss?: string;
  strongest_part?: string;
  weakest_part?: string;
  practice_split_driving?: number;
  practice_split_approach?: number;
  practice_split_short_game?: number;
  practice_split_putting?: number;
  practice_split_course_mgmt?: number;
  coach_program?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileCreate {
  name: string;
  email?: string;
  handicap_index?: number;
  home_course?: string;
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  years_playing?: number;
  dominant_hand?: string;
  goals?: string;
  practice_hours_per_week?: number;
  fitness_notes?: string;
  age_started?: number;
  best_handicap_ever?: number;
  best_score_ever?: number;
  tournament_experience?: string;
  num_tournaments?: number;
  typical_tee_yardage?: number;
  driving_distance?: number;
  swing_speed?: number;
  typical_miss?: string;
  strongest_part?: string;
  weakest_part?: string;
  practice_split_driving?: number;
  practice_split_approach?: number;
  practice_split_short_game?: number;
  practice_split_putting?: number;
  practice_split_course_mgmt?: number;
  coach_program?: string;
}

// ---- Hole ----

export interface Hole {
  id: number;
  round_id: number;
  hole_number: number;
  par: number;
  score: number;
  fairway_hit?: boolean;
  green_in_regulation?: boolean;
  putts?: number;
  penalty_strokes?: number;
  sand_saves?: boolean;
  distance_yards?: number;
  notes?: string;
}

export interface HoleCreate {
  hole_number: number;
  par: number;
  score: number;
  fairway_hit?: boolean;
  green_in_regulation?: boolean;
  putts?: number;
  penalty_strokes?: number;
  sand_saves?: boolean;
  distance_yards?: number;
  notes?: string;
}

// ---- Round ----
// The API Round model stores course via course_id FK
// For display we join course data

export interface Round {
  id: number;
  profile_id: number;
  course_id?: number;
  date_played: string;
  total_score?: number;
  total_putts?: number;
  fairways_hit?: number;
  fairways_attempted?: number;
  greens_in_regulation?: number;
  penalties?: number;
  weather_conditions?: string;
  notes?: string;
  tee_box?: string;
  round_type?: string;
  created_at?: string;
  holes?: Hole[];
  // Optionally joined course info
  course?: Course;
}

export interface Course {
  id: number;
  name: string;
  location?: string;
  par: number;
  course_rating?: number;
  slope_rating?: number;
  yardage?: number;
  num_holes?: number;
}

export interface RoundCreate {
  profile_id: number;
  course_id?: number;
  date_played: string;
  total_score?: number;
  total_putts?: number;
  fairways_hit?: number;
  fairways_attempted?: number;
  greens_in_regulation?: number;
  penalties?: number;
  weather_conditions?: string;
  notes?: string;
  holes?: HoleCreate[];
  // For convenience: pass course details inline if no course_id
  course_name?: string;
  course_location?: string;
  course_par?: number;
  course_rating?: number;
  slope_rating?: number;
  yardage?: number;
}

// ---- Analytics ----
// Matches backend AnalyticsSummaryResponse

export interface AnalyticsSummary {
  profile_id: number;
  num_rounds_analyzed: number;
  scoring_average?: number;
  fairway_percentage?: number;
  gir_percentage?: number;
  putts_per_round?: number;
  penalties_per_round?: number;
  scrambling_percentage?: number;
  par3_average?: number;
  par4_average?: number;
  par5_average?: number;
  recent_trend?: string;
  player_level?: string;
  estimated_handicap?: number;
}

// ---- Benchmark ----
// Matches backend BenchmarkResponse

export interface SkillGap {
  metric: string;
  player_value: number;
  benchmark_value: number;
  gap: number;
  priority_score?: number;
}

export interface BenchmarkComparison {
  profile_id: number;
  benchmark_group: string;
  skill_gaps: Record<string, { player: number; benchmark: number; gap: number; priority: number }>;
  strokes_gained_proxy: Record<string, number>;
  player_metrics: Record<string, number>;
}

// ---- Prediction ----
// Matches backend PredictScoreResponse

export interface CourseScenario {
  course_rating?: number;
  slope_rating?: number;
  weather_factor?: number;
  num_rounds_lookback?: number;
}

export interface ScorePrediction {
  profile_id: number;
  predicted_score: number;
  expected_score: number;
  score_p10: number;
  score_p50: number;
  score_p90: number;
  confidence_interval_low: number;
  confidence_interval_high: number;
  probability_break_90: number;
  probability_break_80: number;
  probability_break_75: number;
  predicted_handicap: number;
  confidence_level: string;
  handicap_trend: string;
  model_version: string;
  explanation: string;
  features_used: Record<string, number>;
}

// ---- Coach ----
// Matches backend CoachResponse

export interface CoachRecommendations {
  profile_id: number;
  benchmark_group: string;
  skill_gaps: Record<string, unknown>;
  practice_plan: {
    allocation_percentages?: Record<string, number>;
    drills?: string[];
    next_round_tracking_goals?: string[];
    explanation?: string;
    weekly_schedule?: Record<string, string[]>;
  };
  top_priorities: string[];
  explanation: string;
}

// ---- Data Management ----
// Matches backend DataStatusResponse

export interface DataStatus {
  raw_files: string[];
  processed_files: string[];
  seed_files: string[];
  uploaded_datasets: Array<{
    id: number;
    filename: string;
    file_size_bytes: number;
    row_count?: number;
    status: string;
    uploaded_at: string;
  }>;
  model_artifacts: string[];
  database_stats: Record<string, number>;
}

// Matches backend ModelStatusResponse

export interface ModelStatus {
  model_loaded: boolean;
  model_version?: string;
  last_trained?: string;
  training_samples?: number;
  metrics?: Record<string, number>;
  message: string;
}
