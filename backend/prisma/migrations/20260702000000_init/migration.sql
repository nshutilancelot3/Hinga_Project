-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "user_id" UUID NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "district" VARCHAR(50) NOT NULL,
    "language_pref" VARCHAR(10) NOT NULL DEFAULT 'rw',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "market_prices" (
    "price_id" UUID NOT NULL,
    "market_name" VARCHAR(80) NOT NULL,
    "crop_type" VARCHAR(80) NOT NULL,
    "price_rwf" DECIMAL(10,2) NOT NULL,
    "unit" VARCHAR(20) NOT NULL DEFAULT 'kg',
    "admin_id" UUID NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_prices_pkey" PRIMARY KEY ("price_id")
);

-- CreateTable
CREATE TABLE "listings" (
    "listing_id" UUID NOT NULL,
    "farmer_id" UUID NOT NULL,
    "crop_type" VARCHAR(80) NOT NULL,
    "quantity_kg" DECIMAL(10,2) NOT NULL,
    "price_per_kg" DECIMAL(10,2) NOT NULL,
    "district" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("listing_id")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "enquiry_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("enquiry_id")
);

-- CreateTable
CREATE TABLE "diagnosis_sessions" (
    "session_id" UUID NOT NULL,
    "farmer_id" UUID NOT NULL,
    "crop_type" VARCHAR(80) NOT NULL,
    "disease_name" VARCHAR(150) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "treatment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnosis_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "weather_cache" (
    "cache_id" UUID NOT NULL,
    "district" VARCHAR(50) NOT NULL,
    "forecast_json" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weather_cache_pkey" PRIMARY KEY ("cache_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "weather_cache_district_key" ON "weather_cache"("district");

-- AddForeignKey
ALTER TABLE "market_prices" ADD CONSTRAINT "market_prices_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("listing_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosis_sessions" ADD CONSTRAINT "diagnosis_sessions_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

