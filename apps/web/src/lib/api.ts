import type {
  Profile,
  ProfileCreate,
  Round,
  RoundCreate,
  AnalyticsSummary,
  BenchmarkComparison,
  ScorePrediction,
  CourseScenario,
  CoachRecommendations,
  DataStatus,
  ModelStatus,
} from './types';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      console.warn(`API ${path} returned ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`API fetch failed for ${path}:`, err);
    return null;
  }
}

// ---- Profiles ----

export async function getProfiles(): Promise<Profile[]> {
  const result = await apiFetch<Profile[]>('/profiles/');
  return result ?? [];
}

export async function getProfile(id: number): Promise<Profile | null> {
  return apiFetch<Profile>(`/profiles/${id}`);
}

export async function createProfile(data: ProfileCreate): Promise<Profile | null> {
  return apiFetch<Profile>('/profiles/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProfile(
  id: number,
  data: Partial<ProfileCreate>
): Promise<Profile | null> {
  return apiFetch<Profile>(`/profiles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ---- Rounds ----

export async function getRounds(profileId?: number): Promise<Round[]> {
  const query = profileId ? `?profile_id=${profileId}` : '';
  const result = await apiFetch<Round[]>(`/rounds/${query}`);
  return result ?? [];
}

export async function getRound(id: number): Promise<Round | null> {
  return apiFetch<Round>(`/rounds/${id}`);
}

export async function createRound(data: RoundCreate): Promise<Round | null> {
  return apiFetch<Round>('/rounds/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ---- Analytics ----
// Backend uses POST with body for analytics endpoints

export async function getAnalyticsSummary(
  profileId: number
): Promise<AnalyticsSummary | null> {
  return apiFetch<AnalyticsSummary>('/analytics/summary', {
    method: 'POST',
    body: JSON.stringify({ profile_id: profileId }),
  });
}

export async function getBenchmark(
  profileId: number
): Promise<BenchmarkComparison | null> {
  return apiFetch<BenchmarkComparison>('/analytics/benchmark', {
    method: 'POST',
    body: JSON.stringify({ profile_id: profileId }),
  });
}

// ---- Prediction ----

export async function predictScore(
  profileId: number,
  courseScenario?: CourseScenario
): Promise<ScorePrediction | null> {
  return apiFetch<ScorePrediction>('/predict-score', {
    method: 'POST',
    body: JSON.stringify({
      profile_id: profileId,
      ...(courseScenario ?? {}),
    }),
  });
}

// ---- Coach ----

export async function getCoachRecommendations(
  profileId: number
): Promise<CoachRecommendations | null> {
  return apiFetch<CoachRecommendations>('/coach/recommendations', {
    method: 'POST',
    body: JSON.stringify({ profile_id: profileId }),
  });
}

// ---- Data Management ----

export async function getDataStatus(): Promise<DataStatus | null> {
  return apiFetch<DataStatus>('/data/status');
}

export async function uploadDataset(
  file: File,
  datasetType: string = 'golf_stats'
): Promise<{ message: string } | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataset_type', datasetType);
    const res = await fetch(`${BASE_URL}/data/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.warn('Upload failed:', err);
    return null;
  }
}

export async function processDatasets(): Promise<{ message: string } | null> {
  return apiFetch<{ message: string }>('/data/process', { method: 'POST' });
}

export async function trainModel(): Promise<{ message: string; status?: string } | null> {
  return apiFetch<{ message: string; status?: string }>('/model/train', { method: 'POST' });
}

export async function getModelStatus(): Promise<ModelStatus | null> {
  return apiFetch<ModelStatus>('/model/status');
}
