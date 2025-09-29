import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

interface LayoutProps {
    title?: string;
    subtitle?: string;
    sidebar?: React.ReactNode;
    sidebarLabel?: string;
    headerActions?: React.ReactNode;
    children: React.ReactNode;
}

const defaultSubtitle = "Manage your gym operations efficiently.";

const Layout: React.FC<LayoutProps> = ({
    title,
    subtitle,
    sidebar,
    sidebarLabel,
    headerActions,
    children,
}) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const resolvedTitle = title ?? "Dashboard";
    const resolvedSubtitle = subtitle ?? defaultSubtitle;

    useEffect(() => {
        const previousTitle = document.title;
        document.title = `${resolvedTitle} | Gym Management System`;
        return () => {
            document.title = previousTitle;
        };
    }, [resolvedTitle]);

    return (
        <div className="min-h-screen bg-gray-100">

            <header className="bg-white shadow-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
                    <div className="flex items-start gap-4">
                        {sidebar && (
                            <Button
                                variant="outline"
                                size="icon"
                                className="md:hidden"
                                onClick={() => setIsSidebarOpen((prev) => !prev)}
                                aria-expanded={isSidebarOpen}
                                aria-controls="layout-mobile-sidebar"
                                aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                            >
                                {isSidebarOpen ? (
                                    <XMarkIcon className="h-5 w-5" />
                                ) : (
                                    <Bars3Icon className="h-5 w-5" />
                                )}
                            </Button>
                        )}
                        <div>
                            <h1 className="text-xl font-semibold text-gray-800">{resolvedTitle}</h1>
                            <p className="text-sm text-gray-500">{resolvedSubtitle}</p>
                        </div>
                    </div>
                    {headerActions && <div className="flex items-center gap-3">{headerActions}</div>}
                </div>
            </header>

            <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 sm:px-6">
                {sidebar && (
                    <>
                        <aside
                            id="layout-mobile-sidebar"
                            aria-label={sidebarLabel ?? "Sidebar"}
                            className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white shadow-lg transition-transform duration-200 ease-in-out md:hidden ${
                                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                            }`}
                        >
                            <div className="h-full overflow-y-auto border-r border-gray-200 bg-gray-50 p-4">
                                {sidebar}
                            </div>
                        </aside>

                        <div className="hidden w-64 shrink-0 md:block" aria-label={sidebarLabel ?? "Sidebar"}>
                            {sidebar}
                        </div>
                    </>
                )}

                <main className="flex-1" role="main">
                    <div className="rounded-lg bg-white p-6 shadow-sm">{children}</div>
                </main>
            </div>

            {isSidebarOpen && sidebar && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 md:hidden"
                    role="presentation"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}
        </div>
    );
};

export default Layout;