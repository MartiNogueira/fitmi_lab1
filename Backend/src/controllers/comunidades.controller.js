import prisma from '../db/prisma.js'

const getParticipacionComunidad = async (comunidadId, userId) => {
  const comunidad = await prisma.comunidad.findUnique({
    where: { id: comunidadId },
    select: { id: true, creador_id: true },
  })
  if (!comunidad) return { comunidad: null, puedeParticipar: false }
  if (comunidad.creador_id === userId) return { comunidad, puedeParticipar: true }

  const solicitud = await prisma.solicitudComunidad.findUnique({
    where: { comunidad_id_usuario_id: { comunidad_id: comunidadId, usuario_id: userId } },
    select: { estado: true },
  })
  return { comunidad, puedeParticipar: solicitud?.estado === 'aceptado' }
}

const formatPostComunidad = (post, userId) => ({
  id: post.id,
  comunidad_id: post.comunidad_id,
  autor_id: post.autor_id,
  autor: post.autor,
  contenido: post.contenido,
  created_at: post.created_at,
  likes_count: post._count?.likes ?? 0,
  comentarios_count: post._count?.comentarios ?? 0,
  liked_by_me: post.likes?.some((like) => like.usuario_id === userId) ?? false,
  comentarios: post.comentarios ?? [],
})

const ensurePuedeParticiparPost = async (postId, userId) => {
  const post = await prisma.postComunidad.findUnique({
    where: { id: postId },
    include: { comunidad: { select: { id: true, creador_id: true } } },
  })
  if (!post) return { post: null, puedeParticipar: false }

  const { puedeParticipar } = await getParticipacionComunidad(post.comunidad_id, userId)
  return { post, puedeParticipar }
}

export const getComunidades = async (req, res) => {
  const { search } = req.query
  try {
    const [comunidades, misSolicitudes] = await Promise.all([
      prisma.comunidad.findMany({
        where: search ? { nombre: { contains: search, mode: 'insensitive' } } : {},
        include: {
          creador: { select: { id_usuario: true, nombre_usuario: true } },
          miembros: {
            where: { estado: 'aceptado' },
            select: { usuario_id: true },
          },
          _count: {
            select: {
              posts: true,
            },
          },
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
        miembros_count: c.miembros.filter((miembro) => miembro.usuario_id !== c.creador_id).length,
        posts_count: c._count.posts,
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
      prisma.postComunidad.deleteMany({ where: { comunidad_id: Number(id) } }),
      prisma.solicitudComunidad.deleteMany({ where: { comunidad_id: Number(id) } }),
      prisma.comunidad.delete({ where: { id: Number(id) } }),
    ])
    res.json({ ok: true })
  } catch (err) {
    console.error('deleteComunidad:', err)
    res.status(500).json({ error: 'Error al eliminar comunidad' })
  }
}

export const getPostsComunidad = async (req, res) => {
  const comunidadId = Number(req.params.id)
  if (!Number.isInteger(comunidadId)) return res.status(400).json({ error: 'Comunidad inválida' })

  try {
    const { comunidad, puedeParticipar } = await getParticipacionComunidad(comunidadId, req.user.id)
    if (!comunidad) return res.status(404).json({ error: 'Comunidad no encontrada' })
    if (!puedeParticipar) return res.status(403).json({ error: 'Tenés que ser miembro de la comunidad' })

    const posts = await prisma.postComunidad.findMany({
      where: { comunidad_id: comunidadId },
      include: {
        autor: { select: { id_usuario: true, nombre_usuario: true, rol: true } },
        likes: { where: { usuario_id: req.user.id }, select: { usuario_id: true } },
        comentarios: {
          include: { autor: { select: { id_usuario: true, nombre_usuario: true, rol: true } } },
          orderBy: { created_at: 'asc' },
        },
        _count: { select: { likes: true, comentarios: true } },
      },
      orderBy: { created_at: 'desc' },
    })
    res.json(posts.map((post) => formatPostComunidad(post, req.user.id)))
  } catch (err) {
    console.error('getPostsComunidad:', err)
    res.status(500).json({ error: 'Error al obtener posteos' })
  }
}

export const createPostComunidad = async (req, res) => {
  const comunidadId = Number(req.params.id)
  const contenido = req.body.contenido?.trim()
  if (!Number.isInteger(comunidadId)) return res.status(400).json({ error: 'Comunidad inválida' })
  if (!contenido) return res.status(400).json({ error: 'El post no puede estar vacío' })
  if (contenido.length > 1000) return res.status(400).json({ error: 'El post no puede superar los 1000 caracteres' })

  try {
    const { comunidad, puedeParticipar } = await getParticipacionComunidad(comunidadId, req.user.id)
    if (!comunidad) return res.status(404).json({ error: 'Comunidad no encontrada' })
    if (!puedeParticipar) return res.status(403).json({ error: 'Tenés que ser miembro de la comunidad' })

    const post = await prisma.postComunidad.create({
      data: { comunidad_id: comunidadId, autor_id: req.user.id, contenido },
      include: {
        autor: { select: { id_usuario: true, nombre_usuario: true, rol: true } },
        likes: { where: { usuario_id: req.user.id }, select: { usuario_id: true } },
        comentarios: {
          include: { autor: { select: { id_usuario: true, nombre_usuario: true, rol: true } } },
          orderBy: { created_at: 'asc' },
        },
        _count: { select: { likes: true, comentarios: true } },
      },
    })
    res.status(201).json(formatPostComunidad(post, req.user.id))
  } catch (err) {
    console.error('createPostComunidad:', err)
    res.status(500).json({ error: 'Error al crear post' })
  }
}

export const deletePostComunidad = async (req, res) => {
  const postId = Number(req.params.postId)
  if (!Number.isInteger(postId)) return res.status(400).json({ error: 'Post inválido' })

  try {
    const post = await prisma.postComunidad.findUnique({
      where: { id: postId },
      include: { comunidad: { select: { creador_id: true } } },
    })
    if (!post) return res.status(404).json({ error: 'Post no encontrado' })
    if (post.autor_id !== req.user.id && post.comunidad.creador_id !== req.user.id) {
      return res.status(403).json({ error: 'Sin permisos para eliminar este post' })
    }

    await prisma.postComunidad.delete({ where: { id: postId } })
    res.json({ ok: true })
  } catch (err) {
    console.error('deletePostComunidad:', err)
    res.status(500).json({ error: 'Error al eliminar post' })
  }
}

export const toggleLikePostComunidad = async (req, res) => {
  const postId = Number(req.params.postId)
  if (!Number.isInteger(postId)) return res.status(400).json({ error: 'Post inválido' })

  try {
    const { post, puedeParticipar } = await ensurePuedeParticiparPost(postId, req.user.id)
    if (!post) return res.status(404).json({ error: 'Post no encontrado' })
    if (!puedeParticipar) return res.status(403).json({ error: 'Tenés que ser miembro de la comunidad' })

    const existing = await prisma.likePostComunidad.findUnique({
      where: { post_id_usuario_id: { post_id: postId, usuario_id: req.user.id } },
    })

    if (existing) {
      await prisma.likePostComunidad.delete({ where: { id: existing.id } })
    } else {
      await prisma.likePostComunidad.create({ data: { post_id: postId, usuario_id: req.user.id } })
    }

    const likesCount = await prisma.likePostComunidad.count({ where: { post_id: postId } })
    res.json({ liked: !existing, likes_count: likesCount })
  } catch (err) {
    console.error('toggleLikePostComunidad:', err)
    res.status(500).json({ error: 'Error al actualizar like' })
  }
}

export const createComentarioPostComunidad = async (req, res) => {
  const postId = Number(req.params.postId)
  const contenido = req.body.contenido?.trim()
  if (!Number.isInteger(postId)) return res.status(400).json({ error: 'Post inválido' })
  if (!contenido) return res.status(400).json({ error: 'El comentario no puede estar vacío' })
  if (contenido.length > 500) return res.status(400).json({ error: 'El comentario no puede superar los 500 caracteres' })

  try {
    const { post, puedeParticipar } = await ensurePuedeParticiparPost(postId, req.user.id)
    if (!post) return res.status(404).json({ error: 'Post no encontrado' })
    if (!puedeParticipar) return res.status(403).json({ error: 'Tenés que ser miembro de la comunidad' })

    const comentario = await prisma.comentarioPostComunidad.create({
      data: { post_id: postId, autor_id: req.user.id, contenido },
      include: { autor: { select: { id_usuario: true, nombre_usuario: true, rol: true } } },
    })
    const comentariosCount = await prisma.comentarioPostComunidad.count({ where: { post_id: postId } })
    res.status(201).json({ comentario, comentarios_count: comentariosCount })
  } catch (err) {
    console.error('createComentarioPostComunidad:', err)
    res.status(500).json({ error: 'Error al comentar' })
  }
}

export const deleteComentarioPostComunidad = async (req, res) => {
  const comentarioId = Number(req.params.comentarioId)
  if (!Number.isInteger(comentarioId)) return res.status(400).json({ error: 'Comentario inválido' })

  try {
    const comentario = await prisma.comentarioPostComunidad.findUnique({
      where: { id: comentarioId },
      include: { post: { include: { comunidad: { select: { creador_id: true } } } } },
    })
    if (!comentario) return res.status(404).json({ error: 'Comentario no encontrado' })
    if (comentario.autor_id !== req.user.id && comentario.post.comunidad.creador_id !== req.user.id) {
      return res.status(403).json({ error: 'Sin permisos para eliminar este comentario' })
    }

    await prisma.comentarioPostComunidad.delete({ where: { id: comentarioId } })
    const comentariosCount = await prisma.comentarioPostComunidad.count({ where: { post_id: comentario.post_id } })
    res.json({ ok: true, post_id: comentario.post_id, comentarios_count: comentariosCount })
  } catch (err) {
    console.error('deleteComentarioPostComunidad:', err)
    res.status(500).json({ error: 'Error al eliminar comentario' })
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