import type { Route } from "./+types/admin.login";
import { redirect, Form } from "react-router";
import { getSession, commitSession } from "~/sessions.server";

export async function loader({ request }: Route.LoaderArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    if (session.get("riderId")) {
        throw new Response("Forbidden: Riders cannot access admin area", { status: 403 });
    }
    
    if (session.get("adminAuthenticated")) {
        return redirect("/admin/riders");
    }
    
    const adminPass = process.env.ADMIN_PASSWORD?.trim();
    if (!adminPass) {
        throw new Response("Service Unavailable: Admin access is misconfigured.", { status: 503 });
    }

    return null;
}

export async function action({ request }: Route.ActionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    if (session.get("riderId")) {
        throw new Response("Forbidden: Riders cannot access admin area", { status: 403 });
    }

    const adminPass = process.env.ADMIN_PASSWORD?.trim();
    if (!adminPass) {
        throw new Response("Service Unavailable: Admin access is misconfigured.", { status: 503 });
    }

    const formData = await request.formData();
    const password = formData.get("password");

    if (password === adminPass) {
        session.set("adminAuthenticated", true);
        return redirect("/admin/riders", {
            headers: {
                "Set-Cookie": await commitSession(session),
            },
        });
    }

    return { error: "Password errata." };
}

export default function AdminLogin({ actionData }: Route.ComponentProps) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm max-w-sm w-full border border-gray-100">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Maremma To Go</h1>
                    <p className="text-gray-500">Accesso Amministrazione</p>
                </div>
                
                {actionData?.error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm font-medium mb-4 text-center">
                        {actionData.error}
                    </div>
                )}

                <Form method="post" className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                        <input 
                            type="password" 
                            name="password" 
                            required 
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                            placeholder="Inserisci password"
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-2.5 rounded-xl transition-colors"
                    >
                        Accedi
                    </button>
                </Form>
            </div>
        </div>
    );
}
