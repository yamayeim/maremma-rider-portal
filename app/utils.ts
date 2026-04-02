import type { Rider } from "@prisma/client";

export function checkEarningsThreshold(rider: Pick<Rider, "yearlyEarnings">) {
    const MAX_EARNINGS = 5000;

    return {
        isNearing: rider.yearlyEarnings >= 3500 && rider.yearlyEarnings < MAX_EARNINGS,
        isBlocked: rider.yearlyEarnings >= MAX_EARNINGS,
        percentage: Math.min((rider.yearlyEarnings / MAX_EARNINGS) * 100, 100)
    };
}
