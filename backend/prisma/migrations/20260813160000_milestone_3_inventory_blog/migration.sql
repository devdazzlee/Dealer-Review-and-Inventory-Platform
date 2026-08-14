-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Dealer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "description" TEXT,
    "logo" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "googleRating" DOUBLE PRECISION,
    "googleReviewCount" INTEGER,
    "yelpRating" DOUBLE PRECISION,
    "yelpReviewCount" INTEGER,
    "carfaxRating" DOUBLE PRECISION,
    "carfaxUrl" TEXT,
    "autoSalesReviewsRating" DOUBLE PRECISION,
    "platformRating" DOUBLE PRECISION,
    "platformReviewCount" INTEGER NOT NULL DEFAULT 0,
    "combinedRating" DOUBLE PRECISION,
    "manualRatingOverride" DOUBLE PRECISION,
    "useManualRating" BOOLEAN NOT NULL DEFAULT false,
    "hasBadge" BOOLEAN NOT NULL DEFAULT false,
    "badgeYear" INTEGER,
    "autoDevDealerId" TEXT,
    "googlePlaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dealer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "mileage" INTEGER,
    "bodyStyle" TEXT,
    "fuelType" TEXT,
    "transmission" TEXT,
    "exteriorColor" TEXT,
    "interiorColor" TEXT,
    "condition" TEXT,
    "price" DOUBLE PRECISION,
    "description" TEXT,
    "features" TEXT[],
    "photos" TEXT[],
    "cachedPhotoCount" INTEGER NOT NULL DEFAULT 0,
    "autoDevListingId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'catalog',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL DEFAULT 'Staff Writer',
    "authorBio" TEXT,
    "featuredImageUrl" TEXT,
    "featuredImageAlt" TEXT,
    "body" JSONB NOT NULL,
    "faqs" JSONB NOT NULL,
    "metaTitle" TEXT NOT NULL,
    "metaDescription" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "job" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "added" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "removed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "overallRating" INTEGER NOT NULL,
    "customerServiceRating" INTEGER,
    "qualityRating" INTEGER,
    "friendlinessRating" INTEGER,
    "pricingRating" INTEGER,
    "recommend" BOOLEAN,
    "title" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3),
    "visitType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewHelpful" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "helpful" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewHelpful_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewReport" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "ipAddress" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ReviewReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatingSourceSettings" (
    "id" TEXT NOT NULL,
    "googleEnabled" BOOLEAN NOT NULL DEFAULT true,
    "yelpEnabled" BOOLEAN NOT NULL DEFAULT true,
    "carfaxEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoSalesReviewsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "platformEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RatingSourceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAccount" (
    "id" TEXT NOT NULL DEFAULT 'admin',
    "passwordHash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedVehicle" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "userId" TEXT,
    "vehicleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dealer_slug_key" ON "Dealer"("slug");

-- CreateIndex
CREATE INDEX "Dealer_state_idx" ON "Dealer"("state");

-- CreateIndex
CREATE INDEX "Dealer_city_idx" ON "Dealer"("city");

-- CreateIndex
CREATE INDEX "Dealer_featured_idx" ON "Dealer"("featured");

-- CreateIndex
CREATE INDEX "Dealer_combinedRating_idx" ON "Dealer"("combinedRating");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "Vehicle"("vin");

-- CreateIndex
CREATE INDEX "Vehicle_dealerId_idx" ON "Vehicle"("dealerId");

-- CreateIndex
CREATE INDEX "Vehicle_make_idx" ON "Vehicle"("make");

-- CreateIndex
CREATE INDEX "Vehicle_bodyStyle_idx" ON "Vehicle"("bodyStyle");

-- CreateIndex
CREATE INDEX "Vehicle_price_idx" ON "Vehicle"("price");

-- CreateIndex
CREATE INDEX "Vehicle_year_idx" ON "Vehicle"("year");

-- CreateIndex
CREATE INDEX "Vehicle_isActive_idx" ON "Vehicle"("isActive");

-- CreateIndex
CREATE INDEX "Vehicle_source_idx" ON "Vehicle"("source");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_published_publishedAt_idx" ON "BlogPost"("published", "publishedAt");

-- CreateIndex
CREATE INDEX "BlogPost_category_idx" ON "BlogPost"("category");

-- CreateIndex
CREATE INDEX "BlogPost_featured_idx" ON "BlogPost"("featured");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE INDEX "Review_dealerId_idx" ON "Review"("dealerId");

-- CreateIndex
CREATE INDEX "Review_status_idx" ON "Review"("status");

-- CreateIndex
CREATE INDEX "Review_email_dealerId_idx" ON "Review"("email", "dealerId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_email_dealerId_key" ON "Review"("email", "dealerId");

-- CreateIndex
CREATE INDEX "ReviewHelpful_visitorId_idx" ON "ReviewHelpful"("visitorId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewHelpful_reviewId_visitorId_key" ON "ReviewHelpful"("reviewId", "visitorId");

-- CreateIndex
CREATE INDEX "ReviewReport_status_idx" ON "ReviewReport"("status");

-- CreateIndex
CREATE INDEX "ReviewReport_createdAt_idx" ON "ReviewReport"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewReport_reviewId_ipAddress_key" ON "ReviewReport"("reviewId", "ipAddress");

-- CreateIndex
CREATE INDEX "SavedVehicle_visitorId_idx" ON "SavedVehicle"("visitorId");

-- CreateIndex
CREATE INDEX "SavedVehicle_userId_idx" ON "SavedVehicle"("userId");

-- CreateIndex
CREATE INDEX "SavedVehicle_vehicleId_idx" ON "SavedVehicle"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedVehicle_visitorId_vehicleId_key" ON "SavedVehicle"("visitorId", "vehicleId");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewHelpful" ADD CONSTRAINT "ReviewHelpful_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

