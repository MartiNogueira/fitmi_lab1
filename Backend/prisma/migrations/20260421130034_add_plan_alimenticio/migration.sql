-- CreateTable
CREATE TABLE "PlanAlimenticio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "calorias" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "comidas" TEXT[],
    "nutricionista_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanAlimenticio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlanAlimenticio" ADD CONSTRAINT "PlanAlimenticio_nutricionista_id_fkey" FOREIGN KEY ("nutricionista_id") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
