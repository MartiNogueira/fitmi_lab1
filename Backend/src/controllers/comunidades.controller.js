import prisma from '../db/prisma.js'

export const getComunidades = async (req, res) => {
  const { search } = req.query
  try {
    const [comunidades, misSolicitudes] = await Promise.all([
      prisma.comunidad.findMany({
        where: search ? { nombre: { contains: search, mode: 'insensitive' } } : {},
        include: {
          creador: { select: { id_usuario: true, nombre_usuario: true } },
          _count: { select: { miembros: { where: { estado: 'aceptado' } } } },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.solicitudComunidad.findMany({ where: { usuario_id: req.user.id } }),
    ])

    const resultado = comunidades.map((c) => {
      const sol = misSolicitudes.find((s) => s.comunidad_id === c.id)
      return {
        id: c.id,
        nombre: c.nombre,
        descripcion: c.descripcion,
        privada: c.privada,
        creador_id: c.creador_id,
        creador: c.creador,
        miembros_count: c._count.miembros,
        created_at: c.created_at,
        estado_solicitud: sol?.estado ?? null,
        solicitud_id: sol?.id ?? null,
        es_creador: c.creador_id === req.user.id,
      }
    })
    res.json(resultado)
  } catch (err) {
    console.error('getComunidades:', err)
    res.status(500).json({ error: 'Error al obtener comunidades' })
  }
}

export const createComunidad = async (req, res) => {
  const { nombre, descripcion, privada } = req.body
  if (!nombre?.trim() || !descripcion?.trim()) {
    return res.status(400).json({ error: 'Nombre y descripción requeridos' })
  }
  try {
    const comunidad = await prisma.comunidad.create({
      data: { nombre: nombre.trim(), descripcion: descripcion.trim(), privada: !!privada, creador_id: req.user.id },
    })
    res.status(201).json(comunidad)
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Ya existe una comunidad con ese nombre' })
    console.error('createComunidad:', err)
    res.status(500).json({ error: 'Error al crear comunidad' })
  }
}

export const updateComunidad = async (req, res) => {
  const { id } = req.params
  const { nombre, descripcion, privada } = req.body
  try {
    const comunidad = await prisma.comunidad.findUnique({ where: { id: Number(id) } })
    if (!comunidad) return res.status(404).json({ error: 'Comunidad no encontrada' })
    if (comunidad.creador_id !== req.user.id) return res.status(403).json({ error: 'Solo el creador puede editar' })
    const updated = await prisma.comunidad.update({
      where: { id: Number(id) },
      data: {
        ...(nombre && { nombre: nombre.trim() }),
        ...(descripcion && { descripcion: descripcion.trim() }),
        ...(privada !== undefined && { privada: !!privada }),
      },
    })
    res.json(updated)
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Ya existe una comunidad con ese nombre' })
    console.error('updateComunidad:', err)
    res.status(500).json({ error: 'Error al actualizar comunidad' })
  }
}

export const deleteComunidad = async (req, res) => {
  const { id } = req.params
  try {
    const comunidad = await prisma.comunidad.findUnique({ where: { id: Number(id) } })
    if (!comunidad) return res.status(404).json({ error: 'Comunidad no encontrada' })
    if (comunidad.creador_id !== req.user.id) return res.status(403).json({ error: 'Solo el creador puede eliminar' })
    await prisma.$transaction([
      prisma.solicitudComunidad.deleteMany({ where: { comunidad_id: Number(id) } }),
      prisma.comunidad.delete({ where: { id: Number(id) } }),
    ])
    res.json({ ok: true })
  } catch (err) {
    console.error('deleteComunidad:', err)
    res.status(500).json({ error: 'Error al eliminar comunidad' })
  }
}

export const solicitarUnirse = async (req, res) => {
  const { id } = req.params
  try {
    const comunidad = await prisma.comunidad.findUnique({ where: { id: Number(id) } })
    if (!comunidad) return res.status(404).json({ error: 'Comunidad no encontrada' })
    if (comunidad.creador_id === req.user.id) return res.status(400).json({ error: 'Sos el creador de esta comunidad' })
    const existente = await prisma.solicitudComunidad.findUnique({
      where: { comunidad_id_usuario_id: { comunidad_id: Number(id), usuario_id: req.user.id } },
    })
    if (existente) return res.status(400).json({ error: `Solicitud ya ${existente.estado}` })
    const solicitud = await prisma.solicitudComunidad.create({
      data: { comunidad_id: Number(id), usuario_id: req.user.id, estado: comunidad.privada ? 'pendiente' : 'aceptado' },
    })
    res.status(201).json(solicitud)
  } catch (err) {
    console.error('solicitarUnirse:', err)
    res.status(500).json({ error: 'Error al solicitar unirse' })
  }
}

export const getSolicitudesRecibidas = async (req, res) => {
  try {
    const solicitudes = await prisma.solicitudComunidad.findMany({
      where: { comunidad: { creador_id: req.user.id }, estado: 'pendiente' },
      include: {
        usuario: { select: { id_usuario: true, nombre_usuario: true, email: true } },
        comunidad: { select: { id: true, nombre: true } },
      },
      orderBy: { created_at: 'desc' },
    })
    res.json(solicitudes)
  } catch (err) {
    console.error('getSolicitudesRecibidas:', err)
    res.status(500).json({ error: 'Error al obtener solicitudes' })
  }
}

export const responderSolicitudComunidad = async (req, res) => {
  const { solicitudId } = req.params
  const { accion } = req.body
  if (!['aceptar', 'rechazar'].includes(accion)) return res.status(400).json({ error: 'Acción inválida' })
  try {
    const solicitud = await prisma.solicitudComunidad.findUnique({
      where: { id: Number(solicitudId) },
      include: { comunidad: true },
    })
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' })
    if (solicitud.comunidad.creador_id !== req.user.id) return res.status(403).json({ error: 'Sin permisos' })
    const updated = await prisma.solicitudComunidad.update({
      where: { id: Number(solicitudId) },
      data: { estado: accion === 'aceptar' ? 'aceptado' : 'rechazado' },
      include: { usuario: { select: { id_usuario: true, nombre_usuario: true, email: true } } },
    })
    res.json(updated)
  } catch (err) {
    console.error('responderSolicitudComunidad:', err)
    res.status(500).json({ error: 'Error al responder solicitud' })
  }
}

export const getMiembrosComunidad = async (req, res) => {
  const { id } = req.params
  try {
    const miembros = await prisma.solicitudComunidad.findMany({
      where: { comunidad_id: Number(id), estado: 'aceptado' },
      include: { usuario: { select: { id_usuario: true, nombre_usuario: true, email: true } } },
      orderBy: { created_at: 'asc' },
    })
    res.json(miembros.map((m) => m.usuario))
  } catch (err) {
    console.error('getMiembrosComunidad:', err)
    res.status(500).json({ error: 'Error al obtener miembros' })
  }
}
