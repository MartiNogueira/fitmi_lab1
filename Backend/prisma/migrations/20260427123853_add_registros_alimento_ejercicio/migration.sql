-- CreateTable
CREATE TABLE "RegistroAlimento" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nombre" TEXT NOT NULL,
    "calorias" INTEGER NOT NULL,
    "proteinas" DOUBLE PRECISION,
    "carbohidratos" DOUBLE PRECISION,
    "grasas" DOUBLE PRECISION,
    "momento" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroAlimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroEjercicio" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nombre" TEXT NOT NULL,
    "series" INTEGER,
    "repeticiones" INTEGER,
    "duracion_min" INTEGER,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroEjercicio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RegistroAlimento" ADD CONSTRAINT "RegistroAlimento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroEjercicio" ADD CONSTRAINT "RegistroEjercicio_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
