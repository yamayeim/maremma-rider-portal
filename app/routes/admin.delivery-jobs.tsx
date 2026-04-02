import type { Route } from "./+types/admin.delivery-jobs";
import { prisma } from "~/db.server";
import { Card, CardContent } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import { Form } from "react-router";
import { Button } from "~/components/ui/Button";

export async function loader() {
    const jobs = await prisma.deliveryJob.findMany({
        orderBy: { createdAt: "desc" },
        include: { rider: true },
        take: 50
    });
    return { jobs };
}

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    if (formData.get("intent") === "create-job") {
        await prisma.deliveryJob.create({
            data: {
                shop: "maremma-to-go.myshopify.com",
                restaurantId: "DemoPartner",
                orderGid: `gid://shopify/Order/${Math.floor(Math.random() * 100000)}`,
                shopifyOrderName: `Sim-${Math.floor(Math.random() * 1000)}`,
                status: "OPEN",
                fee: 2.50,
                fulfillmentMethod: "LOCAL_DELIVERY",
                deliveryAddress: "Via Test Cliente, 1",
            }
        });
    }
    return null;
}

export default function AdminDeliveryJobs({ loaderData }: Route.ComponentProps) {
    const { jobs } = loaderData;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "OPEN": return <Badge variant="warning">Aperto</Badge>;
            case "ACCEPTED": return <Badge variant="default">Assegnato</Badge>;
            case "PICKED_UP": return <Badge variant="neutral">In Transito</Badge>;
            case "DELIVERED": return <Badge variant="success">Consegnato</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Delivery Jobs</h2>
                    <p className="text-gray-500">Monitor in tempo reale delle consegne della piattaforma.</p>
                </div>
                <Form method="post">
                    <input type="hidden" name="intent" value="create-job" />
                    <Button type="submit">Simula Richiesta Consegna</Button>
                </Form>
            </div>

            <div className="grid gap-4">
                {jobs.map(job => (
                    <Card key={job.id} className="border-gray-100">
                        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex-1 w-full">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-lg text-gray-900">{job.restaurantId || "Partner"} <span className="text-gray-400 font-normal text-sm ml-2">{job.shopifyOrderName}</span></h3>
                                    {getStatusBadge(job.status)}
                                </div>
                                <p className="text-sm text-gray-500 truncate max-w-lg">
                                    <span className="font-semibold text-gray-700">Metodo:</span> {job.fulfillmentMethod} <br className="md:hidden" />
                                    <span className="font-semibold text-gray-700 md:ml-2">A:</span> {job.deliveryAddress}
                                </p>
                            </div>

                            <div className="flex md:flex-col justify-between w-full md:w-auto md:text-right md:items-end md:gap-1 bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-lg">
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold uppercase">Fee Rider</p>
                                    <p className="font-bold text-brand-700 text-lg">€{job.fee.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold uppercase">Rider</p>
                                    <p className="font-medium text-gray-900 text-sm">{job.rider ? job.rider.fullName : "Nessuno (in attesa)"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {jobs.length === 0 && (
                    <div className="text-center py-12 text-gray-500">Nessuna consegna trovata.</div>
                )}
            </div>
        </div>
    );
}
