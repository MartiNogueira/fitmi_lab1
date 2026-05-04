const CACHE_KEY = 'freeexercisedb_v2_cache'
const CACHE_TTL = 24 * 60 * 60 * 1000
const EXERCISES_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

export async function getExercises() {
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp < CACHE_TTL) return data
  }

  const res = await fetch(EXERCISES_URL)
  if (!res.ok) throw new Error('Error al obtener ejercicios')

  const raw = await res.json()
  const data = raw.map((ex) => ({
    id: ex.id,
    name: ex.name,
    bodyPart: ex.primaryMuscles?.[0] ?? ex.category,
    equipment: ex.equipment,
    level: ex.level,
    mechanic: ex.mechanic,
    force: ex.force,
    category: ex.category,
    primaryMuscles: ex.primaryMuscles ?? [],
    secondaryMuscles: ex.secondaryMuscles ?? [],
    instructions: ex.instructions ?? [],
    images: (ex.images ?? []).map((img) => IMAGE_BASE + img),
  }))

  localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
  return data
}
