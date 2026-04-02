import { useState } from "react";
import { requireRider, uploadProfileImage } from "~/utils.server";
import type { Route } from "./+types/rider.profile";
import { prisma } from "~/db.server";
import { Card, CardContent } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Form } from "react-router";
import { Upload, LogOut, CheckCircle2 } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
    const rider = await requireRider(request);
    return { rider };
}

export async function action({ request }: Route.ActionArgs) {
    const rider = await requireRider(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "sign-contract") {
        await prisma.rider.update({
            where: { id: rider.id },
            data: { contractSignedAt: new Date() }
        });
    } else if (intent === "verify-id") {
        await prisma.rider.update({
            where: { id: rider.id },
            data: { identityVerifiedAt: new Date() }
        });
    } else if (intent === "update-fiscal") {
        const taxCode = formData.get("taxCode");
        const iban = formData.get("iban");
        await prisma.rider.update({
            where: { id: rider.id },
            data: {
                taxCode: typeof taxCode === "string" ? taxCode : null,
                iban: typeof iban === "string" ? iban : null,
            }
        });
    } else if (intent === "update-profile-image") {
        const file = formData.get("profileImage") as File | null;
        if (file && file.size > 0) {
            const imageUrl = await uploadProfileImage(file, rider.id);
            if (imageUrl) {
                await prisma.rider.update({
                    where: { id: rider.id },
                    data: { profileImageUrl: imageUrl }
                });
            }
        }
    }

    return null;
}

export default function RiderProfile({ loaderData }: Route.ComponentProps) {
    const { rider } = loaderData;
    const [isEditingFiscal, setIsEditingFiscal] = useState(false);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
            <div className="bg-white px-5 pt-12 pb-6 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900">Profilo</h1>
                <p className="text-gray-500 font-medium text-sm mt-1">Gestisci i tuoi dati e documenti</p>
            </div>

            <div className="px-5 py-6 space-y-6">
                <Card>
                    <CardContent className="p-5 flex items-center gap-4">
                        <Form method="post" encType="multipart/form-data" className="relative cursor-pointer group shrink-0">
                            <input type="hidden" name="intent" value="update-profile-image" />
                            {rider.profileImageUrl ? (
                                <img src={rider.profileImageUrl} alt={rider.fullName} className="w-16 h-16 rounded-full object-cover shadow-sm border border-gray-100" />
                            ) : (
                                <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-2xl group-hover:bg-brand-200 transition-colors">
                                    {rider.fullName.charAt(0)}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="w-5 h-5 text-white" />
                            </div>
                            <input
                                type="file"
                                name="profileImage"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full object-cover"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        e.target.form?.submit();
                                    }
                                }}
                            />
                        </Form>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{rider.fullName}</h2>
                            <p className="text-gray-500 text-sm">{rider.email}</p>
                            <span className="inline-block mt-2 text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded">
                                Account Attivo
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-3">
                    <h3 className="font-bold text-gray-900">Documenti Legali</h3>

                    <Card>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">Contratto di collaborazione</p>
                                <p className="text-xs text-gray-500">{rider.contractSignedAt ? "Firmato" : "Da firmare"}</p>
                            </div>
                            {rider.contractSignedAt ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                                <Form method="post" encType="multipart/form-data" className="relative cursor-pointer">
                                    <input type="hidden" name="intent" value="sign-contract" />
                                    <Button type="button" variant="outline" size="sm" className="pointer-events-none">
                                        <Upload className="w-4 h-4 mr-2" />
                                        Carica
                                    </Button>
                                    <input
                                        type="file"
                                        name="document"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                e.target.form?.submit();
                                            }
                                        }}
                                        required
                                    />
                                </Form>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">Documento d'identità</p>
                                <p className="text-xs text-gray-500">{rider.identityVerifiedAt ? "Verificato" : "Da caricare"}</p>
                            </div>
                            {rider.identityVerifiedAt ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                                <Form method="post" encType="multipart/form-data" className="relative cursor-pointer">
                                    <input type="hidden" name="intent" value="verify-id" />
                                    <Button type="button" variant="outline" size="sm" className="pointer-events-none">
                                        <Upload className="w-4 h-4 mr-2" />
                                        Carica
                                    </Button>
                                    <input
                                        type="file"
                                        name="document"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                e.target.form?.submit();
                                            }
                                        }}
                                        required
                                    />
                                </Form>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-3">
                    <h3 className="font-bold text-gray-900">Impostazioni</h3>
                    <Card>
                        <CardContent className="p-0 divide-y divide-gray-100">
                            <div className="flex flex-col">
                                <button
                                    onClick={() => setIsEditingFiscal(!isEditingFiscal)}
                                    className="w-full text-left p-4 hover:bg-gray-50 flex items-center justify-between font-medium text-sm text-gray-700 transition-colors"
                                >
                                    <span>Dati fiscali / IBAN</span>
                                    <span className="text-gray-400">{isEditingFiscal ? "−" : "+"}</span>
                                </button>
                                {isEditingFiscal && (
                                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                                        <Form method="post" className="space-y-4">
                                            <input type="hidden" name="intent" value="update-fiscal" />
                                            <div>
                                                <label htmlFor="taxCode" className="block text-xs font-semibold text-gray-700 mb-1">Codice Fiscale</label>
                                                <input
                                                    id="taxCode"
                                                    name="taxCode"
                                                    type="text"
                                                    defaultValue={rider.taxCode || ""}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent uppercase text-sm"
                                                    placeholder="Inserisci il tuo codice fiscale"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="iban" className="block text-xs font-semibold text-gray-700 mb-1">IBAN</label>
                                                <input
                                                    id="iban"
                                                    name="iban"
                                                    type="text"
                                                    defaultValue={rider.iban || ""}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent uppercase text-sm"
                                                    placeholder="IT..."
                                                />
                                            </div>
                                            <div className="flex justify-end pt-2">
                                                <Button type="submit" size="sm">
                                                    Salva dati
                                                </Button>
                                            </div>
                                        </Form>
                                    </div>
                                )}
                            </div>
                            <button className="w-full text-left p-4 hover:bg-gray-50 font-medium text-sm text-gray-700 transition-colors">
                                Privacy e Termini
                            </button>
                            <Form method="post" action="/logout">
                                <button type="submit" className="w-full flex items-center gap-2 p-4 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors">
                                    <LogOut className="w-4 h-4" /> Esci dall'account
                                </button>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
