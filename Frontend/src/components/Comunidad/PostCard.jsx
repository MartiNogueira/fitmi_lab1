import { useState } from 'react'

export default function PostCard({ post, esCreador, usuarioId, onEliminar }) {
  const [likes, setLikes] = useState(post._count?.likes ?? 0)
  const [liked, setLiked] = useState(post.likes?.some(l => l.usuario_id === usuarioId))
  const [mostrarComentarios, setMostrarComentarios] = useState(false)
  const [comentarios, setComentarios] = useState(post.comentarios ?? [])
  const [nuevoComentario, setNuevoComentario] = useState('')

  const puedeEliminar = esCreador || post.autor_id === usuarioId

  const toggleLike = async () => {
    const method = liked ? 'DELETE' : 'POST'
    await fetch(`/api/posts/${post.id}/likes`, {
      method,
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    setLiked(!liked)
    setLikes((n) => liked ? n - 1 : n + 1)
  }

  const handleEliminar = async () => {
    await fetch(`/api/posts/${post.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    onEliminar(post.id)
  }

  const handleComentario = async (e) => {
    if (e.key !== 'Enter' || !nuevoComentario.trim()) return
    const res = await fetch(`/api/posts/${post.id}/comentarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ contenido: nuevoComentario })
    })
    const nuevo = await res.json()
    setComentarios((prev) => [...prev, nuevo])
    setNuevoComentario('')
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#14532d] flex items-center justify-center text-xs font-semibold text-primary">
            {post.autor?.nombre_usuario?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{post.autor?.nombre_usuario}</span>
              {post.autor_id === post.comunidad?.creador_id && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-[#1a1020] text-purple-400 font-medium">
                  Creador
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(post.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        {puedeEliminar && (
          <button
            onClick={handleEliminar}
            className="text-xs text-muted-foreground hover:text-destructive border border-border hover:border-destructive rounded px-2 py-1 transition"
          >
            Eliminar
          </button>
        )}
      </div>

      <p className="text-sm text-foreground leading-relaxed mb-3">{post.contenido}</p>

      <div className="flex items-center gap-2 border-t border-border pt-3">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition ${
            liked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          ♥ {likes}
        </button>
        <button
          onClick={() => setMostrarComentarios(!mostrarComentarios)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded transition"
        >
          💬 {comentarios.length} comentarios
        </button>
      </div>

      {mostrarComentarios && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          {comentarios.map((c) => (
            <div key={c.id} className="flex gap-2 items-start">
              <div className="w-6 h-6 rounded-full bg-[#14532d] flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                {c.autor?.nombre_usuario?.slice(0, 2).toUpperCase()}
              </div>
              <div className="bg-secondary rounded-md px-3 py-2 flex-1">
                <span className="text-xs font-semibold text-foreground">{c.autor?.nombre_usuario}</span>
                <p className="text-xs text-foreground mt-0.5 leading-relaxed">{c.contenido}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2 items-center mt-2">
            <input
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              onKeyDown={handleComentario}
              placeholder="Comentá... (Enter para enviar)"
              className="flex-1 bg-secondary border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      )}
    </div>
  )
}