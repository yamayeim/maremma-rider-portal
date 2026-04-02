import { requireActiveRider } from "~/utils.server";
import { checkEarningsThreshold } from "~/utils";
import type { Route } from "./+types/rider.dashboard";
import { prisma } from "~/db.server";
import { Card, CardContent } from "~/components/ui/Card";
import { Form, useSubmit } from "react-router";
import { Store, MapPin } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
    const rider = await requireActiveRider(request);

    // Get active job if any
    const activeJob = await prisma.deliveryJob.findFirst({
        where: {
            riderId: rider.id,
            status: { in: ["ACCEPTED", "PICKED_UP"] }
        }
    });

    // Get available jobs count
    const openJobsCount = await prisma.deliveryJob.count({
        where: { status: "OPEN" }
    });

    return { rider, activeJob, openJobsCount };
}

export async function action({ request }: Route.ActionArgs) {
    const rider = await requireActiveRider(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "toggle-status") {
        await prisma.rider.update({
            where: { id: rider.id },
            data: { availableNow: !rider.availableNow }
        });
    }

    return null;
}

export default function RiderDashboard({ loaderData }: Route.ComponentProps) {
    const { rider, activeJob, openJobsCount } = loaderData;
    const submit = useSubmit();

    const handleToggle = () => {
        submit({ intent: "toggle-status" }, { method: "post" });
    };

    const threshold = checkEarningsThreshold(rider);

    return (
        <div className="flex flex-col min-h-full pb-20">
            {/* Header Profile Area */}
            <div className="bg-white px-5 pt-12 pb-6 border-b border-gray-100 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 font-medium text-sm">Bentornato,</p>
                        <h1 className="text-2xl font-bold text-gray-900">{rider.fullName}</h1>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg">
                        {rider.fullName.charAt(0)}
                    </div>
                </div>

                {/* Status Toggle */}
                <div className="mt-8 flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div>
                        <h3 className="font-semibold text-gray-900">Il tuo stato</h3>
                        <p className="text-sm text-gray-500">{rider.availableNow ? "Ricevi consegne" : "Non ricevi consegne"}</p>
                    </div>
                    <button
                        onClick={handleToggle}
                        disabled={threshold.isBlocked}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${rider.availableNow && !threshold.isBlocked ? "bg-green-500" : "bg-gray-300"} disabled:opacity-50`}
                    >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${rider.availableNow && !threshold.isBlocked ? "translate-x-7" : "translate-x-1"}`} />
                    </button>
                    {threshold.isBlocked && rider.availableNow && (
                        <span className="sr-only">Disabled due to threshold</span>
                    )}
                </div>
            </div>

            <div className="px-5 py-6 space-y-6 flex-1">
                {/* Alerts / Threshold logic */}
                {threshold.isBlocked && (
                    <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                        <h4 className="text-red-800 font-bold mb-1">Attenzione: Soglia 5.000€ raggiunta</h4>
                        <p className="text-red-700 text-sm">Non puoi più accettare consegne. Devi regolarizzare la tua posizione fiscale per continuare.</p>
                    </div>
                )}
                {threshold.isNearing && !threshold.isBlocked && (
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                        <h4 className="text-orange-800 font-bold mb-1">Sei vicino alla soglia (5.000€)</h4>
                        <p className="text-orange-700 text-sm">Tieni d'occhio i tuoi guadagni per non superare il limite per collaborazioni occasionali.</p>
                    </div>
                )}

                {/* Financial Snapshot */}
                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm font-medium text-gray-500 mb-1">Guadagni oggi</p>
                            <p className="text-2xl font-bold text-gray-900">€ 0.00</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm font-medium text-gray-500 mb-1">Soglia Annuale</p>
                            <p className="text-lg font-bold text-gray-900">€ {rider.yearlyEarnings.toFixed(2)}</p>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
                                <div
                                    className={`h-1.5 rounded-full ${threshold.isNearing ? "bg-orange-500" : threshold.isBlocked ? "bg-red-500" : "bg-brand-500"}`}
                                    style={{ width: `${threshold.percentage}%` }}
                                ></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Ongoing Delivery Section */}
                {activeJob && (
                    <div className="space-y-3">
                        <h3 className="font-bold text-gray-900">Consegna in corso</h3>
                        <Card className="border-brand-500 shadow-md">
                            <CardContent className="p-4 bg-brand-50/50">
                                <div className="flex items-center gap-2 mb-1">
                                    <Store className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600 truncate">{activeJob.restaurantId}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-brand-400" />
                                        <span className="font-semibold text-gray-900 truncate">{activeJob.deliveryAddress || "Cliente"}</span>
                                    </div>
                                    <span className="font-semibold text-brand-600 bg-brand-100 px-2 py-1 rounded text-sm">€{activeJob.fee.toFixed(2)}</span>
                                </div>
                                <div className="mt-4">
                                    <a href={`/rider/jobs/${activeJob.id}`} className="block w-full text-center bg-brand-500 text-white py-2.5 rounded-xl font-medium shadow-sm hover:bg-brand-600 transition-colors">
                                        Vedi dettagli
                                    </a>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Available Jobs Overview */}
                {!activeJob && (
                    <div className="space-y-3">
                        <h3 className="font-bold text-gray-900">Nuove richieste</h3>
                        {openJobsCount > 0 ? (
                            <a href="/rider/jobs" className="block relative overflow-hidden bg-gray-900 text-white rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-all">
                                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-brand-500 rounded-full opacity-20 blur-xl"></div>
                                <h4 className="font-bold text-xl">{openJobsCount} consegne disponibili</h4>
                                <p className="text-gray-300 mt-1 text-sm">Tocca per vedere la mappa o scegliere una consegna.</p>
                            </a>
                        ) : (
                            <Card className="border-dashed shadow-none bg-transparent">
                                <CardContent className="p-6 text-center">
                                    <p className="text-gray-500 font-medium">Nessuna consegna al momento</p>
                                    <p className="text-sm text-gray-400 mt-1">Quando un ristorante richiede un rider, la vedrai qui.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
