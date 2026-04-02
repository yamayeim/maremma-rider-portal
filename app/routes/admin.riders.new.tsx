import type { Route } from "./+types/admin.riders.new";
import { redirect, Link } from "react-router";
import { prisma } from "~/db.server";
import { Button } from "~/components/ui/Button";
import { Card, CardContent } from "~/components/ui/Card";
import { ArrowLeft } from "lucide-react";

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const email = formData.get("email");
    const fullName = formData.get("fullName");
    const phone = formData.get("phone");
    const taxCode = formData.get("taxCode");
    const iban = formData.get("iban");
    const status = formData.get("status") || "ACTIVE";

    if (typeof email !== "string" || !email || typeof fullName !== "string" || !fullName) {
        return { error: "Nome ed Email sono obbligatori." };
    }

    // Check for existing rider
    const existingUser = await prisma.rider.findUnique({
        where: { email }
    });

    if (existingUser) {
        return { error: "Un rider con questa email esiste già." };
    }

    await prisma.rider.create({
        data: {
            email,
            fullName,
            phone: typeof phone === "string" ? phone : null,
            taxCode: typeof taxCode === "string" ? taxCode : null,
            iban: typeof iban === "string" ? iban : null,
            status: typeof status === "string" ? status : "ACTIVE",
        }
    });

    return redirect("/admin/riders");
}

export default function NewRider({ actionData }: Route.ComponentProps) {
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center space-x-4">
                <Link to="/admin/riders" className="text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Nuovo Rider</h2>
                    <p className="text-gray-500">Aggiungi un nuovo collaboratore alla piattaforma.</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-6">
                    <form method="post" className="space-y-6">
                        {actionData?.error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                                {actionData.error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700">
                                    Nome e Cognome *
                                </label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                    placeholder="Es. Mario Rossi"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                                    Email *
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                    placeholder="mario.rossi@email.com"
                                />
                                <p className="text-xs text-gray-500 mt-1">L'email verrà utilizzata dal rider per accedere al portale.</p>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
                                    Telefono
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                    placeholder="+39 333 1234567"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="taxCode" className="block text-sm font-semibold text-gray-700">
                                        Codice Fiscale
                                    </label>
                                    <input
                                        id="taxCode"
                                        name="taxCode"
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent uppercase"
                                        placeholder="RSSMRA..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="status" className="block text-sm font-semibold text-gray-700">
                                        Stato Iniziale
                                    </label>
                                    <select
                                        id="status"
                                        name="status"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
                                        defaultValue="ACTIVE"
                                    >
                                        <option value="ACTIVE">Attivo</option>
                                        <option value="PENDING">In Attesa</option>
                                        <option value="SUSPENDED">Sospeso</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="iban" className="block text-sm font-semibold text-gray-700">
                                    IBAN
                                </label>
                                <input
                                    id="iban"
                                    name="iban"
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent uppercase"
                                    placeholder="IT..."
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" size="lg">
                                Crea Rider
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
