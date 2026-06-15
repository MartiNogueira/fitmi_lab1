CREATE TABLE "EmailLog" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "usuario_id" INTEGER,
    "destinatario" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailLog_tipo_usuario_id_created_at_idx" ON "EmailLog"("tipo", "usuario_id", "created_at");
