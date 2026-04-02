import type { Route } from "./+types/admin.rider-detail";
import { prisma } from "~/db.server";
import { Card, CardContent } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { Form, redirect } from "react-router";

export async function loader({ params }: Route.LoaderArgs) {
    const rider = await prisma.rider.findUnique({
        where: { id: params.id },
        include: {
            jobs: { orderBy: { createdAt: 'desc' }, take: 10 }
        }
    });

    if (!rider) throw redirect("/admin/riders");

    return { rider };
}

export async function action({ request, params }: Route.ActionArgs) {
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "suspend") {
        await prisma.rider.update({
            where: { id: params.id },
            data: { status: "SUSPENDED", availableNow: false }
        });
    } else if (intent === "activate") {
        await prisma.rider.update({
            where: { id: params.id },
            data: { status: "ACTIVE" }
        });
    }

    return null;
}

export default function AdminRiderDetail({ loaderData }: Route.ComponentProps) {
    const { rider } = loaderData;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{rider.fullName}</h2>
                    <p className="text-gray-500">{rider.email} • {rider.phone || "Nessun telefono"}</p>
                </div>
                <Badge variant={rider.status === "ACTIVE" ? "success" : rider.status === "SUSPENDED" ? "danger" : "warning"}>
                    {rider.status}
                </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-5">
                        <h3 className="font-bold text-lg mb-4">Stato Account</h3>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Disponibilità attuale</span>
                                <span className="font-semibold">{rider.availableNow ? "🟢 Online" : "🔴 Offline"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Guadagni Annuali</span>
                                <span className="font-semibold text-gray-900 border-b-2 border-brand-500">€{rider.yearlyEarnings.toFixed(2)}</span>
                            </div>
                        </div>

                        <Form method="post">
                            {rider.status === "ACTIVE" ? (
                                <Button type="submit" name="intent" value="suspend" variant="danger" fullWidth>
                                    Sospendi Rider
                                </Button>
                            ) : (
                                <Button type="submit" name="intent" value="activate" variant="primary" fullWidth>
                                    Riattiva Rider
                                </Button>
                            )}
                        </Form>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-5">
                        <h3 className="font-bold text-lg mb-4">Ultime Consegne</h3>
                        {rider.jobs.length === 0 ? (
                            <p className="text-gray-500">Nessuna consegna effettuata.</p>
                        ) : (
                            <div className="space-y-3">
                                {rider.jobs.map(job => (
                                    <div key={job.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{job.restaurantId} <span className="ml-1 text-gray-400 font-normal">{job.shopifyOrderName}</span></p>
                                            <p className="text-xs text-gray-500">{new Date(job.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-brand-700">€{job.fee.toFixed(2)}</p>
                                            <p className="text-[10px] text-gray-500 font-semibold">{job.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
