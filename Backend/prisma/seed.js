import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcrypt'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const hash = await bcrypt.hash('admin123', 10)
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@fitmi.com' },
    update: {},
    create: {
      nombre_usuario: 'Admin',
      email: 'admin@fitmi.com',
      contrasena: hash,
      rol: 'admin',
      estado: 'aprobado',
    },
  })
  console.log('Admin creado:', admin.email, '/ contraseña: admin123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
