-- CreateTable
CREATE TABLE "Rutina" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "dias" INTEGER NOT NULL,
    "ejercicios" TEXT[],
    "entrenador_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rutina_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Rutina" ADD CONSTRAINT "Rutina_entrenador_id_fkey" FOREIGN KEY ("entrenador_id") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
