import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    HomeIcon,
    UserGroupIcon,
    CreditCardIcon,
    ChartBarIcon,
    CogIcon,
} from '@heroicons/react/24/outline';

interface SidebarItem {
name: string;
href: string;
icon: React.ComponentType<{ className?: string }>;
}

const navigation: SidebarItem[] = [
{ name: 'Dashboard', href: '/', icon: HomeIcon },
{ name: 'Members', href: '/members', icon: UserGroupIcon },
{ name: 'Memberships', href: '/memberships', icon: CreditCardIcon },
{ name: 'Reports', href: '/reports', icon: ChartBarIcon },
{ name: 'Settings', href: '/settings', icon: CogIcon },
];

const Sidebar: React.FC = () => {
    const location = useLocation();

    return (
        <aside className="flex h-full w-64 flex-col bg-gray-900" aria-label="Sidebar">
            <div className="flex h-16 items-center justify-center bg-gray-800">
                <h1 className="text-xl font-bold text-white">Gym Manager</h1>
            </div>

            <nav className="flex-1 space-y-1 px-2 py-4">
                {navigation.map((item) => {
                    const isActive =
                        item.href === '/'
                            ? location.pathname === '/'
                            : location.pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            aria-current={isActive ? 'page' : undefined}
                            className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                                isActive
                                    ? 'bg-gray-700 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`}
                        >
                            <item.icon
                                className={`mr-3 h-6 w-6 ${
                                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                                }`}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;