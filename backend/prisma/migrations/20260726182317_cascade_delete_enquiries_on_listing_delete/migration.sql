-- DropForeignKey
ALTER TABLE "enquiries" DROP CONSTRAINT "enquiries_listing_id_fkey";

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("listing_id") ON DELETE CASCADE ON UPDATE CASCADE;
