import { requireRider } from "~/utils.server";
import type { Route } from "./+types/rider.earnings";
import { Card, CardContent } from "~/components/ui/Card";
import { AlertCircle } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
    const rider = await requireRider(request);
    return { rider };
}

export default function RiderEarnings({ loaderData }: Route.ComponentProps) {
    const { rider } = loaderData;
    const maxThreshold = 5000;
    const isNearingThreshold = rider.yearlyEarnings >= 3500;
    const isBlockedThreshold = rider.yearlyEarnings >= maxThreshold;
    const percentage = Math.min((rider.yearlyEarnings / maxThreshold) * 100, 100);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
            <div className="bg-brand-900 px-5 pt-12 pb-16 text-white rounded-b-3xl shadow-sm">
                <h1 className="text-2xl font-bold mb-6">Guadagni e Soglie</h1>

                <p className="text-brand-200 text-sm font-medium mb-1">Guadagni annuali (Prestazione Occasionale)</p>
                <div className="flex items-end gap-2 mb-4">
                    <h2 className="text-4xl font-bold">€{rider.yearlyEarnings.toFixed(2)}</h2>
                    <span className="text-brand-300 mb-1">/ €5000</span>
                </div>

                <div className="w-full bg-brand-950 rounded-full h-2.5 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${isBlockedThreshold ? "bg-red-500" : isNearingThreshold ? "bg-orange-500" : "bg-brand-400"}`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>

            <div className="px-5 -mt-8 relative z-10 space-y-4">
                {/* Warning cards mapped to threshold states */}
                {isBlockedThreshold && (
                    <Card className="border-red-500 border-2 shadow-red-500/10">
                        <CardContent className="p-4 flex gap-3">
                            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                            <div>
                                <h4 className="text-red-900 font-bold mb-1">Soglia Raggiunta</h4>
                                <p className="text-sm text-red-700">Hai raggiunto il limite annuale per prestazioni occasionali. Il tuo account è in pausa per nuove consegne. Contatta l'amministrazione The Maremma To Go per regolarizzare la tua partita iva.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {!isBlockedThreshold && isNearingThreshold && (
                    <Card className="border-orange-400 border-2 shadow-orange-400/10">
                        <CardContent className="p-4 flex gap-3">
                            <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-orange-900 font-bold mb-0.5">Avviso Soglia</h4>
                                <p className="text-sm text-orange-800">Sei vicino al limite dei 5.000€ netti all'anno.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-2 gap-4 mt-2">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm font-medium text-gray-500 mb-1">Questo mese</p>
                            <p className="text-2xl font-bold text-gray-900">€{rider.monthlyEarnings.toFixed(2)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm font-medium text-gray-500 mb-1">Oggi</p>
                            <p className="text-2xl font-bold text-gray-900">€0.00</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
