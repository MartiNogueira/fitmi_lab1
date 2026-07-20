import prisma from '../db/prisma.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

const validateRutinaDias = (diasSemana, ejercicios) => {
  const totalDias = Number(diasSemana)
  if (!Number.isInteger(totalDias) || totalDias < 1) {
    return 'La cantidad de días debe ser mayor a 0'
  }
  if (!Array.isArray(ejercicios) || ejercicios.length === 0) {
    return 'La rutina debe tener al menos un día con ejercicios'
  }
  if (ejercicios.length !== totalDias) {
    return 'La cantidad de días no coincide con los ejercicios cargados'
  }
  const diaVacio = ejercicios.find((dia) => !Array.isArray(dia.ejercicios) || dia.ejercicios.length === 0)
  if (diaVacio) {
    return 'No se puede crear una rutina con días sin ejercicios'
  }
  return null
}

export const getRutinas = async (req, res) => {
  try {
    const rutinas = await prisma.rutina.findMany({
      where: req.user.rol === 'cliente'
        ? { usuario_id: req.user.id }
        : { entrenador_id: req.user.id },
      include: { usuario: { select: { id_usuario: true, nombre_usuario: true, email: true } } },
      orderBy: { created_at: 'desc' },
    })
    res.json(rutinas)
  } catch (err) {
    console.error('getRutinas:', err)
    res.status(500).json({ error: 'Error al obtener rutinas' })
  }
}

export const createRutina = async (req, res) => {
  const { nombre, objetivo, dias_semana, ejercicios, usuario_email } = req.body
  if (!nombre || !objetivo || !dias_semana || !ejercicios) {
    return res.status(400).json({ error: 'Nombre, objetivo, días y ejercicios son requeridos' })
  }
  const validationError = validateRutinaDias(dias_semana, ejercicios)
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }
  try {
    let usuario_id = req.user.rol === 'cliente' ? req.user.id : null
    if (req.user.rol !== 'cliente' && usuario_email) {
      const usuario = await prisma.usuario.findUnique({ where: { email: usuario_email } })
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })
      if (usuario.rol !== 'cliente') return res.status(400).json({ error: 'Solo se puede asignar a clientes' })
      usuario_id = usuario.id_usuario
    }
    const rutina = await prisma.rutina.create({
      data: {
        nombre,
        objetivo,
        dias_semana: Number(dias_semana),
        ejercicios,
        entrenador_id: req.user.id,
        usuario_id,
      },
      include: { usuario: { select: { id_usuario: true, nombre_usuario: true, email: true } } },
    })
    res.status(201).json(rutina)
  } catch (err) {
    console.error('createRutina:', err)
    res.status(500).json({ error: 'Error al crear rutina', detail: err.message })
  }
}

export const updateRutina = async (req, res) => {
  const { id } = req.params
  const { nombre, objetivo, dias_semana, ejercicios, usuario_email } = req.body
  const validationError = validateRutinaDias(dias_semana, ejercicios)
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }
  try {
    const existing = await prisma.rutina.findUnique({ where: { id: Number(id) } })
    if (!existing || existing.entrenador_id !== req.user.id) {
      return res.status(404).json({ error: 'Rutina no encontrada' })
    }
    let usuario_id = existing.usuario_id
    if (usuario_email !== undefined) {
      if (usuario_email === '') {
        usuario_id = null
      } else {
        const usuario = await prisma.usuario.findUnique({ where: { email: usuario_email } })
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })
        if (usuario.rol !== 'cliente') return res.status(400).json({ error: 'Solo se puede asignar a clientes' })
        usuario_id = usuario.id_usuario
      }
    }
    const rutina = await prisma.rutina.update({
      where: { id: Number(id) },
      data: { nombre, objetivo, dias_semana: Number(dias_semana), ejercicios, usuario_id },
      include: { usuario: { select: { id_usuario: true, nombre_usuario: true, email: true } } },
    })
    res.json(rutina)
  } catch (err) {
    console.error('updateRutina:', err)
    res.status(500).json({ error: 'Error al actualizar rutina', detail: err.message })
  }
}

export const deleteRutina = async (req, res) => {
  const { id } = req.params
  try {
    const existing = await prisma.rutina.findUnique({ where: { id: Number(id) } })
    if (!existing || existing.entrenador_id !== req.user.id) {
      return res.status(404).json({ error: 'Rutina no encontrada' })
    }
    await prisma.ejercicioCompletado.deleteMany({ where: { rutina_id: Number(id) } })
    await prisma.rutina.delete({ where: { id: Number(id) } })
    res.json({ message: 'Rutina eliminada' })
  } catch (err) {
    console.error('deleteRutina:', err)
    res.status(500).json({ error: 'Error al eliminar rutina', detail: err.message })
  }
}

export const generarRutinaIA = async (req, res) => {
  if (req.user.rol !== 'cliente') {
    return res.status(403).json({ error: 'Solo los clientes pueden generar rutinas con IA' })
  }
  if (!genAI) {
    return res.status(503).json({ error: 'El servicio de IA no está configurado. Contactá al administrador.' })
  }

  const { descripcion, tipo, nivel, dias_semana, equipamiento } = req.body
  const dias = Math.min(Math.max(Number(dias_semana) || 3, 2), 6)

  const prompt = `Sos un entrenador personal experto. Generá una rutina de ejercicios personalizada.

Parámetros del usuario:
- Descripción libre: ${descripcion?.trim() || 'No especificada'}
- Tipo de entrenamiento: ${tipo || 'Mixta'}
- Nivel: ${nivel || 'Intermedio'}
- Días por semana: ${dias}
- Equipamiento disponible: ${equipamiento || 'Gimnasio completo'}

Respondé ÚNICAMENTE con un objeto JSON válido, sin texto adicional antes ni después, sin bloques de código markdown. Usá esta estructura exacta:
{
  "nombre": "Nombre descriptivo de la rutina",
  "objetivo": "Objetivo principal en una frase corta",
  "dias": [
    {
      "dia": 1,
      "nombre": "Día 1 - Nombre del bloque",
      "ejercicios": [
        { "nombre": "Nombre del ejercicio en español", "series": "3", "reps": "10-12", "notas": "" }
      ]
    }
  ]
}

Reglas:
- Exactamente ${dias} días en el array "dias"
- Entre 5 y 7 ejercicios por día
- Nivel ${nivel || 'intermedio'}, tipo ${tipo || 'mixta'}, equipamiento: ${equipamiento || 'gimnasio completo'}
- Nombres de ejercicios en español
- "series" es un string numérico como "3" o "4"
- "reps" puede ser rango como "8-10" o número como "20"
- "notas" puede estar vacío`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      return res.status(500).json({ error: 'La IA devolvió una respuesta inválida. Intentá de nuevo.' })
    }

    if (!parsed.nombre || !Array.isArray(parsed.dias) || parsed.dias.length === 0) {
      return res.status(500).json({ error: 'La IA devolvió una estructura incorrecta. Intentá de nuevo.' })
    }

    res.json({
      nombre: parsed.nombre,
      objetivo: parsed.objetivo || tipo || 'Rutina generada con IA',
      dias_semana: parsed.dias.length,
      ejercicios: parsed.dias,
    })
  } catch (err) {
    console.error('generarRutinaIA:', err)
    if (err.message?.includes('API_KEY') || err.message?.includes('credentials')) {
      return res.status(503).json({ error: 'API key de Gemini inválida. Contactá al administrador.' })
    }
    res.status(500).json({ error: 'Error al generar la rutina. Intentá de nuevo.' })
  }
}
