-- AlterTable: restructure User for AD auth (remove gamification fields, add AD fields)
ALTER TABLE "User" DROP COLUMN IF EXISTS "password";
ALTER TABLE "User" DROP COLUMN IF EXISTS "sector";
ALTER TABLE "User" DROP COLUMN IF EXISTS "level";
ALTER TABLE "User" DROP COLUMN IF EXISTS "xp";
ALTER TABLE "User" DROP COLUMN IF EXISTS "avatar";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "adUsername" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "department" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "allowRemoteAccess" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- Make adUsername NOT NULL after backfill (already NULL-safe in new installs)
-- CreateUniqueIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_adUsername_key" ON "User"("adUsername");

-- CreateTable: UserGameProfile (gamification separated)
CREATE TABLE IF NOT EXISTS "UserGameProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "avatar" JSONB DEFAULT '{"skinColor":"d9b28a","hair":"short01","hairColor":"4e2b16","eyes":"variant01","mouth":"happy01","beard":null,"clothing":"variant01","clothingColor":"65c9f0","accessories":[],"backgroundColor":"1e293b","glasses":null,"glassesColor":"a0a0a0","hat":null,"hatColor":"252525"}',

    CONSTRAINT "UserGameProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserGameProfile_userId_key" ON "UserGameProfile"("userId");

-- AddForeignKey
ALTER TABLE "UserGameProfile" ADD CONSTRAINT "UserGameProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
