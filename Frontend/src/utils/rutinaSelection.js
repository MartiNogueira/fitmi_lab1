const SELECTED_RUTINA_KEY = 'selected_rutina_id'

export function getSelectedRutinaId() {
  const value = localStorage.getItem(SELECTED_RUTINA_KEY)
  return value ? Number(value) : null
}

export function setSelectedRutinaId(id) {
  localStorage.setItem(SELECTED_RUTINA_KEY, String(id))
}

export function clearSelectedRutinaId() {
  localStorage.removeItem(SELECTED_RUTINA_KEY)
}
