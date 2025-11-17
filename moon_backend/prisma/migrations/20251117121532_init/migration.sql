-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Edit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageData" TEXT NOT NULL,
    "presetName" TEXT NOT NULL DEFAULT 'Custom',
    "brightness" INTEGER NOT NULL DEFAULT 100,
    "contrast" INTEGER NOT NULL DEFAULT 100,
    "saturate" INTEGER NOT NULL DEFAULT 100,
    "blur" INTEGER NOT NULL DEFAULT 0,
    "hue" INTEGER NOT NULL DEFAULT 0,
    "temperature" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Edit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Edit_userId_idx" ON "Edit"("userId");

-- AddForeignKey
ALTER TABLE "Edit" ADD CONSTRAINT "Edit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
