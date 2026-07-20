export default function MiembrosList({ miembros, creadorId }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
        {miembros.length} miembros
      </p>
      <div className="bg-card border border-border rounded-lg divide-y divide-border">
        {miembros.map((m) => (
          <div key={m.usuario_id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#14532d] flex items-center justify-center text-xs font-semibold text-primary">
                {m.usuario?.nombre_usuario?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{m.usuario?.nombre_usuario}</p>
                <p className="text-xs text-muted-foreground">
                  Se unió el {new Date(m.joined_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            {m.usuario_id === creadorId ? (
              <span className="text-xs px-2 py-0.5 rounded bg-[#1a1020] text-purple-400 font-medium">Creador</span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded bg-[#14532d] text-primary font-medium">Miembro</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}