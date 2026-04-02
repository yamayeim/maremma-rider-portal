import { AppLayout } from "~/components/layout/AppLayout";
import { requireRider } from "~/utils.server";
import type { Route } from "./+types/rider-layout";

export async function loader({ request }: Route.LoaderArgs) {
    await requireRider(request);
    return null;
}

export default function RiderLayout() {
    return <AppLayout />;
}
