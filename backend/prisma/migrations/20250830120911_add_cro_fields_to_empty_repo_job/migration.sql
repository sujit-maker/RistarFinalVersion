-- AlterTable
ALTER TABLE "EmptyRepoJob" ADD COLUMN     "firstCroGenerationDate" TIMESTAMP(3),
ADD COLUMN     "hasCroGenerated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Shipment" ALTER COLUMN "gsDate" DROP NOT NULL;
