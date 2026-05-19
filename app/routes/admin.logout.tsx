import type { Route } from "./+types/admin.logout";
import { redirect } from "react-router";
import { getSession, commitSession } from "~/sessions.server";

export async function loader({ request }: Route.LoaderArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    session.unset("adminAuthenticated");
    
    return redirect("/admin/login", {
        headers: {
            "Set-Cookie": await commitSession(session),
        },
    });
}
