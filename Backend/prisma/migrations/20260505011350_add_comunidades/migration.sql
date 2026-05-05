-- CreateTable
CREATE TABLE "Comunidad" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "creador_id" INTEGER NOT NULL,
    "privada" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comunidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitudComunidad" (
    "id" SERIAL NOT NULL,
    "comunidad_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolicitudComunidad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Comunidad_nombre_key" ON "Comunidad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "SolicitudComunidad_comunidad_id_usuario_id_key" ON "SolicitudComunidad"("comunidad_id", "usuario_id");

-- AddForeignKey
ALTER TABLE "Comunidad" ADD CONSTRAINT "Comunidad_creador_id_fkey" FOREIGN KEY ("creador_id") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudComunidad" ADD CONSTRAINT "SolicitudComunidad_comunidad_id_fkey" FOREIGN KEY ("comunidad_id") REFERENCES "Comunidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudComunidad" ADD CONSTRAINT "SolicitudComunidad_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
