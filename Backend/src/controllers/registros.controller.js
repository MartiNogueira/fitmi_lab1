import prisma from '../db/prisma.js'

// ── Peso corporal ─────────────────────────────────────────────────────────────

export const getPesoCorporal = async (req, res) => {
  try {
    const registros = await prisma.pesoCorporal.findMany({
      where: { usuario_id: req.user.id },
      orderBy: { fecha: 'desc' },
    })

    let semanas_sin_registrar = null
    if (registros.length > 0) {
      const ultimo = new Date(registros[0].fecha)
      const hoy = new Date()
      const diff = Math.floor((hoy - ultimo) / (1000 * 60 * 60 * 24 * 7))
      semanas_sin_registrar = diff
    }

    res.json({ registros, semanas_sin_registrar })
  } catch (err) {
    console.error('getPesoCorporal:', err)
    res.status(500).json({ error: 'Error al obtener registros de peso' })
  }
}

export const registrarPesoCorporal = async (req, res) => {
  const { peso_kg, fecha } = req.body
  if (!peso_kg) return res.status(400).json({ error: 'El peso es requerido' })
  try {
    const registro = await prisma.pesoCorporal.create({
      data: {
        usuario_id: req.user.id,
        peso_kg: Number(peso_kg),
        fecha: fecha ? new Date(fecha) : new Date(),
      },
    })
    res.status(201).json(registro)
  } catch (err) {
    console.error('registrarPesoCorporal:', err)
    res.status(500).json({ error: 'Error al registrar peso' })
  }
}

// ── Resumen semanal de un usuario (para profesionales) ────────────────────────

export const getResumenSemanal = async (req, res) => {
  const { usuario_id } = req.params
  try {
    // Verificar que el profesional está vinculado al usuario
    const vinculo = await prisma.vinculo.findFirst({
      where: {
        profesional_id: req.user.id,
        usuario_id: Number(usuario_id),
        estado: 'activo',
      },
    })
    if (!vinculo && req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'No tenés acceso a este usuario' })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: Number(usuario_id) },
      select: { id_usuario: true, nombre_usuario: true, email: true },
    })
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })

    const hoy = new Date()
    hoy.setHours(23, 59, 59, 999)
    const diaSemana = (new Date().getDay() + 6) % 7
    const lunesActual = new Date()
    lunesActual.setDate(new Date().getDate() - diaSemana)
    lunesActual.setHours(0, 0, 0, 0)

    const [rutina, plan] = await Promise.all([
      prisma.rutina.findFirst({ where: { usuario_id: Number(usuario_id) }, orderBy: { created_at: 'desc' } }),
      prisma.planAlimenticio.findFirst({ where: { usuario_id: Number(usuario_id) }, orderBy: { created_at: 'desc' } }),
    ])

    const [ejerciciosSemana, comidasSemana, pesosSemana] = await Promise.all([
      rutina ? prisma.ejercicioCompletado.findMany({
        where: { usuario_id: Number(usuario_id), rutina_id: rutina.id, fecha: { gte: lunesActual, lte: hoy } },
        orderBy: { fecha: 'asc' },
      }) : [],
      plan ? prisma.comidaCompletada.findMany({
        where: { usuario_id: Number(usuario_id), plan_id: plan.id, fecha: { gte: lunesActual, lte: hoy } },
        orderBy: { fecha: 'asc' },
      }) : [],
      prisma.pesoCorporal.findMany({
        where: { usuario_id: Number(usuario_id) },
        orderBy: { fecha: 'desc' },
        take: 2,
      }),
    ])

    const totalEjercicios = rutina?.ejercicios?.reduce((s, d) => s + (d.ejercicios?.length ?? 0), 0) ?? 0
    const totalComidas = plan?.dias?.reduce((s, d) => s + (d.comidas?.length ?? 0), 0) ?? 0

    // Progresión de peso por ejercicio
    const ejercicioMap = {}
    ejerciciosSemana.forEach(e => {
      if (!ejercicioMap[e.ejercicio_nombre]) ejercicioMap[e.ejercicio_nombre] = []
      ejercicioMap[e.ejercicio_nombre].push({
        fecha: new Date(e.fecha).toISOString().split('T')[0],
        peso_kg: e.peso_kg,
        reps_realizadas: e.reps_realizadas,
        notas: e.notas,
      })
    })

    const detalle_reemplazos = comidasSemana
      .filter(c => c.estado === 'reemplazada')
      .map(c => ({
        comida_nombre: c.comida_nombre,
        descripcion_reemplazo: c.descripcion_reemplazo,
        gramos: c.gramos,
        fecha: new Date(c.fecha).toISOString().split('T')[0],
      }))

    const ultimo_peso = pesosSemana[0] ?? null
    const peso_anterior = pesosSemana[1] ?? null

    res.json({
      usuario,
      semana: { inicio: lunesActual.toISOString().split('T')[0], fin: hoy.toISOString().split('T')[0] },
      entrenamiento: {
        dias_completados: new Set(ejerciciosSemana.map(e => new Date(e.fecha).toISOString().split('T')[0])).size,
        dias_totales: rutina?.dias_semana ?? 0,
        ejercicios_completados: ejerciciosSemana.length,
        ejercicios_totales: totalEjercicios,
        progresion: Object.entries(ejercicioMap).map(([nombre, registros]) => ({ nombre, registros })),
      },
      alimentacion: {
        comidas_completadas: comidasSemana.filter(c => c.estado === 'completada').length,
        comidas_omitidas: comidasSemana.filter(c => c.estado === 'omitida').length,
        comidas_reemplazadas: comidasSemana.filter(c => c.estado === 'reemplazada').length,
        comidas_totales: totalComidas,
        detalle_reemplazos,
      },
      peso_corporal: {
        ultimo_peso: ultimo_peso?.peso_kg ?? null,
        fecha_ultimo_peso: ultimo_peso ? new Date(ultimo_peso.fecha).toISOString().split('T')[0] : null,
        variacion: ultimo_peso && peso_anterior
          ? Number((ultimo_peso.peso_kg - peso_anterior.peso_kg).toFixed(1))
          : null,
      },
    })
  } catch (err) {
    console.error('getResumenSemanal:', err)
    res.status(500).json({ error: 'Error al obtener resumen semanal' })
  }
}
