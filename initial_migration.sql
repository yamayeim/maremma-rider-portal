-- DropForeignKey
ALTER TABLE "public"."DeliveryJob" DROP CONSTRAINT "DeliveryJob_riderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RiderDocument" DROP CONSTRAINT "RiderDocument_riderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RiderPayout" DROP CONSTRAINT "RiderPayout_riderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RiderZone" DROP CONSTRAINT "RiderZone_riderId_fkey";

-- DropTable
DROP TABLE "public"."Rider";

-- DropTable
DROP TABLE "public"."RiderDocument";

-- DropTable
DROP TABLE "public"."RiderPayout";

-- DropTable
DROP TABLE "public"."RiderZone";

-- DropEnum
DROP TYPE "public"."RiderStatus";

-- DropEnum
DROP TYPE "public"."PayoutStatus";

-- CreateTable
CREATE TABLE "public"."LoginToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PortalOrderStatus" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "orderGid" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortalOrderStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PortalSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortalSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PrintJob" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "payloadText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "printedAt" TIMESTAMP(3),
    "lastError" TEXT,

    CONSTRAINT "PrintJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Restaurant" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "collectionHandle" TEXT NOT NULL,
    "collectionGid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "printerToken" TEXT,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RestaurantUser" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "inviteCodeHash" TEXT,

    CONSTRAINT "RestaurantUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoginToken_tokenHash_key" ON "public"."LoginToken"("tokenHash" ASC);

-- CreateIndex
CREATE INDEX "LoginToken_userId_idx" ON "public"."LoginToken"("userId" ASC);

-- CreateIndex
CREATE INDEX "PortalOrderStatus_shop_restaurantId_idx" ON "public"."PortalOrderStatus"("shop" ASC, "restaurantId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PortalOrderStatus_shop_restaurantId_orderGid_key" ON "public"."PortalOrderStatus"("shop" ASC, "restaurantId" ASC, "orderGid" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PortalSession_sessionTokenHash_key" ON "public"."PortalSession"("sessionTokenHash" ASC);

-- CreateIndex
CREATE INDEX "PortalSession_userId_idx" ON "public"."PortalSession"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PrintJob_idempotencyKey_key" ON "public"."PrintJob"("idempotencyKey" ASC);

-- CreateIndex
CREATE INDEX "PrintJob_restaurantId_status_createdAt_idx" ON "public"."PrintJob"("restaurantId" ASC, "status" ASC, "createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_collectionHandle_key" ON "public"."Restaurant"("collectionHandle" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_printerToken_key" ON "public"."Restaurant"("printerToken" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantUser_email_key" ON "public"."RestaurantUser"("email" ASC);

-- CreateIndex
CREATE INDEX "DeliveryJob_shop_restaurantId_idx" ON "public"."DeliveryJob"("shop" ASC, "restaurantId" ASC);

-- AddForeignKey
ALTER TABLE "public"."LoginToken" ADD CONSTRAINT "LoginToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."RestaurantUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PortalSession" ADD CONSTRAINT "PortalSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."RestaurantUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrintJob" ADD CONSTRAINT "PrintJob_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RestaurantUser" ADD CONSTRAINT "RestaurantUser_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

