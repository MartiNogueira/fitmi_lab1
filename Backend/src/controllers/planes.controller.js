import prisma from '../db/prisma.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null

export const generarPlanIA = async (req, res) => {
  if (req.user.rol !== 'cliente') {
    return res.status(403).json({ error: 'Solo los clientes pueden generar planes con IA' })
  }
  if (!genAI) {
    return res.status(503).json({ error: 'IA no configurada en el servidor' })
  }

  const { descripcion, tipo, objetivo, dias, restricciones } = req.body
  if (!descripcion?.trim()) {
    return res.status(400).json({ error: 'La descripción es requerida' })
  }

  const prompt = `Eres un nutricionista profesional. Genera un plan alimenticio personalizado en formato JSON.

Descripción del usuario: "${descripcion}"
Tipo de dieta: ${tipo || 'Equilibrada'}
Objetivo: ${objetivo || 'Mantenimiento'}
Días del plan: ${dias || 7}
${restricciones ? `Restricciones o preferencias adicionales: ${restricciones}` : ''}

Responde SOLO con JSON válido, sin texto adicional, sin markdown, sin bloques de código.
El JSON debe seguir exactamente esta estructura:
{
  "nombre": "Nombre descriptivo del plan",
  "objetivo": "Descripción del objetivo nutricional",
  "dias": [
    {
      "dia": 1,
      "nombre": "Lunes",
      "comidas": [
        {
          "nombre": "Nombre de la comida",
          "momento": "desayuno",
          "descripcion": "Descripción con porciones y preparación"
        }
      ]
    }
  ]
}

Los valores de "momento" deben ser exactamente uno de: desayuno, almuerzo, merienda, cena, snack.
Incluye entre 3 y 5 comidas por día. Genera exactamente ${dias || 7} días de plan.`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(prompt)
    let text = result.response.text().trim()
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()

    const plan = JSON.parse(text)
    if (!plan.nombre || !plan.dias || !Array.isArray(plan.dias)) {
      return res.status(502).json({ error: 'La IA generó un formato inválido' })
    }
    res.json(plan)
  } catch (err) {
    console.error('generarPlanIA:', err)
    res.status(502).json({ error: 'Error al generar el plan con IA' })
  }
}

export const guardarPlanIA = async (req, res) => {
  if (req.user.rol !== 'cliente') {
    return res.status(403).json({ error: 'Solo los clientes pueden guardar planes generados con IA' })
  }
  const { nombre, objetivo, dias } = req.body
  if (!nombre || !objetivo || !dias) {
    return res.status(400).json({ error: 'Datos del plan incompletos' })
  }
  try {
    const plan = await prisma.planAlimenticio.create({
      data: { nombre, objetivo, dias, usuario_id: req.user.id, nutricionista_id: null },
    })
    res.status(201).json(plan)
  } catch (err) {
    console.error('guardarPlanIA:', err)
    res.status(500).json({ error: 'Error al guardar el plan' })
  }
}

const validatePlanDias = (dias) => {
  if (!Array.isArray(dias) || dias.length === 0) {
    return 'El plan debe tener al menos un día con comidas'
  }
  const diaVacio = dias.find((dia) => !Array.isArray(dia.comidas) || dia.comidas.length === 0)
  if (diaVacio) {
    return 'No se puede crear un plan con días sin comidas'
  }
  return null
}

export const getPlanes = async (req, res) => {
  try {
    const planes = await prisma.planAlimenticio.findMany({
      where: { nutricionista_id: req.user.id },
      include: { usuario: { select: { id_usuario: true, nombre_usuario: true, email: true } } },
      orderBy: { created_at: 'desc' },
    })
    res.json(planes)
  } catch (err) {
    console.error('getPlanes:', err)
    res.status(500).json({ error: 'Error al obtener planes' })
  }
}

export const createPlan = async (req, res) => {
  const { nombre, objetivo, dias, usuario_email } = req.body
  if (!nombre || !objetivo || !dias) {
    return res.status(400).json({ error: 'Nombre, objetivo y días son requeridos' })
  }
  const validationError = validatePlanDias(dias)
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }
  try {
    let usuario_id = null
    if (usuario_email) {
      const usuario = await prisma.usuario.findUnique({ where: { email: usuario_email } })
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })
      if (usuario.rol !== 'cliente') return res.status(400).json({ error: 'Solo se puede asignar a clientes' })
      usuario_id = usuario.id_usuario
    }
    const plan = await prisma.planAlimenticio.create({
      data: {
        nombre,
        objetivo,
        dias,
        nutricionista_id: req.user.id,
        usuario_id,
      },
      include: { usuario: { select: { id_usuario: true, nombre_usuario: true, email: true } } },
    })
    res.status(201).json(plan)
  } catch (err) {
    console.error('createPlan:', err)
    res.status(500).json({ error: 'Error al crear plan', detail: err.message })
  }
}

export const updatePlan = async (req, res) => {
  const { id } = req.params
  const { nombre, objetivo, dias, usuario_email } = req.body
  const validationError = validatePlanDias(dias)
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }
  try {
    const existing = await prisma.planAlimenticio.findUnique({ where: { id: Number(id) } })
    if (!existing || existing.nutricionista_id !== req.user.id) {
      return res.status(404).json({ error: 'Plan no encontrado' })
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
    const plan = await prisma.planAlimenticio.update({
      where: { id: Number(id) },
      data: { nombre, objetivo, dias, usuario_id },
      include: { usuario: { select: { id_usuario: true, nombre_usuario: true, email: true } } },
    })
    res.json(plan)
  } catch (err) {
    console.error('updatePlan:', err)
    res.status(500).json({ error: 'Error al actualizar plan', detail: err.message })
  }
}

export const deletePlan = async (req, res) => {
  const { id } = req.params
  try {
    const existing = await prisma.planAlimenticio.findUnique({ where: { id: Number(id) } })
    if (!existing || existing.nutricionista_id !== req.user.id) {
      return res.status(404).json({ error: 'Plan no encontrado' })
    }
    await prisma.comidaCompletada.deleteMany({ where: { plan_id: Number(id) } })
    await prisma.planAlimenticio.delete({ where: { id: Number(id) } })
    res.json({ message: 'Plan eliminado' })
  } catch (err) {
    console.error('deletePlan:', err)
    res.status(500).json({ error: 'Error al eliminar plan', detail: err.message })
  }
}
