import type { Route } from "./+types/api.delivery-jobs";
import { prisma } from "~/db.server";
import { Prisma } from "@prisma/client";

export async function action({ request }: Route.ActionArgs) {
    if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    const apiSecret = process.env.RIDER_API_SECRET?.trim();
    if (!apiSecret) {
        console.error("[API Delivery Jobs] RIDER_API_SECRET is missing or empty.");
        return new Response("Service Unavailable", { status: 503 });
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${apiSecret}`) {
        console.error("[API Delivery Jobs] Unauthorized access attempt.");
        return new Response("Unauthorized", { status: 401 });
    }

    let payload;
    try {
        payload = await request.json();
    } catch (e) {
        console.error("[API Delivery Jobs] Malformed JSON payload.");
        return new Response("Bad Request: Malformed JSON", { status: 400 });
    }

    const {
        shop,
        restaurantId,
        restaurantName,
        orderGid,
        shopifyOrderName,
        fee,
        fulfillmentMethod,
        deliveryAddress,
        pickupAddress,
        restaurantPhone,
        customerName,
        customerPhone,
        requestedAt
    } = payload;

    if (!shop || !restaurantId || !orderGid || !fulfillmentMethod) {
        console.error("[API Delivery Jobs] Missing required fields.");
        return new Response("Bad Request: Missing required fields", { status: 400 });
    }

    const normalizedMethod = fulfillmentMethod.toLowerCase();
    if (normalizedMethod !== "consegna" && normalizedMethod !== "delivery") {
        console.log(`[API Delivery Jobs] Ignored non-delivery fulfillment method: ${fulfillmentMethod}`);
        return new Response(JSON.stringify({ ok: true, ignored: true }), { 
            status: 200, 
            headers: { "Content-Type": "application/json" } 
        });
    }

    try {
        // We use check-then-act + P2002 catch fallback to be idempotent.
        // We ensure we don't overwrite assigned riders or reset accepted/completed jobs.
        const existingJob = await prisma.deliveryJob.findUnique({
            where: {
                shop_restaurantId_orderGid: {
                    shop,
                    restaurantId,
                    orderGid
                }
            }
        });

        if (existingJob) {
            // If the job already exists, only update it if it's still OPEN
            if (existingJob.status === "OPEN") {
                const updatedJob = await prisma.deliveryJob.update({
                    where: { id: existingJob.id },
                    data: {
                        restaurantName: restaurantName ?? existingJob.restaurantName,
                        deliveryAddress: deliveryAddress ?? existingJob.deliveryAddress,
                        pickupAddress: (pickupAddress && pickupAddress.trim() !== "") ? pickupAddress : existingJob.pickupAddress,
                        restaurantPhone: (restaurantPhone && restaurantPhone.trim() !== "") ? restaurantPhone : existingJob.restaurantPhone,
                        customerName: customerName ?? existingJob.customerName,
                        customerPhone: customerPhone ?? existingJob.customerPhone
                    }
                });
                console.log(`[API Delivery Jobs] SUCCESS: Updated existing OPEN DeliveryJob for ${orderGid}`);
                return new Response(JSON.stringify({ ok: true, deliveryJobId: updatedJob.id, status: updatedJob.status }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" }
                });
            } else {
                console.log(`[API Delivery Jobs] Job ${orderGid} exists and is already ${existingJob.status}. No update performed.`);
                return new Response(JSON.stringify({ ok: true, deliveryJobId: existingJob.id, status: existingJob.status }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" }
                });
            }
        } else {
            // Create a new job
            const newJob = await prisma.deliveryJob.create({
                data: {
                    shop,
                    restaurantId,
                    orderGid,
                    shopifyOrderName,
                    fee: typeof fee === "number" ? fee : 2.50,
                    fulfillmentMethod,
                    deliveryAddress,
                    pickupAddress,
                    restaurantName,
                    restaurantPhone,
                    customerName,
                    customerPhone,
                    status: "OPEN",
                    requestedAt: requestedAt ? new Date(requestedAt) : new Date()
                }
            });
            console.log(`[API Delivery Jobs] SUCCESS: Created new DeliveryJob for ${orderGid}`);
            return new Response(JSON.stringify({ ok: true, deliveryJobId: newJob.id, status: newJob.status }), {
                status: 201,
                headers: { "Content-Type": "application/json" }
            });
        }
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            console.log(`[API Delivery Jobs] Delivery job already exists for ${orderGid} (caught P2002); returning existing job idempotently.`);
            try {
                const recoveredJob = await prisma.deliveryJob.findUnique({
                    where: { shop_restaurantId_orderGid: { shop, restaurantId, orderGid } }
                });
                if (recoveredJob) {
                    return new Response(JSON.stringify({ ok: true, deliveryJobId: recoveredJob.id, status: recoveredJob.status, recovered: true }), {
                        status: 200,
                        headers: { "Content-Type": "application/json" }
                    });
                }
            } catch (recoveryError) {
                console.error("[API Delivery Jobs] Failed to recover job after P2002:", recoveryError);
            }
        }

        console.error("[API Delivery Jobs] Database error:", e instanceof Error ? e.message : "Unknown error");
        return new Response("Internal Server Error", { status: 500 });
    }
}
