-- CreateTable
CREATE TABLE "FotoProgreso" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FotoProgreso_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FotoProgreso" ADD CONSTRAINT "FotoProgreso_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
