-- DropForeignKey
ALTER TABLE "public"."Device" DROP CONSTRAINT "Device_plantId_fkey";

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
