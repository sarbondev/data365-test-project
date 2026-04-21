-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('uz', 'ru');

-- AlterTable
ALTER TABLE "OtpVerification" ADD COLUMN     "locale" "Locale" NOT NULL DEFAULT 'uz';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "locale" "Locale" NOT NULL DEFAULT 'uz';
