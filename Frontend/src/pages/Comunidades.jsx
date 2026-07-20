import { useState, useEffect } from 'react'
import { ArrowLeft, Heart } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import {
  getComunidades,
  createComunidad,
  updateComunidad,
  deleteComunidad,
  solicitarUnirseAComunidad,
  getSolicitudesRecibidasComunidad,
  responderSolicitudComunidad,
  getPostsComunidad,
  createPostComunidad,
  deletePostComunidad,
  toggleLikePostComunidad,
  createComentarioPostComunidad,
  deleteComentarioPostComunidad,
} from '../api/auth'
import { useAuth } from '../context/AuthContext'

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

function formatPostDate(value) {
  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function TabButton({ active, onClick, children, badge }) {
  return (
    <button
      onClick={onClick}
      className="relative px-4 py-2 text-sm font-medium transition-colors"
      style={{ color: active ? '#22c55e' : '#666', borderBottom: active ? '2px solid #22c55e' : '2px solid transparent' }}
    >
      {children}
      {badge > 0 && (
        <span className="ml-1.5 px-1.5 py-0.5 text-xs font-bold rounded-full"
          style={{ backgroundColor: '#22c55e22', color: '#22c55e' }}>
          {badge}
        </span>
      )}
    </button>
  )
}

function ComunidadCard({ c, user, onSolicitar, solicitando, onEditar, onEliminar, eliminando, onPostCreated, onPostDeleted, onOpen, detailMode = false }) {
  const [expanded, setExpanded] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [posts, setPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postsLoaded, setPostsLoaded] = useState(false)
  const [postContenido, setPostContenido] = useState('')
  const [postError, setPostError] = useState('')
  const [publicando, setPublicando] = useState(false)
  const [eliminandoPost, setEliminandoPost] = useState(null)
  const [likeandoPost, setLikeandoPost] = useState(null)
  const [comentariosTexto, setComentariosTexto] = useState({})
  const [comentandoPost, setComentandoPost] = useState(null)
  const [eliminandoComentario, setEliminandoComentario] = useState(null)

  const estadoLabel = () => {
    if (c.es_creador) return { label: 'Tu comunidad', style: { color: '#22c55e', border: '1px solid #22c55e44', backgroundColor: '#0a1a0a' } }
    if (c.estado_solicitud === 'aceptado') return { label: 'Miembro', style: { color: '#22c55e', border: '1px solid #22c55e44', backgroundColor: '#0a1a0a' } }
    if (c.estado_solicitud === 'pendiente') return { label: 'Pendiente', style: { color: '#888', border: '1px solid #33333388', backgroundColor: '#111' } }
    if (c.estado_solicitud === 'rechazado') return { label: 'Rechazado', style: { color: '#ef4444', border: '1px solid #ef444444', backgroundColor: '#1a0a0a' } }
    return null
  }

  const badge = estadoLabel()
  const puedePostear = c.es_creador || c.estado_solicitud === 'aceptado'
  const isExpanded = detailMode || expanded

  useEffect(() => {
    if (!isExpanded || !puedePostear || postsLoaded || postsLoading) return

    setPostError('')
    setPostsLoading(true)
    getPostsComunidad(c.id)
      .then(({ data }) => {
        setPosts(data)
        setPostsLoaded(true)
      })
      .catch(() => setPostError('No se pudieron cargar los posteos'))
      .finally(() => setPostsLoading(false))
  }, [isExpanded, puedePostear, postsLoaded, postsLoading, c.id])

  const handleReintentarPosts = () => {
    setPostError('')
    setPostsLoaded(false)
  }

  const handleCrearPost = async (e) => {
    e.preventDefault()
    const contenido = postContenido.trim()
    if (!contenido) return

    setPublicando(true)
    setPostError('')
    try {
      const { data } = await createPostComunidad(c.id, contenido)
      setPosts((prev) => [data, ...prev])
      setPostContenido('')
      setPostsLoaded(true)
      onPostCreated(c.id)
    } catch (err) {
      setPostError(err.response?.data?.error || 'No se pudo publicar')
    } finally {
      setPublicando(false)
    }
  }

  const handleEliminarPost = async (postId) => {
    setEliminandoPost(postId)
    setPostError('')
    try {
      await deletePostComunidad(postId)
      setPosts((prev) => prev.filter((post) => post.id !== postId))
      onPostDeleted(c.id)
    } catch (err) {
      setPostError(err.response?.data?.error || 'No se pudo eliminar el post')
    } finally {
      setEliminandoPost(null)
    }
  }

  const handleToggleLike = async (postId) => {
    setLikeandoPost(postId)
    setPostError('')
    try {
      const { data } = await toggleLikePostComunidad(postId)
      setPosts((prev) => prev.map((post) => post.id === postId
        ? { ...post, liked_by_me: data.liked, likes_count: data.likes_count }
        : post
      ))
    } catch (err) {
      setPostError(err.response?.data?.error || 'No se pudo actualizar el like')
    } finally {
      setLikeandoPost(null)
    }
  }

  const handleCrearComentario = async (e, postId) => {
    e.preventDefault()
    const contenido = comentariosTexto[postId]?.trim()
    if (!contenido) return

    setComentandoPost(postId)
    setPostError('')
    try {
      const { data } = await createComentarioPostComunidad(postId, contenido)
      setPosts((prev) => prev.map((post) => post.id === postId
        ? {
            ...post,
            comentarios: [...(post.comentarios || []), data.comentario],
            comentarios_count: data.comentarios_count,
          }
        : post
      ))
      setComentariosTexto((prev) => ({ ...prev, [postId]: '' }))
    } catch (err) {
      setPostError(err.response?.data?.error || 'No se pudo comentar')
    } finally {
      setComentandoPost(null)
    }
  }

  const handleEliminarComentario = async (comentarioId) => {
    setEliminandoComentario(comentarioId)
    setPostError('')
    try {
      const { data } = await deleteComentarioPostComunidad(comentarioId)
      setPosts((prev) => prev.map((post) => post.id === data.post_id
        ? {
            ...post,
            comentarios: (post.comentarios || []).filter((comentario) => comentario.id !== comentarioId),
            comentarios_count: data.comentarios_count,
          }
        : post
      ))
    } catch (err) {
      setPostError(err.response?.data?.error || 'No se pudo eliminar el comentario')
    } finally {
      setEliminandoComentario(null)
    }
  }

  return (
    <div style={{ border: '1px solid #111', borderRadius: '10px', backgroundColor: '#000', overflow: 'hidden' }}>
      <div
        className={`flex items-start gap-4 p-4 ${detailMode ? '' : 'cursor-pointer'}`}
        onClick={() => {
          if (detailMode) return
          if (onOpen) onOpen(c)
          else setExpanded(!expanded)
        }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
          {initials(c.nombre)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: '#fff' }}>{c.nombre}</span>
            {badge && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={badge.style}>{badge.label}</span>
            )}
            {c.privada && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: '#888', border: '1px solid #33333388', backgroundColor: '#111' }}>Privada</span>
            )}
          </div>
          <p className="text-xs mt-0.5 truncate" style={{ color: '#555' }}>{c.descripcion}</p>
          <p className="text-xs mt-0.5" style={{ color: '#444' }}>
            {c.miembros_count} {c.miembros_count === 1 ? 'miembro' : 'miembros'} · {c.posts_count ?? 0} {(c.posts_count ?? 0) === 1 ? 'post' : 'posts'} · creada por {c.creador.nombre_usuario}
          </p>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4" style={{ borderTop: '1px solid #111' }}>
          <p className="text-sm mt-3" style={{ color: '#888' }}>{c.descripcion}</p>

          {!c.es_creador && !c.estado_solicitud && (
            <button
              className="mt-3 w-full py-2 text-sm font-semibold rounded-md"
              style={{ backgroundColor: '#22c55e', color: '#000', opacity: solicitando === c.id ? 0.6 : 1 }}
              disabled={solicitando === c.id}
              onClick={(e) => { e.stopPropagation(); onSolicitar(c.id) }}>
              {solicitando === c.id ? 'Enviando...' : c.privada ? 'Solicitar unirse' : 'Unirse'}
            </button>
          )}

          {c.es_creador && (
            <div className="mt-3 flex gap-2">
              <button
                className="flex-1 py-2 text-sm font-medium rounded-md"
                style={{ backgroundColor: '#111', color: '#aaa', border: '1px solid #222' }}
                onClick={(e) => { e.stopPropagation(); onEditar(c) }}>
                Editar
              </button>
              {!confirmando ? (
                <button
                  className="flex-1 py-2 text-sm font-medium rounded-md"
                  style={{ backgroundColor: '#1a0a0a', color: '#ef4444', border: '1px solid #ef444422' }}
                  onClick={(e) => { e.stopPropagation(); setConfirmando(true) }}>
                  Eliminar
                </button>
              ) : (
                <div className="flex-1 flex gap-1">
                  <button
                    className="flex-1 py-2 text-sm font-semibold rounded-md"
                    style={{ backgroundColor: '#ef4444', color: '#fff', opacity: eliminando === c.id ? 0.6 : 1 }}
                    disabled={eliminando === c.id}
                    onClick={(e) => { e.stopPropagation(); onEliminar(c.id) }}>
                    {eliminando === c.id ? '...' : 'Confirmar'}
                  </button>
                  <button
                    className="px-3 py-2 text-sm rounded-md"
                    style={{ backgroundColor: '#111', color: '#666', border: '1px solid #222' }}
                    onClick={(e) => { e.stopPropagation(); setConfirmando(false) }}>
                    No
                  </button>
                </div>
              )}
            </div>
          )}

          {puedePostear && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid #111' }}>
              <form onSubmit={handleCrearPost} className="flex flex-col gap-2">
                <textarea
                  value={postContenido}
                  onChange={(e) => setPostContenido(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Compartí algo con la comunidad..."
                  className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none"
                  style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', color: '#fff' }}
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs" style={{ color: '#444' }}>{postContenido.trim().length}/1000</span>
                  <button
                    type="submit"
                    disabled={publicando || !postContenido.trim()}
                    className="px-4 py-2 text-sm font-semibold rounded-md"
                    style={{ backgroundColor: '#22c55e', color: '#000', opacity: publicando || !postContenido.trim() ? 0.55 : 1 }}>
                    {publicando ? 'Publicando...' : 'Publicar'}
                  </button>
                </div>
              </form>

              {postError && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-md px-3 py-2"
                  style={{ backgroundColor: '#1a0a0a', border: '1px solid #ef444422' }}>
                  <p className="text-xs" style={{ color: '#ef4444' }}>{postError}</p>
                  {!postsLoaded && (
                    <button
                      type="button"
                      onClick={handleReintentarPosts}
                      className="text-xs font-semibold shrink-0"
                      style={{ color: '#ef4444' }}>
                      Reintentar
                    </button>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-col gap-3">
                {postsLoading ? (
                  <p className="text-xs" style={{ color: '#444' }}>Cargando posteos...</p>
                ) : postError && !postsLoaded ? (
                  null
                ) : posts.length === 0 ? (
                  <p className="text-xs py-3" style={{ color: '#444' }}>Todavía no hay posteos.</p>
                ) : (
                  posts.map((post) => {
                    const puedeEliminarPost = post.autor_id === user?.id || c.es_creador
                    return (
                      <div key={post.id} className="rounded-md p-3" style={{ backgroundColor: '#050505', border: '1px solid #111' }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium" style={{ color: '#fff' }}>{post.autor.nombre_usuario}</p>
                            <p className="text-xs" style={{ color: '#444' }}>{formatPostDate(post.created_at)}</p>
                          </div>
                          {puedeEliminarPost && (
                            <button
                              type="button"
                              disabled={eliminandoPost === post.id}
                              onClick={() => handleEliminarPost(post.id)}
                              className="text-xs px-2 py-1 rounded-md shrink-0"
                              style={{ color: '#ef4444', backgroundColor: '#1a0a0a', border: '1px solid #ef444422', opacity: eliminandoPost === post.id ? 0.5 : 1 }}>
                              {eliminandoPost === post.id ? '...' : 'Eliminar'}
                            </button>
                          )}
                        </div>
                        <p className="text-sm mt-2 whitespace-pre-wrap" style={{ color: '#aaa' }}>{post.contenido}</p>
                        <div className="mt-3 flex items-center gap-4">
                          <button
                            type="button"
                            disabled={likeandoPost === post.id}
                            onClick={() => handleToggleLike(post.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
                            style={{ color: post.liked_by_me ? '#ef4444' : '#666', opacity: likeandoPost === post.id ? 0.55 : 1 }}>
                            <Heart size={16} fill={post.liked_by_me ? '#ef4444' : 'none'} strokeWidth={1.8} />
                            <span>{post.likes_count ?? 0}</span>
                          </button>
                          <span className="text-xs" style={{ color: '#555' }}>
                            {post.comentarios_count ?? 0} {(post.comentarios_count ?? 0) === 1 ? 'comentario' : 'comentarios'}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-col gap-2">
                          {(post.comentarios || []).map((comentario) => {
                            const puedeEliminarComentario = comentario.autor_id === user?.id || c.es_creador
                            return (
                              <div key={comentario.id} className="rounded-md px-3 py-2" style={{ backgroundColor: '#090909', border: '1px solid #111' }}>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium" style={{ color: '#ddd' }}>{comentario.autor.nombre_usuario}</p>
                                    <p className="text-xs" style={{ color: '#444' }}>{formatPostDate(comentario.created_at)}</p>
                                  </div>
                                  {puedeEliminarComentario && (
                                    <button
                                      type="button"
                                      disabled={eliminandoComentario === comentario.id}
                                      onClick={() => handleEliminarComentario(comentario.id)}
                                      className="text-xs px-2 py-1 rounded-md shrink-0"
                                      style={{ color: '#ef4444', backgroundColor: '#1a0a0a', border: '1px solid #ef444422', opacity: eliminandoComentario === comentario.id ? 0.5 : 1 }}>
                                      {eliminandoComentario === comentario.id ? '...' : 'Eliminar'}
                                    </button>
                                  )}
                                </div>
                                <p className="text-sm mt-1 whitespace-pre-wrap" style={{ color: '#888' }}>{comentario.contenido}</p>
                              </div>
                            )
                          })}
                        </div>

                        <form onSubmit={(e) => handleCrearComentario(e, post.id)} className="mt-3 flex gap-2">
                          <input
                            value={comentariosTexto[post.id] || ''}
                            onChange={(e) => setComentariosTexto((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            maxLength={500}
                            placeholder="Escribí un comentario..."
                            className="min-w-0 flex-1 px-3 py-2 rounded-md text-sm outline-none"
                            style={{ backgroundColor: '#000', border: '1px solid #1a1a1a', color: '#fff' }}
                          />
                          <button
                            type="submit"
                            disabled={comentandoPost === post.id || !comentariosTexto[post.id]?.trim()}
                            className="px-3 py-2 text-sm font-semibold rounded-md"
                            style={{ backgroundColor: '#111', color: '#aaa', border: '1px solid #222', opacity: comentandoPost === post.id || !comentariosTexto[post.id]?.trim() ? 0.55 : 1 }}>
                            {comentandoPost === post.id ? '...' : 'Comentar'}
                          </button>
                        </form>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ComunidadFormModal({ comunidad, onClose, onGuardar }) {
  const esEdicion = !!comunidad
  const [form, setForm] = useState(
    esEdicion
      ? { nombre: comunidad.nombre, descripcion: comunidad.descripcion, privada: comunidad.privada }
      : { nombre: '', descripcion: '', privada: false }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = esEdicion
        ? await updateComunidad(comunidad.id, form)
        : await createComunidad(form)
      onGuardar(data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#00000099' }}>
      <div className="w-full max-w-md rounded-xl p-6" style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#fff' }}>
          {esEdicion ? 'Editar comunidad' : 'Nueva comunidad'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full px-3 py-2 rounded-md text-sm outline-none"
            style={{ backgroundColor: '#111', border: '1px solid #222', color: '#fff' }}
            required
          />
          <textarea
            placeholder="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none"
            style={{ backgroundColor: '#111', border: '1px solid #222', color: '#fff' }}
            required
          />
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#888' }}>
            <input
              type="checkbox"
              checked={form.privada}
              onChange={(e) => setForm({ ...form, privada: e.target.checked })}
              className="accent-green-500"
            />
            Comunidad privada (requiere aprobación)
          </label>
          {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 text-sm font-medium rounded-md"
              style={{ backgroundColor: '#111', color: '#666', border: '1px solid #222' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 text-sm font-semibold rounded-md"
              style={{ backgroundColor: '#22c55e', color: '#000', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Guardando...' : esEdicion ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Comunidades() {
  const { user } = useAuth()
  const [tab, setTab] = useState('explorar')
  const [comunidades, setComunidades] = useState([])
  const [solicitudesRecibidas, setSolicitudesRecibidas] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modalComunidad, setModalComunidad] = useState(null) // null = cerrado, false = crear, objeto = editar
  const [solicitando, setSolicitando] = useState(null)
  const [respondiendo, setRespondiendo] = useState(null)
  const [eliminando, setEliminando] = useState(null)
  const [comunidadActivaId, setComunidadActivaId] = useState(null)

  const fetchData = async () => {
    try {
      const [{ data: coms }, { data: sols }] = await Promise.all([
        getComunidades(),
        getSolicitudesRecibidasComunidad(),
      ])
      setComunidades(coms)
      setSolicitudesRecibidas(sols)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleSolicitar = async (id) => {
    setSolicitando(id)
    try {
      const { data } = await solicitarUnirseAComunidad(id)
      const nuevoEstado = data.estado
      setComunidades((prev) =>
        prev.map((c) => c.id === id
          ? { ...c, estado_solicitud: nuevoEstado, solicitud_id: data.id, miembros_count: nuevoEstado === 'aceptado' ? c.miembros_count + 1 : c.miembros_count }
          : c
        )
      )
    } catch {}
    setSolicitando(null)
  }

  const handleResponder = async (solicitudId, accion) => {
    setRespondiendo(solicitudId)
    try {
      await responderSolicitudComunidad(solicitudId, accion)
      setSolicitudesRecibidas((prev) => prev.filter((s) => s.id !== solicitudId))
    } catch {}
    setRespondiendo(null)
  }

  const handleGuardar = (data) => {
    if (modalComunidad) {
      // Edición: actualiza la comunidad en el array
      setComunidades((prev) => prev.map((c) => c.id === data.id ? { ...c, ...data } : c))
    } else {
      // Creación: agrega al inicio
      setComunidades((prev) => [{ ...data, miembros_count: 0, posts_count: 0, es_creador: true, estado_solicitud: null, creador: { id_usuario: user.id, nombre_usuario: user.name } }, ...prev])
    }
  }

  const handleEliminar = async (id) => {
    setEliminando(id)
    try {
      await deleteComunidad(id)
      setComunidades((prev) => prev.filter((c) => c.id !== id))
      if (comunidadActivaId === id) setComunidadActivaId(null)
    } catch {}
    setEliminando(null)
  }

  const comunidadesFiltradas = comunidades.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  )

  const misComunidades = comunidades.filter((c) => c.es_creador || c.estado_solicitud === 'aceptado')
  const comunidadActiva = comunidades.find((c) => c.id === comunidadActivaId) ?? null

  const handlePostCreated = (comunidadId) => {
    setComunidades((prev) => prev.map((c) => c.id === comunidadId ? { ...c, posts_count: (c.posts_count ?? 0) + 1 } : c))
  }

  const handlePostDeleted = (comunidadId) => {
    setComunidades((prev) => prev.map((c) => c.id === comunidadId ? { ...c, posts_count: Math.max((c.posts_count ?? 1) - 1, 0) } : c))
  }

  const cardProps = {
    user,
    onSolicitar: handleSolicitar,
    solicitando,
    onEditar: (c) => setModalComunidad(c),
    onEliminar: handleEliminar,
    eliminando,
    onPostCreated: handlePostCreated,
    onPostDeleted: handlePostDeleted,
  }

  const handleTabChange = (nextTab) => {
    setTab(nextTab)
    setComunidadActivaId(null)
  }

  return (
    <AppLayout>
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000' }}>
        <div className="mb-6 flex items-start justify-between" style={{ maxWidth: '720px' }}>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: '#fff' }}>Comunidades</h1>
            <p className="text-sm mt-1" style={{ color: '#666' }}>
              {loading ? '...' : `${comunidades.length} comunidad${comunidades.length !== 1 ? 'es' : ''}`}
            </p>
          </div>
          <button
            onClick={() => setModalComunidad(false)}
            className="px-4 py-2 text-sm font-semibold rounded-md"
            style={{ backgroundColor: '#22c55e', color: '#000' }}>
            + Crear
          </button>
        </div>

        <div className="flex border-b mb-4" style={{ maxWidth: '720px', borderColor: '#1a1a1a' }}>
          <TabButton active={tab === 'explorar'} onClick={() => handleTabChange('explorar')}>Explorar</TabButton>
          <TabButton active={tab === 'mis'} onClick={() => handleTabChange('mis')} badge={misComunidades.length}>
            Mis comunidades
          </TabButton>
          <TabButton active={tab === 'solicitudes'} onClick={() => handleTabChange('solicitudes')} badge={solicitudesRecibidas.length}>
            Solicitudes
          </TabButton>
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: '#444' }}>Cargando...</p>
        ) : (
          <div style={{ maxWidth: '720px' }}>
            {tab === 'explorar' && (
              comunidadActiva ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setComunidadActivaId(null)}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium transition-colors"
                    style={{ color: '#22c55e' }}>
                    <ArrowLeft size={18} />
                    Volver a explorar
                  </button>
                  <ComunidadCard c={comunidadActiva} {...cardProps} detailMode />
                </div>
              ) : (
                <>
                  <input
                    placeholder="Buscar comunidad..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full px-3 py-2 rounded-md text-sm outline-none mb-4"
                    style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', color: '#fff' }}
                  />
                  <div className="flex flex-col gap-3">
                    {comunidadesFiltradas.map((c) => (
                      <ComunidadCard key={c.id} c={c} {...cardProps} onOpen={(comunidad) => setComunidadActivaId(comunidad.id)} />
                    ))}
                    {comunidadesFiltradas.length === 0 && (
                      <div className="text-center py-16">
                        <p className="text-sm" style={{ color: '#444' }}>No se encontraron comunidades</p>
                      </div>
                    )}
                  </div>
                </>
              )
            )}

            {tab === 'mis' && (
              comunidadActiva ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setComunidadActivaId(null)}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium transition-colors"
                    style={{ color: '#22c55e' }}>
                    <ArrowLeft size={18} />
                    Volver a mis comunidades
                  </button>
                  <ComunidadCard c={comunidadActiva} {...cardProps} detailMode />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {misComunidades.map((c) => (
                    <ComunidadCard key={c.id} c={c} {...cardProps} onOpen={(comunidad) => setComunidadActivaId(comunidad.id)} />
                  ))}
                  {misComunidades.length === 0 && (
                    <div className="text-center py-16">
                      <p className="text-sm" style={{ color: '#444' }}>Todavía no sos parte de ninguna comunidad</p>
                      <button onClick={() => handleTabChange('explorar')} className="mt-2 text-sm" style={{ color: '#22c55e' }}>
                        Explorar comunidades
                      </button>
                    </div>
                  )}
                </div>
              )
            )}

            {tab === 'solicitudes' && (
              <div className="flex flex-col gap-3">
                {solicitudesRecibidas.map((s) => (
                  <div key={s.id} style={{ border: '1px solid #111', borderRadius: '10px', backgroundColor: '#000', overflow: 'hidden' }}>
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
                        {initials(s.usuario.nombre_usuario)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium" style={{ color: '#fff' }}>{s.usuario.nombre_usuario}</span>
                        <p className="text-xs" style={{ color: '#555' }}>{s.usuario.email}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#444' }}>
                          quiere unirse a <span style={{ color: '#888' }}>{s.comunidad.nombre}</span>
                        </p>
                      </div>
                      <span className="text-xs shrink-0" style={{ color: '#444' }}>
                        {new Date(s.created_at).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                    <div className="flex gap-2 px-4 pb-4">
                      <button
                        className="flex-1 py-2 text-sm font-semibold rounded-md"
                        style={{ backgroundColor: '#22c55e', color: '#000', opacity: respondiendo === s.id ? 0.6 : 1 }}
                        disabled={respondiendo === s.id}
                        onClick={() => handleResponder(s.id, 'aceptar')}>
                        Aceptar
                      </button>
                      <button
                        className="flex-1 py-2 text-sm font-semibold rounded-md"
                        style={{ border: '1px solid #ef444444', color: '#ef4444', backgroundColor: '#1a0a0a', opacity: respondiendo === s.id ? 0.6 : 1 }}
                        disabled={respondiendo === s.id}
                        onClick={() => handleResponder(s.id, 'rechazar')}>
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
                {solicitudesRecibidas.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-sm" style={{ color: '#444' }}>No hay solicitudes pendientes</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {modalComunidad !== null && (
        <ComunidadFormModal
          comunidad={modalComunidad || null}
          onClose={() => setModalComunidad(null)}
          onGuardar={handleGuardar}
        />
      )}
    </AppLayout>
  )
}