import { v2 as cloudinary } from 'cloudinary'
import { mkdir, unlink, writeFile } from 'fs/promises'
import { dirname, extname, resolve } from 'path'
import { fileURLToPath } from 'url'
import prisma from '../db/prisma.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const uploadsDir = resolve(__dirname, '../../uploads/progreso')
const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME
  && process.env.CLOUDINARY_API_KEY
  && process.env.CLOUDINARY_API_SECRET
)

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'fitmi/progreso', resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result))
    )
    stream.end(buffer)
  })

const extensionFromFile = (file) => {
  const originalExt = extname(file.originalname || '').toLowerCase()
  if (originalExt) return originalExt
  if (file.mimetype === 'image/png') return '.png'
  if (file.mimetype === 'image/webp') return '.webp'
  return '.jpg'
}

const uploadLocal = async (req) => {
  await mkdir(uploadsDir, { recursive: true })
  const filename = `${req.user.id}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extensionFromFile(req.file)}`
  await writeFile(resolve(uploadsDir, filename), req.file.buffer)
  return {
    secure_url: `${req.protocol}://${req.get('host')}/uploads/progreso/${filename}`,
    public_id: `local:${filename}`,
  }
}

export const subirFoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen' })

  const { descripcion, fecha } = req.body
  try {
    const result = hasCloudinaryConfig
      ? await uploadToCloudinary(req.file.buffer)
      : await uploadLocal(req)
    const foto = await prisma.fotoProgreso.create({
      data: {
        usuario_id: req.user.id,
        url: result.secure_url,
        public_id: result.public_id,
        descripcion: descripcion?.trim() || null,
        fecha: fecha ? new Date(fecha) : new Date(),
      },
    })
    res.status(201).json(foto)
  } catch (err) {
    console.error('subirFoto:', err)
    res.status(500).json({ error: 'Error al subir la foto' })
  }
}

export const getFotos = async (req, res) => {
  try {
    const fotos = await prisma.fotoProgreso.findMany({
      where: { usuario_id: req.user.id },
      orderBy: { fecha: 'desc' },
    })
    res.json(fotos)
  } catch (err) {
    console.error('getFotos:', err)
    res.status(500).json({ error: 'Error al obtener fotos' })
  }
}

export const deleteFoto = async (req, res) => {
  const { id } = req.params
  try {
    const foto = await prisma.fotoProgreso.findUnique({ where: { id: Number(id) } })
    if (!foto || foto.usuario_id !== req.user.id) {
      return res.status(404).json({ error: 'Foto no encontrada' })
    }
    if (foto.public_id?.startsWith('local:')) {
      await unlink(resolve(uploadsDir, foto.public_id.replace('local:', ''))).catch(() => {})
    } else if (hasCloudinaryConfig) {
      await cloudinary.uploader.destroy(foto.public_id)
    }
    await prisma.fotoProgreso.delete({ where: { id: Number(id) } })
    res.json({ message: 'Foto eliminada' })
  } catch (err) {
    console.error('deleteFoto:', err)
    res.status(500).json({ error: 'Error al eliminar la foto' })
  }
}
