import type { Route } from "./+types/webhook.shopify";
import { prisma } from "~/db.server";
import {
    verifyShopifyWebhookHmac,
    isDeliveryOrder,
    resolveRestaurantFromOrder,
    formatCustomerDeliveryData,
    DELIVERY_FEE_EUR
} from "~/utils/shopify.server";

export async function action({ request }: Route.ActionArgs) {
    // Top level method rejection (not wrapped in try/catch to fail fast and explicitly)
    if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        // 1. Raw Byte Verification First
        // HMAC MUST be calculated against exact raw payload bytes before JSON.parse
        const rawBody = await request.text();
        const isValid = await verifyShopifyWebhookHmac(request, rawBody);

        if (!isValid) {
            console.warn("[Shopify Webhook] Security rejection: Invalid HMAC signature.");
            return new Response("Unauthorized", { status: 401 });
        }

        let payload;
        try {
            payload = JSON.parse(rawBody);
        } catch (e) {
            console.error("[Shopify Webhook] Malformed JSON payload strictly rejected.");
            return new Response("Malformed Payload", { status: 400 });
        }

        const shopifyOrderId = payload.id?.toString();

        if (!shopifyOrderId) {
            console.warn("[Shopify Webhook] Missing order ID in payload from Shopify.");
            return new Response("Invalid payload", { status: 400 });
        }

        // 2. Delivery logic & Data Prep
        if (!isDeliveryOrder(payload)) {
            console.log(`[Shopify Webhook] Order ${shopifyOrderId} is not a delivery order. Ignored.`);
            return new Response("Not a delivery order. Ignored.", { status: 200 });
        }

        const customerData = formatCustomerDeliveryData(payload);
        if (!customerData) {
            console.warn(`[Shopify Webhook] Missing shipping address for delivery order ${shopifyOrderId}.`);
            return new Response("Missing shipping address", { status: 400 });
        }

        const restaurantData = resolveRestaurantFromOrder(payload);

        // 3. Create DeliveryJob relying on Database Unique Constraint
        try {
            await prisma.deliveryJob.create({
                data: {
                    shop: request.headers.get("x-shopify-shop-domain") || "maremma-to-go.myshopify.com",
                    restaurantId: restaurantData.restaurantName,
                    orderGid: payload.admin_graphql_api_id || `gid://shopify/Order/${shopifyOrderId}`,
                    shopifyOrderName: payload.name || `Web-${shopifyOrderId.slice(-4)}`,
                    status: "OPEN",
                    fee: DELIVERY_FEE_EUR,
                    fulfillmentMethod: "LOCAL_DELIVERY",
                    deliveryAddress: customerData.deliveryAddress,
                }
            });
        } catch (dbError: any) {
            // Prisma P2002: Unique constraint failed
            if (dbError.code === "P2002") {
                console.log(`[Shopify Webhook] Order ${shopifyOrderId} already exists (DB Constraint). Securely ignoring duplicate.`);
                return new Response("Order already synced", { status: 200 });
            }
            throw dbError; // Rethrow other actual DB failures to root exception handler
        }

        console.log(`[Shopify Webhook] SUCCESS: Created DeliveryJob for order ${shopifyOrderId}.`);
        return new Response("Delivery Job Created Successfully", { status: 201 });

    } catch (e) {
        // Global hook error boundary securely swallowing trace data
        console.error("[Shopify Webhook] Fatal internal processing error caught: ", e instanceof Error ? e.message : e);
        return new Response("Internal Server Error", { status: 500 });
    }
}
