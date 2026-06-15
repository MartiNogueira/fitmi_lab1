-- CreateTable
CREATE TABLE "PostComunidad" (
    "id" SERIAL NOT NULL,
    "comunidad_id" INTEGER NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "contenido" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostComunidad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostComunidad_comunidad_id_created_at_idx" ON "PostComunidad"("comunidad_id", "created_at");

-- CreateIndex
CREATE INDEX "PostComunidad_autor_id_idx" ON "PostComunidad"("autor_id");

-- AddForeignKey
ALTER TABLE "PostComunidad" ADD CONSTRAINT "PostComunidad_comunidad_id_fkey" FOREIGN KEY ("comunidad_id") REFERENCES "Comunidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostComunidad" ADD CONSTRAINT "PostComunidad_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
