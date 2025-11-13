/*
  Warnings:

  - The values [author] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `videoUrl` on the `challenge` table. All the data in the column will be lost.
  - Added the required column `img_url` to the `challenge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `video_url` to the `challenge` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('member', 'creator', 'admin');
ALTER TABLE "public"."user" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "user" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'member';
COMMIT;

-- AlterTable
ALTER TABLE "challenge" DROP COLUMN "videoUrl",
ADD COLUMN     "img_url" TEXT NOT NULL,
ADD COLUMN     "video_url" TEXT NOT NULL;
