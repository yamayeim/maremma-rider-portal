import { NavLink } from "react-router";
import { Home, List, Wallet, User } from "lucide-react";

export function BottomNav() {
    const navItems = [
        { name: "Home", to: "/rider", icon: Home },
        { name: "Jobs", to: "/rider/jobs", icon: List },
        { name: "Earnings", to: "/rider/earnings", icon: Wallet },
        { name: "Profile", to: "/rider/profile", icon: User },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-safe shadow-lg">
            <div className="flex items-center justify-around h-16 max-w-md mx-auto relative px-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.to}
                        end={item.to === "/rider"}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive ? "text-brand-600" : "text-gray-400 hover:text-gray-600"
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`relative flex items-center justify-center p-1 rounded-full overflow-hidden ${isActive ? "bg-brand-50" : ""}`}>
                                    <item.icon className="w-6 h-6 z-10" />
                                </div>
                                <span className={`text-[10px] font-medium leading-none ${isActive ? "font-bold" : ""}`}>
                                    {item.name}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
