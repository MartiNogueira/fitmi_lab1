const SELECTED_RUTINA_KEY = 'selected_rutina_id'

export function getSelectedRutinaId() {//Lee el ID guardado. 
//Si existe, lo convierte a número; si no existe, devuelve null.
  const value = localStorage.getItem(SELECTED_RUTINA_KEY)
  return value ? Number(value) : null
}

export function setSelectedRutinaId(id) {//guarda el ID de una rutina seleccionada
  localStorage.setItem(SELECTED_RUTINA_KEY, String(id))
}

export function clearSelectedRutinaId() {// para borrar una rutina del localStorage
  localStorage.removeItem(SELECTED_RUTINA_KEY)
}
