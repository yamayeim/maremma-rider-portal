import { redirect } from "react-router";
import { getSession } from "./sessions.server";
import { prisma } from "./db.server";
import type { Rider, DeliveryJobStatus, RiderStatus } from "@prisma/client";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export async function requireRider(request: Request) {
    const session = await getSession(request.headers.get("Cookie"));
    const riderId = session.get("riderId");

    if (!riderId) {
        throw redirect("/rider/login");
    }

    const rider = await prisma.rider.findUnique({
        where: { id: riderId },
    });

    if (!rider) {
        throw redirect("/rider/login");
    }

    return rider;
}

export async function requireActiveRider(request: Request) {
    const rider = await requireRider(request);

    if (rider.status !== "ACTIVE") {
        throw redirect("/rider/profile?error=account-not-active");
    }

    return rider;
}

export function checkEarningsThreshold(rider: Pick<Rider, "yearlyEarnings">) {
    const MAX_EARNINGS = 5000;

    return {
        isNearing: rider.yearlyEarnings >= 3500 && rider.yearlyEarnings < MAX_EARNINGS,
        isBlocked: rider.yearlyEarnings >= MAX_EARNINGS,
        percentage: Math.min((rider.yearlyEarnings / MAX_EARNINGS) * 100, 100)
    };
}

export function validateRiderAvailability(rider: Rider) {
    if (rider.status !== "ACTIVE") {
        return "Il tuo account non è attivo. Contatta l'amministrazione.";
    }

    if (!rider.availableNow) {
        return "Devi importare il tuo stato su 'Disponibile' per accettare consegne.";
    }

    const threshold = checkEarningsThreshold(rider);
    if (threshold.isBlocked) {
        return "Soglia forfettaria di €5.000 raggiunta. Non puoi accettare altre consegne.";
    }

    return null; // OK
}

export async function safeUpdateJobStatus(jobId: string, riderId: string, currentStatus: DeliveryJobStatus, targetStatus: DeliveryJobStatus) {
    // Basic transition rules map check
    const validTransitions: Record<string, string[]> = {
        "OPEN": ["ACCEPTED", "CANCELLED"],
        "ACCEPTED": ["PICKED_UP", "CANCELLED"],
        "PICKED_UP": ["DELIVERED"],
        "DELIVERED": [],
        "CANCELLED": []
    };

    if (!validTransitions[currentStatus]?.includes(targetStatus)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${targetStatus}`);
    }

    // Atomic verify and update via Prisma
    const result = await prisma.deliveryJob.updateMany({
        where: {
            id: jobId,
            status: currentStatus,
            ...(targetStatus !== "ACCEPTED" ? { riderId } : {}) // Limit to assigned rider if not just accepting
        },
        data: {
            status: targetStatus,
            ...(targetStatus === "ACCEPTED" ? { riderId, acceptedAt: new Date() } : {}),
            ...(targetStatus === "PICKED_UP" ? { pickedUpAt: new Date() } : {}),
            ...(targetStatus === "DELIVERED" ? { deliveredAt: new Date() } : {}),
        }
    });

    return result.count > 0; // True if update succeeded securely
}

export async function uploadProfileImage(file: File, riderId: string) {
    if (!file || file.size === 0) return null;

    const buffer = await file.arrayBuffer();
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const extension = file.name.split('.').pop() || 'png';
    const fileName = `rider-${riderId}-${Date.now()}.${extension}`;
    const filePath = path.join(uploadDir, fileName);

    await fs.writeFile(filePath, Buffer.from(buffer));

    return `/uploads/${fileName}`;
}
