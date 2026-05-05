import prisma from '../db/prisma.js'

export const getPostsByCommunity = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id
  try {
    const posts = await prisma.post.findMany({
      where: { comunidad_id: Number(id) },
      include: {
        autor: { select: { id_usuario: true, nombre_usuario: true } },
        _count: { select: { likes: true, comentarios: true } },
        likes: {
          where: { usuario_id: userId },
          select: { usuario_id: true }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    const result = posts.map((p) => ({
      ...p,
      total_likes: p._count.likes,
      total_comentarios: p._count.comentarios,
      liked: p.likes.length > 0
    }))

    res.json(result)
  } catch (err) {
    console.error('getPostsByCommunity:', err)
    res.status(500).json({ error: 'Error al obtener posts' })
  }
}

export const createPost = async (req, res) => {
  const { id } = req.params
  const { contenido } = req.body
  const userId = req.user.id

  if (!contenido?.trim()) {
    return res.status(400).json({ error: 'El contenido es requerido' })
  }

  try {
    // Verificar que el usuario es miembro
    const miembro = await prisma.usuarioComunidad.findUnique({
      where: {
        usuario_id_comunidad_id: {
          usuario_id: userId,
          comunidad_id: Number(id)
        }
      }
    })

    if (!miembro) {
      return res.status(403).json({ error: 'Debes ser miembro para publicar' })
    }

    const post = await prisma.post.create({
      data: {
        contenido: contenido.trim(),
        autor_id: userId,
        comunidad_id: Number(id)
      },
      include: {
        autor: { select: { id_usuario: true, nombre_usuario: true } }
      }
    })

    res.status(201).json({
      ...post,
      total_likes: 0,
      total_comentarios: 0,
      liked: false
    })
  } catch (err) {
    console.error('createPost:', err)
    res.status(500).json({ error: 'Error al crear el post' })
  }
}

export const deletePost = async (req, res) => {
  const { postId } = req.params
  const userId = req.user.id
  try {
    const post = await prisma.post.findUnique({
      where: { id: Number(postId) },
      include: { comunidad: true }
    })

    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' })
    }

    const puedeEliminar = post.autor_id === userId || post.comunidad.creador_id === userId
    if (!puedeEliminar) {
      return res.status(403).json({ error: 'No tenés permiso para eliminar este post' })
    }

    await prisma.post.delete({ where: { id: Number(postId) } })
    res.json({ message: 'Post eliminado' })
  } catch (err) {
    console.error('deletePost:', err)
    res.status(500).json({ error: 'Error al eliminar el post' })
  }
}

export const toggleLike = async (req, res) => {
  const { postId } = req.params
  const userId = req.user.id
  try {
    const existing = await prisma.postLike.findUnique({
      where: {
        usuario_id_post_id: {
          usuario_id: userId,
          post_id: Number(postId)
        }
      }
    })

    if (existing) {
      await prisma.postLike.delete({
        where: {
          usuario_id_post_id: {
            usuario_id: userId,
            post_id: Number(postId)
          }
        }
      })
      return res.json({ liked: false })
    }

    await prisma.postLike.create({
      data: { usuario_id: userId, post_id: Number(postId) }
    })
    res.json({ liked: true })
  } catch (err) {
    console.error('toggleLike:', err)
    res.status(500).json({ error: 'Error al procesar el like' })
  }
}

export const getComentarios = async (req, res) => {
  const { postId } = req.params
  try {
    const comentarios = await prisma.comentario.findMany({
      where: { post_id: Number(postId) },
      include: {
        autor: { select: { id_usuario: true, nombre_usuario: true } }
      },
      orderBy: { created_at: 'asc' }
    })
    res.json(comentarios)
  } catch (err) {
    console.error('getComentarios:', err)
    res.status(500).json({ error: 'Error al obtener comentarios' })
  }
}

export const createComentario = async (req, res) => {
  const { postId } = req.params
  const { contenido } = req.body
  const userId = req.user.id

  if (!contenido?.trim()) {
    return res.status(400).json({ error: 'El contenido es requerido' })
  }

  try {
    const comentario = await prisma.comentario.create({
      data: {
        contenido: contenido.trim(),
        autor_id: userId,
        post_id: Number(postId)
      },
      include: {
        autor: { select: { id_usuario: true, nombre_usuario: true } }
      }
    })
    res.status(201).json(comentario)
  } catch (err) {
    console.error('createComentario:', err)
    res.status(500).json({ error: 'Error al crear el comentario' })
  }
}

export const deleteComentario = async (req, res) => {
  const { postId, comentarioId } = req.params
  const userId = req.user.id
  try {
    const comentario = await prisma.comentario.findUnique({
      where: { id: Number(comentarioId) },
      include: {
        post: { include: { comunidad: true } }
      }
    })

    if (!comentario) {
      return res.status(404).json({ error: 'Comentario no encontrado' })
    }

    const puedeEliminar =
      comentario.autor_id === userId ||
      comentario.post.comunidad.creador_id === userId

    if (!puedeEliminar) {
      return res.status(403).json({ error: 'No tenés permiso para eliminar este comentario' })
    }

    await prisma.comentario.delete({ where: { id: Number(comentarioId) } })
    res.json({ message: 'Comentario eliminado' })
  } catch (err) {
    console.error('deleteComentario:', err)
    res.status(500).json({ error: 'Error al eliminar el comentario' })
  }
}