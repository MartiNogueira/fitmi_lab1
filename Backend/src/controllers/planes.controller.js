import prisma from '../db/prisma.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const mealCatalog = {
  equilibrada: {
    desayuno: [
      ['Yogur con granola y fruta', 'Yogur natural, granola y una fruta de estación.'],
      ['Tostadas integrales con palta y huevo', 'Dos tostadas con palta, huevo y tomate.'],
      ['Avena cocida con manzana', 'Avena con leche, manzana en cubos y canela.'],
      ['Licuado de banana y tostada', 'Licuado con leche o bebida vegetal y tostada integral.'],
      ['Omelette de queso y tomate', 'Omelette simple con tomate fresco y una fruta.'],
      ['Panqueques de avena', 'Panqueques de avena con fruta y yogur.'],
      ['Ricota con fruta y semillas', 'Ricota magra, frutas rojas y semillas.'],
    ],
    almuerzo: [
      ['Pollo con arroz integral y ensalada', 'Pechuga a la plancha, arroz integral y vegetales frescos.'],
      ['Tarta integral de verduras', 'Porción de tarta con ensalada de hojas verdes.'],
      ['Carne magra con puré de calabaza', 'Bife magro, puré de calabaza y ensalada.'],
      ['Ensalada completa con huevo', 'Huevo, legumbres, vegetales, arroz y aceite de oliva.'],
      ['Pasta integral con salsa de tomate', 'Pasta integral con tomate natural y queso rallado moderado.'],
      ['Wrap de pollo y vegetales', 'Tortilla integral con pollo, lechuga, tomate y zanahoria.'],
      ['Merluza con papas y ensalada', 'Filet al horno con papa natural y ensalada mixta.'],
    ],
    merienda: [
      ['Tostada integral con queso untable', 'Pan integral con queso untable y una infusión.'],
      ['Fruta con yogur', 'Una fruta fresca con yogur natural.'],
      ['Mix de frutos secos', 'Porción chica de frutos secos y mate o té.'],
      ['Sándwich integral de queso', 'Pan integral con queso fresco y tomate.'],
      ['Budín casero de avena', 'Porción moderada de budín de avena y fruta.'],
      ['Galletas de arroz con hummus', 'Dos galletas de arroz con hummus.'],
      ['Licuado de fruta', 'Licuado simple con fruta y leche.'],
    ],
    cena: [
      ['Tortilla de verduras', 'Tortilla con huevo, espinaca, cebolla y ensalada simple.'],
      ['Sopa de verduras con pollo', 'Sopa casera con verduras y pollo desmenuzado.'],
      ['Wok de vegetales con arroz', 'Vegetales salteados con arroz y salsa suave.'],
      ['Ensalada tibia de lentejas', 'Lentejas, zanahoria, huevo y vegetales verdes.'],
      ['Omelette con ensalada', 'Omelette de verduras con ensalada fresca.'],
      ['Hamburguesa casera con vegetales', 'Hamburguesa casera al plato con ensalada.'],
      ['Pescado al horno con calabaza', 'Pescado con calabaza asada y ensalada.'],
    ],
  },
  vegetariana: {
    desayuno: [
      ['Avena con banana y nueces', 'Avena cocida con banana, nueces y canela.'],
      ['Tostadas con hummus', 'Pan integral con hummus, tomate y semillas.'],
      ['Yogur con frutas y chía', 'Yogur natural con fruta y semillas de chía.'],
      ['Smoothie verde', 'Licuado de banana, espinaca, leche vegetal y avena.'],
      ['Panqueques de banana', 'Panqueques de banana y avena con fruta.'],
      ['Ricota con miel y nueces', 'Ricota, miel moderada, nueces y fruta.'],
      ['Porridge de cacao', 'Avena con cacao amargo y frutos rojos.'],
    ],
    almuerzo: [
      ['Bowl de garbanzos y quinoa', 'Garbanzos, quinoa, tomate, zanahoria y palta.'],
      ['Milanesas de berenjena', 'Berenjena al horno con ensalada y arroz.'],
      ['Hamburguesas de lentejas', 'Medallones de lentejas con puré y ensalada.'],
      ['Pasta con vegetales salteados', 'Pasta integral con zucchini, morrón y tomate.'],
      ['Tacos de porotos negros', 'Tortillas con porotos, vegetales y palta.'],
      ['Risotto de hongos', 'Arroz con hongos, queso y ensalada.'],
      ['Ensalada de tofu y arroz', 'Tofu dorado, arroz, vegetales y semillas.'],
    ],
    merienda: [
      ['Fruta con mantequilla de maní', 'Manzana o banana con una cucharada de mantequilla de maní.'],
      ['Yogur con avena', 'Yogur natural, avena y fruta.'],
      ['Tostada con palta', 'Pan integral con palta y limón.'],
      ['Hummus con bastones de zanahoria', 'Hummus casero con vegetales crudos.'],
      ['Barrita casera de cereal', 'Barrita de avena, frutos secos y semillas.'],
      ['Licuado de frutos rojos', 'Frutos rojos con leche o bebida vegetal.'],
      ['Queso fresco con fruta', 'Porción de queso fresco y fruta.'],
    ],
    cena: [
      ['Wok de tofu y vegetales', 'Tofu salteado con vegetales y arroz.'],
      ['Tortilla de espinaca', 'Tortilla con espinaca, cebolla y ensalada.'],
      ['Curry de garbanzos', 'Garbanzos con vegetales y arroz.'],
      ['Zapallitos rellenos', 'Zapallitos con arroz, queso y vegetales.'],
      ['Sopa crema de calabaza', 'Sopa de calabaza con semillas y tostada integral.'],
      ['Pizza integral de vegetales', 'Base integral con tomate, queso y verduras.'],
      ['Ensalada tibia de quinoa', 'Quinoa, vegetales asados y queso fresco.'],
    ],
  },
  'alta en proteínas': {
    desayuno: [
      ['Omelette de claras y tostada', 'Omelette con claras, huevo entero y pan integral.'],
      ['Yogur griego con avena', 'Yogur alto en proteínas con avena y fruta.'],
      ['Tostadas con atún y tomate', 'Pan integral con atún, tomate y limón.'],
      ['Huevos revueltos con queso', 'Huevos revueltos con queso magro y fruta.'],
      ['Batido proteico con banana', 'Proteína, banana, leche y hielo.'],
      ['Panqueques proteicos', 'Avena, huevo y yogur con fruta.'],
      ['Queso cottage con fruta', 'Queso cottage, fruta y semillas.'],
    ],
    almuerzo: [
      ['Carne magra con papa y ensalada', 'Carne magra, papa al horno y ensalada verde.'],
      ['Pollo grillado con quinoa', 'Pollo, quinoa y vegetales salteados.'],
      ['Tuna bowl', 'Atún, arroz, vegetales y palta.'],
      ['Pavo con batata', 'Pavo o pollo con batata y ensalada.'],
      ['Lentejas con huevo', 'Lentejas, huevo duro y vegetales.'],
      ['Salmón con arroz', 'Salmón o pescado con arroz y brócoli.'],
      ['Wrap proteico de pollo', 'Tortilla integral con pollo y vegetales.'],
    ],
    merienda: [
      ['Batido proteico con fruta', 'Leche o bebida vegetal, proteína y fruta.'],
      ['Yogur griego con nueces', 'Yogur alto en proteínas con nueces.'],
      ['Sándwich de pavo', 'Pan integral con pavo, queso y tomate.'],
      ['Huevos duros con tostada', 'Dos huevos duros y tostada integral.'],
      ['Ricota con frutos rojos', 'Ricota magra con frutos rojos.'],
      ['Queso fresco y galletas de arroz', 'Queso fresco con galletas de arroz.'],
      ['Licuado de leche y avena', 'Leche, avena y fruta.'],
    ],
    cena: [
      ['Pescado con vegetales', 'Filet de pescado con vegetales al vapor y aceite de oliva.'],
      ['Pollo al horno con ensalada', 'Pollo al horno con ensalada completa.'],
      ['Carne salteada con verduras', 'Carne magra en tiras con vegetales.'],
      ['Omelette proteico', 'Huevos, claras, queso magro y vegetales.'],
      ['Albóndigas caseras', 'Albóndigas magras con salsa natural y ensalada.'],
      ['Tacos de pollo', 'Tortillas con pollo, vegetales y yogur natural.'],
      ['Ensalada de atún y huevo', 'Atún, huevo, hojas verdes y papa chica.'],
    ],
  },
  keto: {
    desayuno: [
      ['Huevos revueltos con palta', 'Huevos, palta y semillas.'],
      ['Omelette de queso y espinaca', 'Huevos, queso, espinaca y aceite de oliva.'],
      ['Yogur natural con nueces', 'Yogur sin azúcar con nueces y chía.'],
      ['Huevos con panceta magra', 'Huevos con panceta magra y tomate.'],
      ['Palta rellena con huevo', 'Media palta con huevo y semillas.'],
      ['Queso y frutos secos', 'Queso semiduro con nueces.'],
      ['Tortilla de champiñones', 'Huevos con champiñones y queso.'],
    ],
    almuerzo: [
      ['Ensalada de pollo y frutos secos', 'Pollo, hojas verdes, queso, nueces y aceite de oliva.'],
      ['Carne con brócoli', 'Carne magra con brócoli y aceite de oliva.'],
      ['Hamburguesa al plato', 'Hamburguesa sin pan con queso, palta y ensalada.'],
      ['Salmón con espinaca', 'Salmón con espinaca salteada y limón.'],
      ['Pollo al curry con coliflor', 'Pollo con curry suave y arroz de coliflor.'],
      ['Ensalada de atún y palta', 'Atún, palta, huevo y hojas verdes.'],
      ['Zucchini relleno', 'Zucchini relleno con carne y queso.'],
    ],
    merienda: [
      ['Queso y aceitunas', 'Porción moderada de queso con aceitunas.'],
      ['Yogur con semillas', 'Yogur natural sin azúcar con chía.'],
      ['Palta con limón', 'Media palta con limón y sal.'],
      ['Rollitos de jamón y queso', 'Jamón cocido natural con queso.'],
      ['Frutos secos', 'Porción chica de nueces o almendras.'],
      ['Huevo duro', 'Huevo duro con infusión.'],
      ['Bastones de pepino con dip', 'Pepino con dip de queso crema.'],
    ],
    cena: [
      ['Carne con vegetales bajos en carbohidratos', 'Carne o pollo con brócoli, zucchini o espinaca.'],
      ['Omelette de vegetales', 'Huevos con queso y vegetales bajos en carbohidratos.'],
      ['Pollo con ensalada verde', 'Pollo grillado con hojas verdes y palta.'],
      ['Pescado con zucchini', 'Pescado al horno con zucchini salteado.'],
      ['Tacos con hojas de lechuga', 'Relleno de carne envuelto en hojas de lechuga.'],
      ['Salteado de cerdo y repollo', 'Cerdo magro con repollo salteado.'],
      ['Ensalada caprese con pollo', 'Tomate, queso, albahaca y pollo.'],
    ],
  },
}

const buildPlanLocal = ({ descripcion, tipo, objetivo, dias, restricciones }) => {
  const totalDias = Math.min(Math.max(Number(dias) || 7, 1), 7)
  const tipoKey = (tipo || 'Equilibrada').toLowerCase()
  const baseMeals = mealCatalog[tipoKey] || mealCatalog.equilibrada
  const restrictionText = restricciones?.trim() ? ` Ajustar por: ${restricciones.trim()}.` : ''
  const momentos = ['desayuno', 'almuerzo', 'merienda', 'cena']

  return {
    nombre: `Plan ${tipo || 'Equilibrada'} - ${objetivo || 'Mantenimiento'}`,
    objetivo: descripcion?.trim() || objetivo || 'Plan alimenticio generado para la semana',
    dias: Array.from({ length: totalDias }, (_, index) => ({
      dia: index + 1,
      nombre: DAY_NAMES[index] || `Día ${index + 1}`,
      comidas: momentos.map((momento, mealIndex) => {
        const options = baseMeals[momento]
        const [nombre, detalle] = options[(index + mealIndex) % options.length]
        return {
          nombre,
          momento,
          descripcion: `${detalle}${mealIndex === 0 && restrictionText ? restrictionText : ''}`,
        }
      }),
    })),
  }
}

export const generarPlanIA = async (req, res) => {
  if (req.user.rol !== 'cliente') {
    return res.status(403).json({ error: 'Solo los clientes pueden generar planes con IA' })
  }

  const { descripcion, tipo, objetivo, dias, restricciones } = req.body
  if (!descripcion?.trim()) {
    return res.status(400).json({ error: 'La descripción es requerida' })
  }

  if (!genAI) {
    return res.json(buildPlanLocal({ descripcion, tipo, objetivo, dias, restricciones }))
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
    res.json(buildPlanLocal({ descripcion, tipo, objetivo, dias, restricciones }))
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
      data: { nombre, objetivo, dias, usuario_id: req.user.id, nutricionista_id: req.user.id },
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
