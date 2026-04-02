import { redirect } from "react-router";
import { getSession, destroySession } from "~/sessions.server";

export async function action({ request }: { request: Request }) {
    const session = await getSession(request.headers.get("Cookie"));

    return redirect("/rider/login", {
        headers: {
            "Set-Cookie": await destroySession(session),
        },
    });
}

export async function loader() {
    return redirect("/rider/login");
}
