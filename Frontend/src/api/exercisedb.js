const CACHE_KEY = 'exercisedb_oss_v1_cache'
const CACHE_TTL = 24 * 60 * 60 * 1000
const EXERCISES_URL = 'https://raw.githubusercontent.com/bootstrapping-lab/exercisedb-api/main/src/data/exercises.json'

function normalize(ex) {
  return {
    id: ex.exerciseId,
    name: ex.name,
    bodyPart: ex.bodyParts?.[0] ?? '',
    equipment: ex.equipments?.[0] ?? '',
    gifUrl: ex.gifUrl,
    primaryMuscles: ex.targetMuscles ?? [],
    secondaryMuscles: ex.secondaryMuscles ?? [],
    instructions: (ex.instructions ?? []).map((s) => s.replace(/^Step:\d+\s*/i, '')),
  }
}

export async function getExercises() {
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp < CACHE_TTL) return data
  }

  const res = await fetch(EXERCISES_URL)
  if (!res.ok) throw new Error('Error al obtener ejercicios')

  const raw = await res.json()
  const data = raw.map(normalize)

  localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
  return data
}
