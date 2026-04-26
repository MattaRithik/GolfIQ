from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=True, index=True)
    handicap_index = Column(Float, nullable=True)
    home_course = Column(String(255), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    years_playing = Column(Integer, nullable=True)
    dominant_hand = Column(String(10), nullable=True, default="right")
    goals = Column(Text, nullable=True)
    practice_hours_per_week = Column(Float, nullable=True, default=5.0)
    fitness_notes = Column(Text, nullable=True)
    # Golf Life History fields
    age_started = Column(Integer, nullable=True)
    best_handicap_ever = Column(Float, nullable=True)
    best_score_ever = Column(Integer, nullable=True)
    tournament_experience = Column(String(50), nullable=True)  # none/local/regional/national
    num_tournaments = Column(Integer, nullable=True)
    typical_tee_yardage = Column(Integer, nullable=True)
    driving_distance = Column(Integer, nullable=True)
    swing_speed = Column(Float, nullable=True)
    typical_miss = Column(String(50), nullable=True)  # left/right/push/pull/straight
    strongest_part = Column(String(100), nullable=True)
    weakest_part = Column(String(100), nullable=True)
    practice_split_driving = Column(Float, nullable=True)
    practice_split_approach = Column(Float, nullable=True)
    practice_split_short_game = Column(Float, nullable=True)
    practice_split_putting = Column(Float, nullable=True)
    practice_split_course_mgmt = Column(Float, nullable=True)
    coach_program = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    rounds = relationship("Round", back_populates="profile", cascade="all, delete-orphan")
    benchmarks = relationship("Benchmark", back_populates="profile", cascade="all, delete-orphan")
    predictions = relationship("ModelPrediction", back_populates="profile", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    par = Column(Integer, nullable=False, default=72)
    course_rating = Column(Float, nullable=True)
    slope_rating = Column(Float, nullable=True)
    yardage = Column(Integer, nullable=True)
    num_holes = Column(Integer, nullable=False, default=18)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    rounds = relationship("Round", back_populates="course")


class Round(Base):
    __tablename__ = "rounds"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    date_played = Column(DateTime(timezone=True), nullable=False)
    tee_box = Column(String(50), nullable=True)
    total_score = Column(Integer, nullable=True)
    total_putts = Column(Integer, nullable=True)
    fairways_hit = Column(Integer, nullable=True)
    fairways_attempted = Column(Integer, nullable=True)
    greens_in_regulation = Column(Integer, nullable=True)
    penalties = Column(Integer, nullable=True, default=0)
    weather_conditions = Column(String(100), nullable=True)
    round_type = Column(String(20), nullable=True, default="casual")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    profile = relationship("Profile", back_populates="rounds")
    course = relationship("Course", back_populates="rounds")
    holes = relationship("Hole", back_populates="round", cascade="all, delete-orphan")
    shots = relationship("Shot", back_populates="round", cascade="all, delete-orphan")


class Hole(Base):
    __tablename__ = "holes"

    id = Column(Integer, primary_key=True, index=True)
    round_id = Column(Integer, ForeignKey("rounds.id"), nullable=False, index=True)
    hole_number = Column(Integer, nullable=False)
    par = Column(Integer, nullable=False)
    score = Column(Integer, nullable=False)
    putts = Column(Integer, nullable=True)
    fairway_hit = Column(Boolean, nullable=True)
    green_in_regulation = Column(Boolean, nullable=True)
    penalty_strokes = Column(Integer, nullable=True, default=0)
    sand_saves = Column(Boolean, nullable=True)
    distance_yards = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)

    round = relationship("Round", back_populates="holes")
    shots = relationship("Shot", back_populates="hole", cascade="all, delete-orphan")


class Shot(Base):
    __tablename__ = "shots"

    id = Column(Integer, primary_key=True, index=True)
    round_id = Column(Integer, ForeignKey("rounds.id"), nullable=False, index=True)
    hole_id = Column(Integer, ForeignKey("holes.id"), nullable=True)
    shot_number = Column(Integer, nullable=False)
    club_used = Column(String(50), nullable=True)
    distance_yards = Column(Float, nullable=True)
    shot_type = Column(String(50), nullable=True)
    result = Column(String(50), nullable=True)
    start_lie = Column(String(50), nullable=True)
    end_lie = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)

    round = relationship("Round", back_populates="shots")
    hole = relationship("Hole", back_populates="shots")


class Benchmark(Base):
    __tablename__ = "benchmarks"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    benchmark_group = Column(String(100), nullable=False)
    skill_gaps = Column(JSON, nullable=True)
    strokes_gained_proxy = Column(JSON, nullable=True)
    computed_at = Column(DateTime(timezone=True), server_default=func.now())

    profile = relationship("Profile", back_populates="benchmarks")


class ModelPrediction(Base):
    __tablename__ = "model_predictions"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    model_version = Column(String(50), nullable=True)
    input_features = Column(JSON, nullable=True)
    predicted_score = Column(Float, nullable=True)
    predicted_handicap = Column(Float, nullable=True)
    confidence_interval_low = Column(Float, nullable=True)
    confidence_interval_high = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    profile = relationship("Profile", back_populates="predictions")


class UploadedDataset(Base):
    __tablename__ = "uploaded_datasets"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    row_count = Column(Integer, nullable=True)
    column_count = Column(Integer, nullable=True)
    status = Column(String(50), nullable=False, default="uploaded")
    error_message = Column(Text, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
