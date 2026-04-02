import type { Route } from "./+types/admin.riders";
import { prisma } from "~/db.server";
import { Card, CardContent } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import { Link } from "react-router";
import { Button } from "~/components/ui/Button";

export async function loader() {
    const riders = await prisma.rider.findMany({
        orderBy: { createdAt: "desc" }
    });
    return { riders };
}

export default function AdminRiders({ loaderData }: Route.ComponentProps) {
    const { riders } = loaderData;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Gestione Riders</h2>
                    <p className="text-gray-500">Visualizza e gestisci tutti i collaboratori sulla piattaforma.</p>
                </div>
                <Link to="/admin/riders/new">
                    <Button>Nuovo Rider</Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {riders.map(rider => (
                    <Link to={`/admin/riders/${rider.id}`} key={rider.id}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                            <CardContent className="p-5 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg shrink-0">
                                        {rider.fullName.charAt(0)}
                                    </div>
                                    <Badge variant={rider.status === "ACTIVE" ? "success" : rider.status === "SUSPENDED" ? "danger" : "warning"}>
                                        {rider.status}
                                    </Badge>
                                </div>

                                <h3 className="font-bold text-lg text-gray-900 leading-tight">{rider.fullName}</h3>
                                <p className="text-sm text-gray-500 mb-4">{rider.email}</p>

                                <div className="mt-auto space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Guadagni YTD</span>
                                        <span className="font-bold text-gray-900">€{rider.yearlyEarnings.toFixed(2)}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${rider.yearlyEarnings >= 5000 ? 'bg-red-500' : 'bg-brand-500'}`}
                                            style={{ width: `${Math.min((rider.yearlyEarnings / 5000) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
