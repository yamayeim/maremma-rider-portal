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
        const isCancelled = !!payload.cancelled_at;

        // 3. Handle Cancellations, Ignore Creations
        if (isCancelled) {
            await prisma.deliveryJob.updateMany({
                where: {
                    orderGid: payload.admin_graphql_api_id || `gid://shopify/Order/${shopifyOrderId}`,
                    status: "OPEN" // Only cancel if it hasn't been picked up yet
                },
                data: { status: "CANCELLED" }
            });
            console.log(`[Shopify Webhook] SUCCESS: Cancelled OPEN DeliveryJob for order ${shopifyOrderId}.`);
            return new Response("Delivery Job Cancelled", { status: 200 });
        }
        
        console.log(`[Shopify Webhook] Ignored creation for order ${shopifyOrderId} - Must be created via Restaurant Portal.`);
        return new Response("Creation Ignored", { status: 200 });

    } catch (e) {
        // Global hook error boundary securely swallowing trace data
        console.error("[Shopify Webhook] Fatal internal processing error caught: ", e instanceof Error ? e.message : e);
        return new Response("Internal Server Error", { status: 500 });
    }
}
