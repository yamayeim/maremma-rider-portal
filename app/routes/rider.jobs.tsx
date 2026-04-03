import { requireActiveRider, validateRiderAvailability, safeUpdateJobStatus } from "~/utils.server";
import type { Route } from "./+types/rider.jobs";
import { prisma } from "~/db.server";
import { Card, CardContent } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Form, redirect } from "react-router";
import { Navigation } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
    const rider = await requireActiveRider(request);

    // Check if rider can access jobs at all
    const riderError = validateRiderAvailability(rider);
    if (riderError) throw redirect("/rider"); // Bounced to dashboard

    // Only fetch OPEN jobs using new index/enum
    const openJobs = await prisma.deliveryJob.findMany({
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" }
    });

    return { openJobs };
}

export async function action({ request }: Route.ActionArgs) {
    const rider = await requireActiveRider(request);

    // Re-verify on mutation 
    const riderError = validateRiderAvailability(rider);
    if (riderError) return { error: riderError };

    const formData = await request.formData();
    const jobId = formData.get("jobId");

    if (typeof jobId === "string") {
        const success = await safeUpdateJobStatus(jobId, rider.id, "OPEN", "ACCEPTED");
        if (!success) return { error: "Questa consegna è già stata presa da un altro rider o non è più disponibile." };

        return redirect(`/rider/jobs/${jobId}`);
    }

    return null;
}

export default function RiderJobs({ loaderData, actionData }: Route.ComponentProps) {
    const { openJobs } = loaderData;

    return (
        <div className="flex flex-col min-h-full pb-20 bg-gray-50">
            <div className="bg-white px-5 pt-12 pb-4 shadow-sm relative z-10 sticky top-0">
                <h1 className="text-2xl font-bold text-gray-900">Consegne disponibili</h1>
                <p className="text-gray-500 font-medium text-sm mt-1">Scegli la tua prossima corsa</p>
            </div>

            <div className="px-5 py-6 space-y-4">
                {actionData?.error && (
                    <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-700 text-sm font-medium shadow-sm">
                        {actionData.error}
                    </div>
                )}

                {openJobs.length === 0 ? (
                    <div className="text-center py-16 flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Navigation className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Nessuna richiesta</h3>
                        <p className="text-gray-500 mt-2 text-sm px-4">Al momento non ci sono ordini da consegnare. Riprova più tardi.</p>
                    </div>
                ) : (
                    openJobs.map((job) => (
                        <Card key={job.id} className="border-gray-200">
                            <CardContent className="p-0">
                                <div className="p-4 border-b border-gray-100">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-brand-50 text-brand-700 font-bold px-3 py-1 rounded-lg text-lg">
                                            € {job.fee.toFixed(2)}
                                        </div>
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded">
                                            Nuova
                                        </span>
                                    </div>

                                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                                        {/* Pickup */}
                                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-brand-500 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                                            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] ml-3 md:ml-0">
                                                <p className="font-semibold text-gray-900 text-sm">{job.restaurantName || "Ristorante"}</p>
                                                <p className="text-xs text-gray-500 line-clamp-1">{job.pickupAddress || "Ritiro in sede"}</p>
                                            </div>
                                        </div>
                                        {/* Delivery */}
                                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-300 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                                            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] ml-3 md:ml-0">
                                                <p className="font-semibold text-gray-900 text-sm">{job.customerName || "Cliente"}</p>
                                                <p className="text-xs text-gray-500 line-clamp-1">{job.deliveryAddress || "Indirizzo Sconosciuto"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-gray-50">
                                    <Form method="post">
                                        <input type="hidden" name="jobId" value={job.id} />
                                        <Button type="submit" fullWidth size="lg">
                                            Accetta Consegna
                                        </Button>
                                    </Form>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
