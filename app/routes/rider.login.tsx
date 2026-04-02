import type { Route } from "./+types/rider.login";
import { redirect } from "react-router";
import { getSession, commitSession } from "~/sessions.server";
import { prisma } from "~/db.server";
import { Button } from "~/components/ui/Button";

import { verifyPassword } from "~/auth.server";

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const email = formData.get("email");
    const password = formData.get("password");

    if (typeof email !== "string" || !email || typeof password !== "string" || !password) {
        return { error: "Email e password sono obbligatorie." };
    }

    const rider = await prisma.rider.findUnique({
        where: { email },
    });

    if (!rider) {
        return { error: "Credenziali non valide." };
    }

    const isPasswordValid = await verifyPassword(password, rider.password);
    if (!isPasswordValid) {
        return { error: "Credenziali non valide." };
    }

    if (rider.status !== "ACTIVE") {
        return { error: "Il tuo account non è attivo. Contatta l'amministrazione." };
    }

    const session = await getSession(request.headers.get("Cookie"));
    session.set("riderId", rider.id);

    return redirect("/rider", {
        headers: {
            "Set-Cookie": await commitSession(session),
        },
    });
}

export default function RiderLogin({ actionData }: Route.ComponentProps) {
    return (
        <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Rider Portal</h1>
                    <p className="text-gray-500 font-medium">Maremma To Go</p>
                </div>

                <form method="post" className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                                Email
                            </label>
                        </div>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            placeholder="mario.rossi@email.com"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
                        />
                        {actionData?.error && (
                            <p className="text-red-500 text-xs mt-1 font-medium">{actionData.error}</p>
                        )}
                    </div>

                    <Button type="submit" size="lg" fullWidth>
                        Accedi alla Dashboard
                    </Button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-6 px-4">
                    Credenziali fornite dall'amministrazione Maremma To Go.
                </p>
            </div>
        </div>
    );
}
