/*
  Warnings:

  - You are about to drop the column `calorias` on the `PlanAlimenticio` table. All the data in the column will be lost.
  - You are about to drop the column `comidas` on the `PlanAlimenticio` table. All the data in the column will be lost.
  - You are about to drop the column `dias` on the `Rutina` table. All the data in the column will be lost.
  - You are about to drop the `RegistroAlimento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RegistroEjercicio` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `dias` to the `PlanAlimenticio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dias_semana` to the `Rutina` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `ejercicios` on the `Rutina` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "RegistroAlimento" DROP CONSTRAINT "RegistroAlimento_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "RegistroEjercicio" DROP CONSTRAINT "RegistroEjercicio_usuario_id_fkey";

-- AlterTable
ALTER TABLE "PlanAlimenticio" DROP COLUMN "calorias",
DROP COLUMN "comidas",
ADD COLUMN     "dias" JSONB NOT NULL,
ADD COLUMN     "usuario_id" INTEGER;

-- AlterTable
ALTER TABLE "Rutina" DROP COLUMN "dias",
ADD COLUMN     "dias_semana" INTEGER NOT NULL,
ADD COLUMN     "usuario_id" INTEGER,
DROP COLUMN "ejercicios",
ADD COLUMN     "ejercicios" JSONB NOT NULL;

-- DropTable
DROP TABLE "RegistroAlimento";

-- DropTable
DROP TABLE "RegistroEjercicio";

-- CreateTable
CREATE TABLE "EjercicioCompletado" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "rutina_id" INTEGER NOT NULL,
    "dia_numero" INTEGER NOT NULL,
    "ejercicio_nombre" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EjercicioCompletado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComidaCompletada" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "dia_numero" INTEGER NOT NULL,
    "comida_nombre" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComidaCompletada_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Rutina" ADD CONSTRAINT "Rutina_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanAlimenticio" ADD CONSTRAINT "PlanAlimenticio_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EjercicioCompletado" ADD CONSTRAINT "EjercicioCompletado_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EjercicioCompletado" ADD CONSTRAINT "EjercicioCompletado_rutina_id_fkey" FOREIGN KEY ("rutina_id") REFERENCES "Rutina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComidaCompletada" ADD CONSTRAINT "ComidaCompletada_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComidaCompletada" ADD CONSTRAINT "ComidaCompletada_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "PlanAlimenticio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
