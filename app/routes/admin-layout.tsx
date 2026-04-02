import { Outlet, NavLink } from "react-router";
import { Users, Package } from "lucide-react";

export default function AdminLayout() {
    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Sidebar for desktop/tablet admin */}
            <aside className="w-64 bg-gray-900 text-white flex-col hidden md:flex min-h-screen fixed">
                <div className="p-6">
                    <h1 className="text-xl font-bold">Maremma To Go</h1>
                    <p className="text-gray-400 text-sm">Rider Admin</p>
                </div>
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <NavLink
                        to="/admin/riders"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? "bg-brand-500 text-white font-bold" : "text-gray-300 hover:text-white hover:bg-gray-800"
                            }`
                        }
                    >
                        <Users className="w-5 h-5" /> Riders
                    </NavLink>
                    <NavLink
                        to="/admin/delivery-jobs"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? "bg-brand-500 text-white font-bold" : "text-gray-300 hover:text-white hover:bg-gray-800"
                            }`
                        }
                    >
                        <Package className="w-5 h-5" /> Delivery Jobs
                    </NavLink>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 w-full min-h-screen bg-gray-50">
                {/* Mobile Header */}
                <header className="md:hidden bg-gray-900 text-white p-4 sticky top-0 z-50 flex items-center justify-between">
                    <h1 className="font-bold">Maremma To Go Admin</h1>
                    <div className="flex gap-4">
                        <NavLink to="/admin/riders" className={({ isActive }) => isActive ? "text-brand-400" : "text-gray-400"}><Users className="w-5 h-5" /></NavLink>
                        <NavLink to="/admin/delivery-jobs" className={({ isActive }) => isActive ? "text-brand-400" : "text-gray-400"}><Package className="w-5 h-5" /></NavLink>
                    </div>
                </header>

                <div className="p-6 max-w-6xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
