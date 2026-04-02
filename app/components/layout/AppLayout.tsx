import { Outlet } from "react-router";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans pb-16">
            {/* Content wrapper */}
            <main className="flex-1 max-w-md mx-auto w-full relative sm:border-x sm:border-gray-100 sm:shadow-sm sm:bg-white bg-gray-50">
                <Outlet />
            </main>

            {/* Sticky Bottom Navigation for mobile-first layout */}
            <BottomNav />
        </div>
    );
}
