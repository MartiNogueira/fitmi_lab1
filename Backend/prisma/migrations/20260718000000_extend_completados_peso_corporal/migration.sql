-- AlterTable EjercicioCompletado: agregar campos de detalle
ALTER TABLE "EjercicioCompletado" ADD COLUMN IF NOT EXISTS "peso_kg" DOUBLE PRECISION;
ALTER TABLE "EjercicioCompletado" ADD COLUMN IF NOT EXISTS "reps_realizadas" TEXT;
ALTER TABLE "EjercicioCompletado" ADD COLUMN IF NOT EXISTS "notas" TEXT;

-- AlterTable ComidaCompletada: agregar estado y detalles
ALTER TABLE "ComidaCompletada" ADD COLUMN IF NOT EXISTS "estado" TEXT NOT NULL DEFAULT 'completada';
ALTER TABLE "ComidaCompletada" ADD COLUMN IF NOT EXISTS "gramos" INTEGER;
ALTER TABLE "ComidaCompletada" ADD COLUMN IF NOT EXISTS "descripcion_reemplazo" TEXT;

-- CreateTable PesoCorporal
CREATE TABLE IF NOT EXISTS "PesoCorporal" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "peso_kg" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PesoCorporal_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PesoCorporal" ADD CONSTRAINT "PesoCorporal_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id_usuario")
  ON DELETE RESTRICT ON UPDATE CASCADE;
