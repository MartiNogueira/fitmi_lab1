import prisma from '../db/prisma.js'

// ── Para el usuario: ver directorio de profesionales ─────────────────────────

export const getProfesionales = async (req, res) => {
  const { tipo } = req.query // "entrenador" | "nutricionista"
  if (!tipo) return res.status(400).json({ error: 'Tipo requerido' })
  if (req.user.rol !== 'cliente') {
    return res.status(403).json({ error: 'Solo los clientes pueden buscar profesionales' })
  }
  try {
    const profesionales = await prisma.usuario.findMany({
      where: { rol: tipo, estado: 'aprobado', NOT: { id_usuario: req.user.id } },
      select: { id_usuario: true, nombre_usuario: true, email: true },
      orderBy: { nombre_usuario: 'asc' },
    })
    // Traer también el estado del vínculo con este usuario (si existe)
    const vinculos = await prisma.vinculo.findMany({
      where: { usuario_id: req.user.id, tipo },
    })
    const resultado = profesionales.map((p) => {
      const vinculo = vinculos.find((v) => v.profesional_id === p.id_usuario)
      return { ...p, estado_vinculo: vinculo?.estado ?? null, vinculo_id: vinculo?.id ?? null }
    })
    res.json(resultado)
  } catch (err) {
    console.error('getProfesionales:', err)
    res.status(500).json({ error: 'Error al obtener profesionales' })
  }
}

// ── Para el usuario: solicitar vínculo ───────────────────────────────────────

export const solicitarVinculo = async (req, res) => {
  const { profesional_id, tipo } = req.body
  if (!profesional_id || !tipo) return res.status(400).json({ error: 'Faltan campos' })
  if (req.user.rol !== 'cliente') {
    return res.status(403).json({ error: 'Solo los clientes pueden solicitar vínculos con profesionales' })
  }
  if (Number(profesional_id) === req.user.id) {
    return res.status(400).json({ error: 'No podés vincularte con vos mismo' })
  }
  try {
    const vinculoExistente = await prisma.vinculo.findFirst({
      where: { usuario_id: req.user.id, tipo, estado: { in: ['pendiente', 'activo'] } },
    })
    if (vinculoExistente) {
      return res.status(400).json({ error: `Ya tenés un vínculo ${vinculoExistente.estado === 'activo' ? 'activo' : 'pendiente'} con un ${tipo}` })
    }
    const profesional = await prisma.usuario.findUnique({ where: { id_usuario: Number(profesional_id) } })
    if (!profesional || profesional.rol !== tipo || profesional.estado !== 'aprobado') {
      return res.status(404).json({ error: 'Profesional no encontrado' })
    }
    const existente = await prisma.vinculo.findUnique({
      where: { usuario_id_profesional_id_tipo: { usuario_id: req.user.id, profesional_id: Number(profesional_id), tipo } },
    })
    if (existente) {
      return res.status(400).json({ error: `Solicitud ya ${existente.estado}` })
    }
    const vinculo = await prisma.vinculo.create({
      data: { usuario_id: req.user.id, profesional_id: Number(profesional_id), tipo },
    })
    res.status(201).json(vinculo)
  } catch (err) {
    console.error('solicitarVinculo:', err)
    res.status(500).json({ error: 'Error al enviar solicitud', detail: err.message })
  }
}

// ── Para el usuario: desvincularse de un profesional ─────────────────────────

export const desvincularMiVinculo = async (req, res) => {
  const { id } = req.params
  const vinculoId = Number(id)
  if (!Number.isInteger(vinculoId)) {
    return res.status(400).json({ error: 'Vínculo inválido' })
  }

  try {
    const vinculo = await prisma.vinculo.findUnique({
      where: { id: vinculoId },
      include: { profesional: { select: { id_usuario: true, nombre_usuario: true, email: true, rol: true } } },
    })

    if (!vinculo || vinculo.usuario_id !== req.user.id) {
      return res.status(404).json({ error: 'Vínculo no encontrado' })
    }

    if (!['activo', 'pendiente'].includes(vinculo.estado)) {
      return res.status(400).json({ error: 'Solo podés desvincular vínculos activos o pendientes' })
    }

    const cleanup = await prisma.$transaction(async (tx) => {
      const mensajes = await tx.mensaje.deleteMany({
        where: {
          OR: [
            { remitente_id: vinculo.usuario_id, destinatario_id: vinculo.profesional_id },
            { remitente_id: vinculo.profesional_id, destinatario_id: vinculo.usuario_id },
          ],
        },
      })

      let rutinas = { count: 0 }
      let ejerciciosCompletados = { count: 0 }
      let planes = { count: 0 }
      let comidasCompletadas = { count: 0 }

      if (vinculo.tipo === 'entrenador') {
        const rutinasAsignadas = await tx.rutina.findMany({
          where: {
            usuario_id: vinculo.usuario_id,
            entrenador_id: vinculo.profesional_id,
          },
          select: { id: true },
        })
        const rutinaIds = rutinasAsignadas.map((rutina) => rutina.id)

        if (rutinaIds.length > 0) {
          ejerciciosCompletados = await tx.ejercicioCompletado.deleteMany({
            where: {
              usuario_id: vinculo.usuario_id,
              rutina_id: { in: rutinaIds },
            },
          })
          rutinas = await tx.rutina.deleteMany({ where: { id: { in: rutinaIds } } })
        }
      }

      if (vinculo.tipo === 'nutricionista') {
        const planesAsignados = await tx.planAlimenticio.findMany({
          where: {
            usuario_id: vinculo.usuario_id,
            nutricionista_id: vinculo.profesional_id,
          },
          select: { id: true },
        })
        const planIds = planesAsignados.map((plan) => plan.id)

        if (planIds.length > 0) {
          comidasCompletadas = await tx.comidaCompletada.deleteMany({
            where: {
              usuario_id: vinculo.usuario_id,
              plan_id: { in: planIds },
            },
          })
          planes = await tx.planAlimenticio.deleteMany({ where: { id: { in: planIds } } })
        }
      }

      await tx.vinculo.delete({ where: { id: vinculoId } })

      return {
        mensajes: mensajes.count,
        rutinas: rutinas.count,
        ejerciciosCompletados: ejerciciosCompletados.count,
        planes: planes.count,
        comidasCompletadas: comidasCompletadas.count,
      }
    })

    res.json({
      message: `Te desvinculaste de ${vinculo.profesional.nombre_usuario}`,
      profesional: vinculo.profesional,
      tipo: vinculo.tipo,
      cleanup,
    })
  } catch (err) {
    console.error('desvincularMiVinculo:', err)
    res.status(500).json({ error: 'Error al desvincularte', detail: err.message })
  }
}

// ── Para el profesional: ver solicitudes pendientes ──────────────────────────

export const getSolicitudes = async (req, res) => {
  try {
    const solicitudes = await prisma.vinculo.findMany({
      where: { profesional_id: req.user.id, estado: 'pendiente' },
      include: { usuario: { select: { id_usuario: true, nombre_usuario: true, email: true } } },
      orderBy: { created_at: 'desc' },
    })
    res.json(solicitudes)
  } catch (err) {
    console.error('getSolicitudes:', err)
    res.status(500).json({ error: 'Error al obtener solicitudes' })
  }
}

// ── Para el profesional: aceptar / rechazar ───────────────────────────────────

export const responderSolicitud = async (req, res) => {
  const { id } = req.params
  const { accion } = req.body // "aceptar" | "rechazar"
  if (!['aceptar', 'rechazar'].includes(accion)) {
    return res.status(400).json({ error: 'Acción inválida' })
  }
  try {
    const vinculo = await prisma.vinculo.findUnique({ where: { id: Number(id) } })
    if (!vinculo || vinculo.profesional_id !== req.user.id) {
      return res.status(404).json({ error: 'Solicitud no encontrada' })
    }
    const updated = await prisma.vinculo.update({
      where: { id: Number(id) },
      data: { estado: accion === 'aceptar' ? 'activo' : 'rechazado' },
      include: { usuario: { select: { id_usuario: true, nombre_usuario: true, email: true } } },
    })
    res.json(updated)
  } catch (err) {
    console.error('responderSolicitud:', err)
    res.status(500).json({ error: 'Error al responder solicitud', detail: err.message })
  }
}

// ── Para el profesional: ver clientes activos ─────────────────────────────────

export const getMisClientes = async (req, res) => {
  try {
    const vinculos = await prisma.vinculo.findMany({
      where: { profesional_id: req.user.id, estado: 'activo' },
      include: { usuario: { select: { id_usuario: true, nombre_usuario: true, email: true } } },
      orderBy: { created_at: 'desc' },
    })
    res.json(vinculos.map((v) => v.usuario))
  } catch (err) {
    console.error('getMisClientes:', err)
    res.status(500).json({ error: 'Error al obtener clientes' })
  }
}

// ── Para el usuario: ver su vínculo activo ────────────────────────────────────

export const getMiVinculo = async (req, res) => {
  const { tipo } = req.query
  if (!tipo) return res.status(400).json({ error: 'Tipo requerido' })
  try {
    const vinculo = await prisma.vinculo.findFirst({
      where: { usuario_id: req.user.id, tipo, estado: 'activo' },
      include: { profesional: { select: { id_usuario: true, nombre_usuario: true, email: true } } },
    })
    res.json(vinculo)
  } catch (err) {
    console.error('getMiVinculo:', err)
    res.status(500).json({ error: 'Error al obtener vínculo' })
  }
}
