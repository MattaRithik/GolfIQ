from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


# ---------------------------------------------------------------------------
# Profile schemas
# ---------------------------------------------------------------------------

class ProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = None
    handicap_index: Optional[float] = Field(None, ge=-10.0, le=54.0)
    home_course: Optional[str] = None
    age: Optional[int] = Field(None, ge=5, le=120)
    gender: Optional[str] = None
    height_cm: Optional[float] = Field(None, ge=100.0, le=250.0)
    weight_kg: Optional[float] = Field(None, ge=30.0, le=300.0)
    years_playing: Optional[int] = Field(None, ge=0, le=100)
    dominant_hand: Optional[str] = Field("right", pattern="^(right|left|Right|Left)$")
    goals: Optional[str] = None
    practice_hours_per_week: Optional[float] = Field(5.0, ge=0.0, le=60.0)
    fitness_notes: Optional[str] = None
    # Golf Life History
    age_started: Optional[int] = Field(None, ge=3, le=80)
    best_handicap_ever: Optional[float] = Field(None, ge=-10.0, le=54.0)
    best_score_ever: Optional[int] = Field(None, ge=50, le=200)
    tournament_experience: Optional[str] = None
    num_tournaments: Optional[int] = Field(None, ge=0)
    typical_tee_yardage: Optional[int] = Field(None, ge=3000, le=8000)
    driving_distance: Optional[int] = Field(None, ge=100, le=400)
    swing_speed: Optional[float] = Field(None, ge=50.0, le=150.0)
    typical_miss: Optional[str] = None
    strongest_part: Optional[str] = None
    weakest_part: Optional[str] = None
    practice_split_driving: Optional[float] = Field(None, ge=0.0, le=100.0)
    practice_split_approach: Optional[float] = Field(None, ge=0.0, le=100.0)
    practice_split_short_game: Optional[float] = Field(None, ge=0.0, le=100.0)
    practice_split_putting: Optional[float] = Field(None, ge=0.0, le=100.0)
    practice_split_course_mgmt: Optional[float] = Field(None, ge=0.0, le=100.0)
    coach_program: Optional[str] = None


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = None
    handicap_index: Optional[float] = Field(None, ge=-10.0, le=54.0)
    home_course: Optional[str] = None
    age: Optional[int] = Field(None, ge=5, le=120)
    gender: Optional[str] = None
    height_cm: Optional[float] = Field(None, ge=100.0, le=250.0)
    weight_kg: Optional[float] = Field(None, ge=30.0, le=300.0)
    years_playing: Optional[int] = Field(None, ge=0, le=100)
    dominant_hand: Optional[str] = Field(None, pattern="^(right|left|Right|Left)$")
    goals: Optional[str] = None
    practice_hours_per_week: Optional[float] = Field(None, ge=0.0, le=60.0)
    fitness_notes: Optional[str] = None
    # Golf Life History
    age_started: Optional[int] = Field(None, ge=3, le=80)
    best_handicap_ever: Optional[float] = Field(None, ge=-10.0, le=54.0)
    best_score_ever: Optional[int] = Field(None, ge=50, le=200)
    tournament_experience: Optional[str] = None
    num_tournaments: Optional[int] = Field(None, ge=0)
    typical_tee_yardage: Optional[int] = Field(None, ge=3000, le=8000)
    driving_distance: Optional[int] = Field(None, ge=100, le=400)
    swing_speed: Optional[float] = Field(None, ge=50.0, le=150.0)
    typical_miss: Optional[str] = None
    strongest_part: Optional[str] = None
    weakest_part: Optional[str] = None
    practice_split_driving: Optional[float] = Field(None, ge=0.0, le=100.0)
    practice_split_approach: Optional[float] = Field(None, ge=0.0, le=100.0)
    practice_split_short_game: Optional[float] = Field(None, ge=0.0, le=100.0)
    practice_split_putting: Optional[float] = Field(None, ge=0.0, le=100.0)
    practice_split_course_mgmt: Optional[float] = Field(None, ge=0.0, le=100.0)
    coach_program: Optional[str] = None


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: Optional[str] = None
    handicap_index: Optional[float] = None
    home_course: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    years_playing: Optional[int] = None
    dominant_hand: Optional[str] = None
    goals: Optional[str] = None
    practice_hours_per_week: Optional[float] = None
    fitness_notes: Optional[str] = None
    # Golf Life History
    age_started: Optional[int] = None
    best_handicap_ever: Optional[float] = None
    best_score_ever: Optional[int] = None
    tournament_experience: Optional[str] = None
    num_tournaments: Optional[int] = None
    typical_tee_yardage: Optional[int] = None
    driving_distance: Optional[int] = None
    swing_speed: Optional[float] = None
    typical_miss: Optional[str] = None
    strongest_part: Optional[str] = None
    weakest_part: Optional[str] = None
    practice_split_driving: Optional[float] = None
    practice_split_approach: Optional[float] = None
    practice_split_short_game: Optional[float] = None
    practice_split_putting: Optional[float] = None
    practice_split_course_mgmt: Optional[float] = None
    coach_program: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Course schemas
# ---------------------------------------------------------------------------

class CourseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    location: Optional[str] = None
    par: int = Field(72, ge=54, le=78)
    course_rating: Optional[float] = Field(None, ge=55.0, le=85.0)
    slope_rating: Optional[float] = Field(None, ge=55.0, le=155.0)
    yardage: Optional[int] = Field(None, ge=1000, le=10000)
    num_holes: int = Field(18, ge=9, le=18)


class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    location: Optional[str] = None
    par: int
    course_rating: Optional[float] = None
    slope_rating: Optional[float] = None
    yardage: Optional[int] = None
    num_holes: int
    created_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Hole schemas
# ---------------------------------------------------------------------------

class HoleCreate(BaseModel):
    hole_number: int = Field(..., ge=1, le=18)
    par: int = Field(..., ge=3, le=6)
    score: int = Field(..., ge=1, le=15)
    putts: Optional[int] = Field(None, ge=0, le=10)
    fairway_hit: Optional[bool] = None
    green_in_regulation: Optional[bool] = None
    penalty_strokes: Optional[int] = Field(0, ge=0)
    sand_saves: Optional[bool] = None
    distance_yards: Optional[int] = Field(None, ge=50, le=700)
    notes: Optional[str] = None


class HoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    round_id: int
    hole_number: int
    par: int
    score: int
    putts: Optional[int] = None
    fairway_hit: Optional[bool] = None
    green_in_regulation: Optional[bool] = None
    penalty_strokes: Optional[int] = None
    sand_saves: Optional[bool] = None
    distance_yards: Optional[int] = None
    notes: Optional[str] = None


# ---------------------------------------------------------------------------
# Shot schemas
# ---------------------------------------------------------------------------

class ShotCreate(BaseModel):
    hole_id: Optional[int] = None
    shot_number: int = Field(..., ge=1)
    club_used: Optional[str] = None
    distance_yards: Optional[float] = Field(None, ge=0.0, le=400.0)
    shot_type: Optional[str] = None
    result: Optional[str] = None
    start_lie: Optional[str] = None
    end_lie: Optional[str] = None
    notes: Optional[str] = None


class ShotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    round_id: int
    hole_id: Optional[int] = None
    shot_number: int
    club_used: Optional[str] = None
    distance_yards: Optional[float] = None
    shot_type: Optional[str] = None
    result: Optional[str] = None
    start_lie: Optional[str] = None
    end_lie: Optional[str] = None
    notes: Optional[str] = None


# ---------------------------------------------------------------------------
# Round schemas
# ---------------------------------------------------------------------------

class RoundCreate(BaseModel):
    profile_id: int
    course_id: Optional[int] = None
    # Inline course creation (used when course_id is not provided)
    course_name: Optional[str] = None
    course_location: Optional[str] = None
    course_par: Optional[int] = Field(None, ge=54, le=78)
    course_rating: Optional[float] = Field(None, ge=55.0, le=85.0)
    slope_rating: Optional[float] = Field(None, ge=55.0, le=155.0)
    yardage: Optional[int] = Field(None, ge=1000, le=10000)
    tee_box: Optional[str] = None
    date_played: datetime
    total_score: Optional[int] = Field(None, ge=40, le=200)
    total_putts: Optional[int] = Field(None, ge=0, le=72)
    fairways_hit: Optional[int] = Field(None, ge=0, le=18)
    fairways_attempted: Optional[int] = Field(None, ge=0, le=18)
    greens_in_regulation: Optional[int] = Field(None, ge=0, le=18)
    penalties: Optional[int] = Field(0, ge=0)
    weather_conditions: Optional[str] = None
    round_type: Optional[str] = Field(None, pattern="^(casual|tournament|practice)?$")
    notes: Optional[str] = None
    holes: Optional[List[HoleCreate]] = []
    shots: Optional[List[ShotCreate]] = []


class RoundResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    profile_id: int
    course_id: Optional[int] = None
    tee_box: Optional[str] = None
    date_played: datetime
    total_score: Optional[int] = None
    total_putts: Optional[int] = None
    fairways_hit: Optional[int] = None
    fairways_attempted: Optional[int] = None
    greens_in_regulation: Optional[int] = None
    penalties: Optional[int] = None
    weather_conditions: Optional[str] = None
    round_type: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    holes: List[HoleResponse] = []
    course: Optional[CourseResponse] = None


# ---------------------------------------------------------------------------
# Analytics schemas
# ---------------------------------------------------------------------------

class AnalyticsSummaryRequest(BaseModel):
    profile_id: int
    num_rounds: Optional[int] = Field(20, ge=1, le=200)


class AnalyticsSummaryResponse(BaseModel):
    profile_id: int
    num_rounds_analyzed: int
    scoring_average: Optional[float] = None
    fairway_percentage: Optional[float] = None
    gir_percentage: Optional[float] = None
    putts_per_round: Optional[float] = None
    penalties_per_round: Optional[float] = None
    scrambling_percentage: Optional[float] = None
    par3_average: Optional[float] = None
    par4_average: Optional[float] = None
    par5_average: Optional[float] = None
    recent_trend: Optional[str] = None
    player_level: Optional[str] = None
    estimated_handicap: Optional[float] = None


class BenchmarkRequest(BaseModel):
    profile_id: int
    benchmark_group: Optional[str] = None


class BenchmarkResponse(BaseModel):
    profile_id: int
    benchmark_group: str
    skill_gaps: Dict[str, Any]
    strokes_gained_proxy: Dict[str, Any]
    player_metrics: Dict[str, Any]


# ---------------------------------------------------------------------------
# Prediction schemas
# ---------------------------------------------------------------------------

class PredictScoreRequest(BaseModel):
    profile_id: int
    course_rating: Optional[float] = Field(72.0, ge=55.0, le=85.0)
    slope_rating: Optional[float] = Field(113.0, ge=55.0, le=155.0)
    weather_factor: Optional[float] = Field(0.0, ge=-5.0, le=5.0)
    num_rounds_lookback: Optional[int] = Field(10, ge=3, le=50)


class PredictScoreResponse(BaseModel):
    profile_id: int
    predicted_score: float
    expected_score: float
    score_p10: float
    score_p50: float
    score_p90: float
    confidence_interval_low: float
    confidence_interval_high: float
    probability_break_90: float
    probability_break_80: float
    probability_break_75: float
    predicted_handicap: float
    confidence_level: str
    handicap_trend: str
    model_version: str
    explanation: str
    features_used: Dict[str, Any]


# ---------------------------------------------------------------------------
# Coach schemas
# ---------------------------------------------------------------------------

class CoachRequest(BaseModel):
    profile_id: int
    goal: Optional[str] = Field("lower_handicap", description="Practice goal")
    practice_hours_per_week: Optional[float] = Field(5.0, ge=0.5, le=40.0)
    focus_area: Optional[str] = None


class CoachResponse(BaseModel):
    profile_id: int
    benchmark_group: str
    skill_gaps: Dict[str, Any]
    practice_plan: Dict[str, Any]
    top_priorities: List[str]
    explanation: str


# ---------------------------------------------------------------------------
# Data schemas
# ---------------------------------------------------------------------------

class DataStatusResponse(BaseModel):
    raw_files: List[str]
    processed_files: List[str]
    seed_files: List[str]
    uploaded_datasets: List[Dict[str, Any]]
    model_artifacts: List[str]
    database_stats: Dict[str, int]


class DataUploadResponse(BaseModel):
    dataset_id: int
    filename: str
    file_size_bytes: int
    status: str
    message: str


class DataProcessResponse(BaseModel):
    dataset_id: Optional[int] = None
    status: str
    rows_processed: Optional[int] = None
    message: str


# ---------------------------------------------------------------------------
# Model training schemas
# ---------------------------------------------------------------------------

class ModelTrainRequest(BaseModel):
    model_type: Optional[str] = Field("linear_regression", description="Type of model to train")
    num_rounds_min: Optional[int] = Field(5, ge=1, description="Minimum rounds per profile to include")


class ModelTrainResponse(BaseModel):
    status: str
    model_version: str
    profiles_trained_on: int
    rounds_trained_on: int
    metrics: Dict[str, Any]
    message: str


class ModelStatusResponse(BaseModel):
    model_loaded: bool
    model_version: Optional[str] = None
    last_trained: Optional[str] = None
    training_samples: Optional[int] = None
    metrics: Optional[Dict[str, Any]] = None
    message: str
