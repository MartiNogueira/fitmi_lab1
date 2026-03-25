-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('cliente', 'entrenador', 'nutricionista', 'admin');

-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "estado" "Estado" NOT NULL DEFAULT 'aprobado',
ADD COLUMN     "rol" "Rol" NOT NULL DEFAULT 'cliente';

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" SERIAL NOT NULL,
    "destinatario_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_destinatario_id_fkey" FOREIGN KEY ("destinatario_id") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
