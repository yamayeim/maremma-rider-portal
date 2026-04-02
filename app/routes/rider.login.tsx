import type { Route } from "./+types/rider.login";
import { redirect } from "react-router";
import { getSession, commitSession } from "~/sessions.server";
import { prisma } from "~/db.server";
import { Button } from "~/components/ui/Button";

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const email = formData.get("email");

    if (typeof email !== "string" || !email) {
        return { error: "L'email è obbligatoria." };
    }

    // Find rider or create for MVP purposes to make testing easy
    let rider = await prisma.rider.findUnique({
        where: { email },
    });

    if (!rider) {
        rider = await prisma.rider.create({
            data: {
                email,
                fullName: email.split("@")[0] || "Nuovo Rider",
                status: "ACTIVE",
            },
        });
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
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                            Email personale
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            placeholder="mario.rossi@email.com"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                        />
                        {actionData?.error && (
                            <p className="text-red-500 text-sm mt-1">{actionData.error}</p>
                        )}
                    </div>

                    <Button type="submit" size="lg" fullWidth>
                        Accedi come Rider
                    </Button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Inserisci la tua email per accedere. <br />
                    <span className="text-brand-600 font-medium">Il codice magico ti verra' inviato per email (Demo: Auto-login).</span>
                </p>
            </div>
        </div>
    );
}
