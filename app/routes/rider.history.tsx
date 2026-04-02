import { requireRider } from "~/utils.server";
import type { Route } from "./+types/rider.history";
import { prisma } from "~/db.server";
import { Card, CardContent } from "~/components/ui/Card";

export async function loader({ request }: Route.LoaderArgs) {
    const rider = await requireRider(request);

    const history = await prisma.deliveryJob.findMany({
        where: {
            riderId: rider.id,
            status: "DELIVERED"
        },
        orderBy: { deliveredAt: "desc" }
    });

    return { history };
}

export default function RiderHistory({ loaderData }: Route.ComponentProps) {
    const { history } = loaderData;

    const formatDate = (dateString: Date) => {
        return new Date(dateString).toLocaleDateString("it-IT", {
            day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
            <div className="bg-white px-5 pt-12 pb-4 shadow-sm relative z-10 sticky top-0">
                <h1 className="text-2xl font-bold text-gray-900">Storico Consegne</h1>
                <p className="text-gray-500 font-medium text-sm mt-1">Le tue consegne passate</p>
            </div>

            <div className="px-5 py-6 space-y-3">
                {history.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-500 font-medium">Nessuna consegna completata ancora.</p>
                    </div>
                ) : (
                    history.map((job) => (
                        <Card key={job.id} className="border-gray-100">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900">{job.restaurantId}</h3>
                                    <div className="font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded text-sm">
                                        €{job.fee.toFixed(2)}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 space-y-1">
                                    <p>Ordine {job.shopifyOrderName || `#${job.id.slice(-4)}`}</p>
                                    <p>Consegnato: {job.deliveredAt ? formatDate(job.deliveredAt) : ""}</p>
                                    <p className="mt-2 text-gray-600 line-clamp-1">{job.deliveryAddress || "Cliente"}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
