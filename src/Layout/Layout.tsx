import MainSidebar from "../components/Sidebar/MainSidebar";
import Navbar from "../components/Navbar/Navbar";
import { Outlet } from "react-router-dom";

import { SidebarProvider } from "../components/ui/sidebar";

export default function Layout() {
  return (
    <SidebarProvider>
      <div className="w-full min-h-screen flex flex-col relative bg-[#eef2fb] dark:bg-[#090d16] transition-colors duration-300">
        {/* Liquid glass bg blobs — light & dark */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -top-32 -left-20 h-125 w-125 rounded-full bg-[#083695]/12 dark:bg-[#1e40af]/20 blur-[120px]" />
          <div className="absolute -top-10 right-0 h-105 w-105 rounded-full bg-[#1a5bd4]/15 dark:bg-[#3b82f6]/15 blur-[100px]" />
          <div className="absolute top-1/3 left-1/3 h-95 w-95 rounded-full bg-[#4a7fd4]/10 dark:bg-[#2563eb]/15 blur-[110px]" />
          <div className="absolute bottom-0 right-1/4 h-85 w-85 rounded-full bg-[#083695]/8 dark:bg-[#1e3a8a]/20 blur-[90px]" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <div className="w-full flex-1 flex items-start">
            <MainSidebar />
            <main className="flex-1 min-w-0 pl-1 md:pl-2 pr-2 sm:pr-3 py-3 sm:py-5 md:py-6 pb-20 md:pb-8">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
