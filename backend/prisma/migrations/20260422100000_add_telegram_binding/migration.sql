CREATE TABLE "TelegramBinding" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TelegramBinding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TelegramBinding_phone_key" ON "TelegramBinding"("phone");
CREATE UNIQUE INDEX "TelegramBinding_chatId_key" ON "TelegramBinding"("chatId");
