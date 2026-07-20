import { v2 as cloudinary } from 'cloudinary'
import prisma from '../db/prisma.js'

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

export const subirFoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen' })

  const { descripcion, fecha } = req.body
  try {
    const result = await uploadToCloudinary(req.file.buffer)
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
    await cloudinary.uploader.destroy(foto.public_id)
    await prisma.fotoProgreso.delete({ where: { id: Number(id) } })
    res.json({ message: 'Foto eliminada' })
  } catch (err) {
    console.error('deleteFoto:', err)
    res.status(500).json({ error: 'Error al eliminar la foto' })
  }
}
