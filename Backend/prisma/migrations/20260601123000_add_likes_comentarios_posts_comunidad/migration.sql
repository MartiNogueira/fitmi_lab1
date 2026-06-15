-- CreateTable
CREATE TABLE "LikePostComunidad" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LikePostComunidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComentarioPostComunidad" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "contenido" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComentarioPostComunidad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LikePostComunidad_post_id_usuario_id_key" ON "LikePostComunidad"("post_id", "usuario_id");

-- CreateIndex
CREATE INDEX "LikePostComunidad_usuario_id_idx" ON "LikePostComunidad"("usuario_id");

-- CreateIndex
CREATE INDEX "ComentarioPostComunidad_post_id_created_at_idx" ON "ComentarioPostComunidad"("post_id", "created_at");

-- CreateIndex
CREATE INDEX "ComentarioPostComunidad_autor_id_idx" ON "ComentarioPostComunidad"("autor_id");

-- AddForeignKey
ALTER TABLE "LikePostComunidad" ADD CONSTRAINT "LikePostComunidad_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "PostComunidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikePostComunidad" ADD CONSTRAINT "LikePostComunidad_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioPostComunidad" ADD CONSTRAINT "ComentarioPostComunidad_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "PostComunidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioPostComunidad" ADD CONSTRAINT "ComentarioPostComunidad_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
