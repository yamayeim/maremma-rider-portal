import type { Rider } from "@prisma/client";

export function checkEarningsThreshold(rider: Pick<Rider, "yearlyEarnings">) {
    const MAX_EARNINGS = 5000;

    return {
        isNearing: rider.yearlyEarnings >= 3500 && rider.yearlyEarnings < MAX_EARNINGS,
        isBlocked: rider.yearlyEarnings >= MAX_EARNINGS,
        percentage: Math.min((rider.yearlyEarnings / MAX_EARNINGS) * 100, 100)
    };
}

export function normalizeTownSlug(town?: string | null): string {
    if (!town) return "senza-zona";
    return town
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
}

const KNOWN_TOWNS = [
    "Orbetello",
    "Porto Santo Stefano",
    "Porto Ercole",
    "Castiglione della Pescaia",
    "Follonica",
    "Grosseto",
    "Albinia",
    "Talamone"
];

export function getJobTown(job: { deliveryAddress?: string | null, pickupAddress?: string | null, restaurantName?: string | null }): { name: string, slug: string } {
    const delivery = (job.deliveryAddress || "").toLowerCase();
    for (const t of KNOWN_TOWNS) {
        if (delivery.includes(t.toLowerCase())) return { name: t, slug: normalizeTownSlug(t) };
    }

    const pickup = `${job.pickupAddress || ""} ${job.restaurantName || ""}`.toLowerCase();
    for (const t of KNOWN_TOWNS) {
        if (pickup.includes(t.toLowerCase())) return { name: t, slug: normalizeTownSlug(t) };
    }

    return { name: "Senza zona", slug: "senza-zona" };
}
