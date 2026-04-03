import { requireActiveRider, safeUpdateJobStatus } from "~/utils.server";
import type { Route } from "./+types/rider.job-detail";
import { prisma } from "~/db.server";
import { Card, CardContent } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Form, redirect } from "react-router";
import { MapPin, Map, CheckCircle2, Store } from "lucide-react";

export async function loader({ request, params }: Route.LoaderArgs) {
    const rider = await requireActiveRider(request);

    const job = await prisma.deliveryJob.findUnique({
        where: { id: params.id }
    });

    if (!job || job.riderId !== rider.id) {
        throw redirect("/rider/jobs");
    }

    return { job };
}

export async function action({ request, params }: Route.ActionArgs) {
    const rider = await requireActiveRider(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    const job = await prisma.deliveryJob.findUnique({
        where: { id: params.id }
    });

    if (!job || job.riderId !== rider.id) {
        throw redirect("/rider/jobs");
    }

    if (intent === "pickup" && job.status === "ACCEPTED") {
        await safeUpdateJobStatus(job.id, rider.id, "ACCEPTED", "PICKED_UP");
    }

    if (intent === "deliver" && job.status === "PICKED_UP") {
        // Atomic transaction to deliver and increment rider earnings simultaneously
        await prisma.$transaction(async (tx) => {
            const updatedJob = await tx.deliveryJob.updateMany({
                where: { id: job.id, status: "PICKED_UP", riderId: rider.id },
                data: { status: "DELIVERED", deliveredAt: new Date() }
            });

            if (updatedJob.count > 0) {
                await tx.rider.update({
                    where: { id: rider.id },
                    data: {
                        yearlyEarnings: { increment: job.fee },
                        monthlyEarnings: { increment: job.fee }
                    }
                });
            }
        });

        return redirect("/rider"); // Complete and return home
    }

    return null;
}

export default function RiderJobDetail({ loaderData }: Route.ComponentProps) {
    const { job } = loaderData;

    const getMapLink = (address: string) => `https://maps.apple.com/?q=${encodeURIComponent(address)}`;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
            <div className="bg-brand-900 text-white px-5 pt-12 pb-6 shadow-md rounded-b-3xl">
                <div className="flex justify-between items-center mb-4">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold tracking-wide flex items-center gap-1">
                        #{job.shopifyOrderName || "Ordine N/A"}
                    </span>
                    <span className="font-bold text-xl">€{job.fee.toFixed(2)}</span>
                </div>
                <h1 className="text-2xl font-bold">
                    {job.status === "ACCEPTED" ? "Vai al Ristorante" : "Consegna al Cliente"}
                </h1>
            </div>

            <div className="px-5 -mt-4 relative z-10 space-y-4">
                {/* Restaurant Card (RITIRO) */}
                <Card className={`border-2 transition-colors ${job.status === "ACCEPTED" ? "border-brand-500 shadow-brand-500/20" : "border-gray-200 opacity-60"}`}>
                    <CardContent className="p-4">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                                <Store className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-brand-600 font-bold mb-1 uppercase tracking-wider">Ritiro</p>
                                <h3 className="font-bold text-gray-900 text-lg leading-tight">{job.restaurantName || "Ristorante"}</h3>
                                <p className="text-sm text-gray-500 mt-1">{job.pickupAddress || "Ritiro in sede"}</p>

                                {job.status === "ACCEPTED" && (
                                    <div className="mt-4 flex gap-2">
                                        {job.pickupAddress && (
                                            <a href={getMapLink(job.pickupAddress)} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 py-2 rounded-xl text-sm font-semibold transition-colors">
                                                <Map className="w-4 h-4" /> Mappe
                                            </a>
                                        )}
                                        {job.restaurantPhone && (
                                            <a href={`tel:${job.restaurantPhone}`} className="flex-1 flex items-center justify-center gap-2 bg-brand-50 hover:bg-brand-100 text-brand-700 py-2 rounded-xl text-sm font-semibold transition-colors">
                                                Chiama
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {job.status === "ACCEPTED" && (
                            <Form method="post" className="mt-4">
                                <input type="hidden" name="intent" value="pickup" />
                                <Button type="submit" size="lg" fullWidth>
                                    Conferma Ritiro
                                </Button>
                            </Form>
                        )}
                        {job.status === "PICKED_UP" && (
                            <div className="mt-4 flex items-center justify-center gap-2 text-green-600 bg-green-50 py-2 rounded-xl font-semibold">
                                <CheckCircle2 className="w-5 h-5" /> Ritirato
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Customer Card (CONSEGNA) */}
                <Card className={`border-2 transition-colors ${job.status === "PICKED_UP" ? "border-brand-500 shadow-brand-500/20" : "border-gray-200 opacity-60"}`}>
                    <CardContent className="p-4">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                                <MapPin className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-brand-600 font-bold mb-1 uppercase tracking-wider">Consegna</p>
                                <h3 className="font-bold text-gray-900 text-lg leading-tight">{job.customerName || "Cliente"}</h3>
                                <p className="text-sm text-gray-500 mt-1">{job.deliveryAddress || "Indirizzo Sconosciuto"}</p>

                                {job.status === "PICKED_UP" && (
                                    <div className="mt-4 flex gap-2">
                                        {job.deliveryAddress && (
                                            <a href={getMapLink(job.deliveryAddress)} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 py-2 rounded-xl text-sm font-semibold transition-colors">
                                                <Map className="w-4 h-4" /> Mappe
                                            </a>
                                        )}
                                        {job.customerPhone && (
                                            <a href={`tel:${job.customerPhone}`} className="flex-1 flex items-center justify-center gap-2 bg-brand-50 hover:bg-brand-100 text-brand-700 py-2 rounded-xl text-sm font-semibold transition-colors">
                                                Chiama
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {job.status === "PICKED_UP" && (
                            <Form method="post" className="mt-4">
                                <input type="hidden" name="intent" value="deliver" />
                                <Button type="submit" size="lg" fullWidth >
                                    Conferma Consegna
                                </Button>
                            </Form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
