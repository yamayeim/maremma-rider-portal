import crypto from "node:crypto";

export const DELIVERY_FEE_EUR = 2.50; // Fixed fee global constraint

/**
 * Validates the Shopify HMAC signature using the raw request body.
 * Must be executed before any JSON parsing.
 */
export async function verifyShopifyWebhookHmac(request: Request, rawBody: string): Promise<boolean> {
    const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
    if (!hmacHeader) return false;

    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!secret) return false;

    const generatedHash = crypto
        .createHmac("sha256", secret)
        .update(rawBody, "utf8")
        .digest("base64");

    const generatedBuffer = Buffer.from(generatedHash);
    const headerBuffer = Buffer.from(hmacHeader);

    if (generatedBuffer.length !== headerBuffer.length) {
        console.warn("[Shopify Webhook] Security Alert: HMAC header length mismatch. Rejecting.");
        return false;
    }

    return crypto.timingSafeEqual(generatedBuffer, headerBuffer);
}

/**
 * Detects if the order stringently qualifies as a Delivery order.
 * Uses a robust combined strategy of tags, note attributes, shipping lines, and address presence.
 */
export function isDeliveryOrder(payload: any): boolean {
    // 1. Explicitly reject if there is no shipping address (e.g., pure pickup or digital)
    if (!payload.shipping_address) return false;

    // 2. Check explicit order tags
    const tags = payload.tags?.toLowerCase() || "";
    if (tags.includes("delivery") || tags.includes("consegna") || tags.includes("local delivery")) {
        return true;
    }

    // 3. Check note attributes (often used by Local Delivery apps)
    const noteAttributes = payload.note_attributes || [];
    const hasDeliveryMarker = noteAttributes.some((attr: any) =>
        attr.name?.toLowerCase().includes("delivery") ||
        attr.value?.toLowerCase().includes("delivery") ||
        attr.name?.toLowerCase().includes("consegna")
    );
    if (hasDeliveryMarker) return true;

    // 4. Check actual shipping methods/lines calculated by Shopify checkout
    const shippingLines = payload.shipping_lines || [];
    for (const line of shippingLines) {
        const title = line.title?.toLowerCase() || "";
        const code = line.code?.toLowerCase() || "";
        if (title.includes("consegna") || title.includes("delivery") || code.includes("local_delivery")) {
            return true;
        }
    }

    // If it has a shipping address but NO explicit delivery shipping methods or tags were found,
    // we assume it is a standard postal order or unhandled type, NOT a local courier delivery.
    return false;
}

/**
 * Resolves the restaurant identity from Shopify order payload.
 */
export function resolveRestaurantFromOrder(payload: any) {
    let restaurantName = "Partner Maremma To Go";
    let pickupAddress = "Sito Maremma To Go - Grosseto";
    const pickupArea = "Centro";

    const lineItems = payload.line_items || [];
    if (lineItems.length > 0) {
        const firstVendor = lineItems[0].vendor;
        if (firstVendor && firstVendor.toLowerCase() !== "maremma to go") {
            restaurantName = firstVendor;
        } else {
            const props = lineItems[0].properties || [];
            const restProp = props.find((p: any) => p.name === "_restaurant" || p.name === "Ristorante");
            if (restProp?.value) restaurantName = restProp.value;
        }
    }
    return { restaurantName, pickupAddress, pickupArea };
}

/**
 * Safely extracts and structures customer delivery location data.
 */
export function formatCustomerDeliveryData(payload: any) {
    const shipping = payload.shipping_address;
    if (!shipping) return null;

    return {
        customerName: `${shipping.first_name || ""} ${shipping.last_name || ""}`.trim() || payload.customer?.first_name || "Cliente",
        customerPhone: shipping.phone || payload.customer?.phone || null,
        deliveryAddress: shipping.address1 || "",
        deliveryAddress2: shipping.address2 || null,
        deliveryCity: shipping.city || "Grosseto",
        deliveryProvince: shipping.province || null,
        deliveryZip: shipping.zip || null,
        deliveryArea: shipping.city || "Grosseto"
    };
}
