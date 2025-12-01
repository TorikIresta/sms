"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut, UserCircle, X } from "lucide-react";

/**
 * layout.tsx - Dashboard layout with:
 * - smooth collapse/uncollapse
 * - active menu highlighting (matches existing hover style)
 * - mobile auto-hide and overlay sidebar
 *
 * Notes:
 * - This file assumes TailwindCSS is configured (as per your original file).
 * - All visual styles are preserved; only interactions/logic/animations added.
 */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false); // desktop collapse
  const [username, setUsername] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const [openSiswaSubmenu, setOpenSiswaSubmenu] = useState(false);
  const [role, setRole] = useState("");

  // mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setUsername(localStorage.getItem("username") || "Pengguna");
    const r = localStorage.getItem("role") || "";
    setRole(r);
  }, []);

  useEffect(() => {
    // Jika halaman aktif BUKAN bagian dari submenu siswa, maka tutup submenu
    if (
      !pathname.startsWith("/dashboard/siswa") &&
      !pathname.startsWith("/dashboard/kelas") &&
      !pathname.startsWith("/dashboard/jurusan")
    ) {
      setOpenSiswaSubmenu(false);
    }
  }, [pathname]);

  // detect mobile via window width; breakpoint = 768 (md)
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // if switched to mobile, close desktop collapse to avoid weird state
      if (mobile) {
        setCollapsed(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // when route changes, close mobile overlay
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // close submenu when collapsed or mobile
  useEffect(() => {
    if (collapsed || isMobile) setOpenSiswaSubmenu(false);
  }, [collapsed, isMobile]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  // Toggle behavior:
  // - On mobile: open/close overlay (mobileOpen)
  // - On desktop: toggle collapsed
  const handleToggle = () => {
    if (isMobile) {
      setMobileOpen((s) => !s);
    } else {
      setCollapsed((s) => !s);
    }
  };

  // helper to close mobile sidebar (e.g., when clicking backdrop)
  const closeMobile = () => setMobileOpen(false);

  // active detection: consider a menu active if pathname startsWith href
  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard" || pathname === "/"
      : pathname?.startsWith(href);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ------------------------------ SIDEBAR ------------------------------ */}
      {/* Desktop: static sidebar, Mobile: overlay sliding panel */}
      <aside
        // for desktop, we animate width; for mobile we use transform translateX for overlay
        aria-hidden={!mobileOpen && isMobile}
        className={`bg-gradient-to-b from-blue-700 to-blue-900 text-white shadow-xl
          transition-all duration-300 ease-in-out flex flex-col z-40
          ${isMobile ? "fixed inset-y-0 left-0" : "relative"}
          ${isMobile ? "w-64" : collapsed ? "w-20" : "w-64"}
          ${
            isMobile
              ? mobileOpen
                ? "translate-x-0"
                : "-translate-x-full"
              : "translate-x-0"
          }
        `}
        style={{
          // add explicit transition for width so browsers handle it smoother
          transitionProperty: isMobile ? "transform" : "width, transform",
          transitionDuration: "300ms",
          transitionTimingFunction: "ease-in-out",
        }}
      >
        {/* Logo */}
        <div className="flex items-center h-24 gap-2 p-4 border-b border-b-blue-400">
          <div className="text-blue-700 font-bold w-12 h-12 flex items-center justify-center overflow-hidden">
            <Image
              src="/smk.png"
              alt="Logo SMK"
              width={40}
              height={40}
              className="object-cover drop-shadow-lg"
            />
          </div>

          {/* animate max-width / opacity / translate so text appears smoothly */}
          <div
            className={`overflow-hidden transform transition-all duration-300 ease-in-out ${
              collapsed
                ? "max-w-0 opacity-0 -translate-x-3"
                : "max-w-[200px] opacity-100 translate-x-0"
            }`}
          >
            <p className="font-bold text-xl whitespace-nowrap">SMS</p>
            <p className="text-xs opacity-80 text-yellow-300 font-bold whitespace-nowrap">
              Sistem Manajemen Sekolah
            </p>
          </div>

          {/* Mobile close button inside sidebar header */}
          {isMobile && mobileOpen && (
            <button
              onClick={closeMobile}
              aria-label="Tutup sidebar"
              className="ml-auto -mr-2 rounded p-1 hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto text-sm">
          {/* Dashboard item */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-4 ${
              collapsed ? "py-6" : "py-6"
            } border-l-4 border-l-transparent border-b border-b-blue-400 transition duration-150 ease-in-out hover:bg-blue-600 hover:border-b hover:border-blue-400 hover:border-l-blue-200
              ${
                isActive("/dashboard")
                  ? "bg-blue-600 border-l-blue-200 border-b-blue-400 text-white"
                  : ""
              }
            `}
            // keep original hover behaviors; active styling applied inside child container
            onClick={() => {
              if (isMobile) closeMobile();
            }}
          >
            <span className="w-6 h-6">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                className="size-6"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M26 18V6H42V18H26ZM6 26V6H22V26H6ZM26 42V22H42V42H26ZM6 42V30H22V42H6Z"
                  fill="#FAFAFA"
                />
              </svg>
            </span>
            {!collapsed && <span>Dashboard</span>}
          </Link>

          <div
            className={`flex items-center bg-blue-700 px-4 text-xs text-yellow-300 h-12 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            {!collapsed && "MANAGEMENT"}
          </div>

          {/* === DATA SISWA DROPDOWN === */}
          <div>
            {/* Header Data Siswa */}
            <button
              onClick={() => setOpenSiswaSubmenu((s) => !s)}
              className="flex cursor-pointer items-center w-full pl-2 pr-5 pt-2 transition duration-150 ease-in-out"
            >
              <div
                className={`flex items-center border-r-3 border-b-4 border-b-transparent border-r-transparent gap-3 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:border-r-blue-200 hover:border-b-blue-200 w-full transition-colors duration-150 ease-in-out ${
                  // if any submenu item active, mark header as active too
                  isActive("/dashboard/siswa") ||
                  isActive("/dashboard/kelas") ||
                  isActive("/dashboard/jurusan")
                    ? "sidebar-item active"
                    : ""
                }`}
              >
                {/* ICON DATA SISWA */}
                <span className="w-6 h-6">
                  <svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75"
                    />
                  </svg>
                </span>

                {/* Label */}
                {!collapsed && (
                  <span className="overflow-hidden whitespace-nowrap min-w-0 flex-grow text-left">
                    Data Siswa
                  </span>
                )}

                {/* ARROW ICON */}
                {!collapsed && (
                  <span
                    className={`transition-transform duration-200 ${
                      openSiswaSubmenu ? "rotate-180" : ""
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      className="size-5"
                    >
                      <path d="M12 16l6-6H6z" />
                    </svg>
                  </span>
                )}
              </div>
            </button>

            {/* === SUBMENU === */}
            <div
              className={`ml-2 mr-5 mt-[-7] pt-3 space-y-2 transition-all duration-300 overflow-hidden rounded-b-lg ${
                openSiswaSubmenu && !collapsed
                  ? "max-h-40 bg-blue-600"
                  : "max-h-0 bg-transparent"
              }`}
            >
              {/* SUBMENU ITEM */}
              <Link
                href="/dashboard/siswa"
                className={`flex items-center gap-2 text-sm ml-5 mr-6 p-1 pl-4 rounded-md transition-colors duration-150 ${
                  isActive("/dashboard/siswa") && openSiswaSubmenu && !collapsed
                    ? "bg-blue-700 text-white hover:text-white hover:bg-blue-700"
                    : openSiswaSubmenu && !collapsed
                    ? "text-white hover:text-white hover:bg-blue-700"
                    : "text-blue-200 hover:text-blue-700 hover:bg-blue-200/20"
                }`}
                onClick={() => {
                  if (isMobile) closeMobile();
                }}
              >
                <span className="inline-block w-3 h-3 bg-white rounded-full"></span>
                <span>Input Data Siswa</span>
              </Link>

              <Link
                href="/dashboard/kelas"
                className={`flex items-center gap-2 text-sm ml-5 mr-6 p-1 pl-4 rounded-md transition-colors duration-150 ${
                  isActive("/dashboard/kelas") && openSiswaSubmenu && !collapsed
                    ? "bg-blue-700 text-white hover:text-white hover:bg-blue-700"
                    : openSiswaSubmenu && !collapsed
                    ? "text-white hover:text-white hover:bg-blue-700"
                    : "text-blue-200 hover:text-blue-700 hover:bg-blue-200/20"
                }`}
                onClick={() => {
                  if (isMobile) closeMobile();
                }}
              >
                <span className="inline-block w-3 h-3 bg-white rounded-full"></span>
                <span>Input Kelas</span>
              </Link>

              <Link
                href="/dashboard/jurusan"
                className={`flex items-center gap-2 text-sm ml-5 mr-6 mb-3 p-1 pl-4 rounded-md transition-colors duration-150 ${
                  isActive("/dashboard/jurusan") &&
                  openSiswaSubmenu &&
                  !collapsed
                    ? "bg-blue-700 text-white hover:text-white hover:bg-blue-700"
                    : openSiswaSubmenu && !collapsed
                    ? "text-white hover:text-white hover:bg-blue-700"
                    : "text-blue-200 hover:text-blue-700 hover:bg-blue-200/20"
                }`}
                onClick={() => {
                  if (isMobile) closeMobile();
                }}
              >
                <span className="inline-block w-3 h-3 bg-white rounded-full"></span>
                <span>Input Jurusan</span>
              </Link>
            </div>
          </div>

          <SidebarItem
            href="/dashboard/absensi"
            icon={
              <svg
                className="size-6"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 19V5V9.475V9V19ZM7 13H12.525C12.5583 12.6333 12.6417 12.2833 12.775 11.95C12.9083 11.6167 13.075 11.3 13.275 11H7V13ZM7 17H10.925C11.2083 16.6667 11.5333 16.396 11.9 16.188C12.2667 15.98 12.65 15.809 13.05 15.675C12.9833 15.575 12.925 15.4667 12.875 15.35C12.825 15.2333 12.7833 15.1167 12.75 15H7V17ZM3 21V3H21V11.45C20.7667 11.0167 20.4833 10.6333 20.15 10.3C19.8167 9.96667 19.4333 9.69167 19 9.475V5H5V19H10.05C10.0333 19.1 10.0207 19.2 10.012 19.3C10.0033 19.4 9.99933 19.5 10 19.6V21H3ZM17 16C16.3 16 15.7083 15.7583 15.225 15.275C14.7417 14.7917 14.5 14.2 14.5 13.5C14.5 12.8 14.7417 12.2083 15.225 11.725C15.7083 11.2417 16.3 11 17 11C17.7 11 18.2917 11.2417 18.775 11.725C19.2583 12.2083 19.5 12.8 19.5 13.5C19.5 14.2 19.2583 14.7917 18.775 15.275C18.2917 15.7583 17.7 16 17 16ZM12 21V19.6C12 19.2 12.1043 18.8293 12.313 18.488C12.5217 18.1467 12.8173 17.9007 13.2 17.75C13.8 17.5 14.421 17.3127 15.063 17.188C15.705 17.0633 16.3507 17.0007 17 17C17.6493 16.9993 18.2953 17.062 18.938 17.188C19.5807 17.314 20.2013 17.5013 20.8 17.75C21.1833 17.9 21.4793 18.146 21.688 18.488C21.8967 18.83 22.0007 19.2007 22 19.6V21H12ZM7 9H17V7H7V9Z"
                  fill="white"
                />
              </svg>
            }
            label="Absensi"
            collapsed={collapsed}
            active={isActive("/dashboard/absensi")}
            onClick={() => {
              if (isMobile) closeMobile();
            }}
          />
          <SidebarItem
            href="/dashboard/rekap"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                />
              </svg>
            }
            label="Rekap Absensi"
            collapsed={collapsed}
            active={isActive("/dashboard/rekap")}
            onClick={() => {
              if (isMobile) closeMobile();
            }}
          />
          <SidebarItem
            href="/dashboard/mapel"
            icon={
              <svg
                className="size-6"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.75 22C6 22 5.35433 21.7457 4.813 21.237C4.27167 20.7283 4.00067 20.0993 4 19.35V5.39999C4 4.76665 4.196 4.19999 4.588 3.69999C4.98 3.19999 5.49233 2.88332 6.125 2.74999L16 0.799988V16.8L6.525 18.7C6.375 18.7333 6.25 18.8127 6.15 18.938C6.05 19.0633 6 19.2007 6 19.35C6 19.5333 6.075 19.6877 6.225 19.813C6.375 19.9383 6.55 20.0007 6.75 20H18V3.99999H20V22H6.75ZM7 16.575L9 16.175V4.22499L7 4.62499V16.575Z"
                  fill="white"
                />
              </svg>
            }
            label="Mata Pelajaran"
            collapsed={collapsed}
            active={isActive("/dashboard/mapel")}
            onClick={() => {
              if (isMobile) closeMobile();
            }}
          />

          <div
            className={`flex items-center bg-blue-700 px-4 text-xs text-yellow-300 h-12 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            {!collapsed && "SYSTEM"}
          </div>

          {role === "Super User" && (
            <Link
              href="/dashboard/users"
              className="flex cursor-pointer items-center w-full pl-2 pr-5 pt-2 transition duration-150 ease-in-out"
              onClick={() => {
                if (isMobile) closeMobile();
              }}
            >
              <div
                className={`flex items-center border-r-3 border-b-4 border-b-transparent border-r-transparent gap-3 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:border-r-blue-200 hover:border-b-blue-200 w-full ${
                  isActive("/dashboard/users")
                    ? "bg-blue-600 border-r-blue-200 border-b-blue-200 text-white"
                    : ""
                }`}
              >
                <span className="w-6 h-6">
                  <svg
                    className="size-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.8255 22C10.3755 22 9.98814 21.85 9.66347 21.55C9.3388 21.25 9.1428 20.8833 9.07547 20.45L8.85047 18.8C8.6338 18.7167 8.4298 18.6167 8.23847 18.5C8.04714 18.3833 7.85947 18.2583 7.67547 18.125L6.12547 18.775C5.7088 18.9583 5.29214 18.975 4.87547 18.825C4.4588 18.675 4.1338 18.4083 3.90047 18.025L2.72547 15.975C2.49214 15.5917 2.42547 15.1833 2.52547 14.75C2.62547 14.3167 2.85047 13.9583 3.20047 13.675L4.52547 12.675C4.5088 12.5583 4.50047 12.4457 4.50047 12.337V11.662C4.50047 11.554 4.5088 11.4417 4.52547 11.325L3.20047 10.325C2.85047 10.0417 2.62547 9.68333 2.52547 9.25C2.42547 8.81667 2.49214 8.40833 2.72547 8.025L3.90047 5.975C4.1338 5.59167 4.4588 5.325 4.87547 5.175C5.29214 5.025 5.7088 5.04167 6.12547 5.225L7.67547 5.875C7.8588 5.74167 8.05047 5.61667 8.25047 5.5C8.45047 5.38333 8.65047 5.28333 8.85047 5.2L9.07547 3.55C9.14214 3.11667 9.33814 2.75 9.66347 2.45C9.9888 2.15 10.3761 2 10.8255 2H13.1755C13.6255 2 14.0131 2.15 14.3385 2.45C14.6638 2.75 14.8595 3.11667 14.9255 3.55L15.1505 5.2C15.3671 5.28333 15.5715 5.38333 15.7635 5.5C15.9555 5.61667 16.1428 5.74167 16.3255 5.875L17.8755 5.225C18.2921 5.04167 18.7088 5.025 19.1255 5.175C19.5421 5.325 19.8671 5.59167 20.1005 5.975L21.2755 8.025C21.5088 8.40833 21.5755 8.81667 21.4755 9.25C21.3755 9.68333 21.1505 10.0417 20.8005 10.325L19.4755 11.325C19.4921 11.4417 19.5005 11.5543 19.5005 11.663V12.337C19.5005 12.4457 19.4838 12.5583 19.4505 12.675L20.7755 13.675C21.1255 13.9583 21.3505 14.3167 21.4505 14.75C21.5505 15.1833 21.4838 15.5917 21.2505 15.975L20.0505 18.025C19.8171 18.4083 19.4921 18.675 19.0755 18.825C18.6588 18.975 18.2421 18.9583 17.8255 18.775L16.3255 18.125C16.1421 18.2583 15.9505 18.3833 15.7505 18.5C15.5505 18.6167 15.3505 18.7167 15.1505 18.8L14.9255 20.45C14.8588 20.8833 14.6631 21.25 14.3385 21.55C14.0138 21.85 13.6261 22 13.1755 22H10.8255ZM12.0505 15.5C13.0171 15.5 13.8421 15.1583 14.5255 14.475C15.2088 13.7917 15.5505 12.9667 15.5505 12C15.5505 11.0333 15.2088 10.2083 14.5255 9.525C13.8421 8.84167 13.0171 8.5 12.0505 8.5C11.0671 8.5 10.2378 8.84167 9.56247 9.525C8.88714 10.2083 8.5498 11.0333 8.55047 12C8.55114 12.9667 8.8888 13.7917 9.56347 14.475C10.2381 15.1583 11.0671 15.5 12.0505 15.5Z"
                      fill="white"
                    />
                  </svg>
                </span>

                {!collapsed && <span>Settings</span>}
              </div>
            </Link>
          )}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex gap-3 items-center cursor-pointer px-4 py-3 hover:bg-blue-600"
        >
          <LogOut className="text-red-300" />
          {!collapsed && "Logout"}
        </button>
      </aside>

      {/* Backdrop for mobile when sidebar open */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30"
          onClick={closeMobile}
          aria-hidden
        />
      )}

      {/* ------------------------------ MAIN CONTENT ------------------------------ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 shadow-md text-gray-800 flex items-center justify-between px-3">
          {/* Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggle}
              className="cursor-pointer flex items-center rounded p-1 hover:bg-gray-100"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6" strokeWidth={3} />
            </button>

            {/* Show a small indicator (optional): collapsed state */}
            {!isMobile && (
              <div className="text-sm text-gray-600">{collapsed ? "" : ""}</div>
            )}
          </div>

          <div className="flex items-center gap-3 p-2">
            <UserCircle className="w-6 h-6 text-gray-900" />
            <span className="font-semibold">{username}</span>
          </div>
        </header>

        {/* Page Content (scroll di area ini) */}
        <main className="flex-1 rounded-sm overflow-auto shadow-[0_0_5px_rgba(0,0,0,0.3)] m-3 ">
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * SidebarItem component
 * - active prop: when true, applies the same style as hover (so it looks identical to your hover state)
 * - collapsed controls label collapse animation
 */
function SidebarItem({
  href,
  icon,
  label,
  collapsed,
  active = false,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      className="flex items-center mr-3 px-2 py-2"
      onClick={onClick}
    >
      <div
        className={`sidebar-item flex items-center gap-3 px-3 w-full h-10 rounded-lg transition duration-150 ease-in-out ${
          active ? "active" : ""
        }`}
      >
        <span className="w-6 h-6 flex-shrink-0">{icon}</span>

        <div
          className={`overflow-hidden transform transition-all duration-300 ${
            collapsed
              ? "max-w-0 opacity-0 -translate-x-2"
              : "max-w-[200px] opacity-100 translate-x-0"
          }`}
        >
          <span className="inline-block whitespace-nowrap">{label}</span>
        </div>
      </div>
    </Link>
  );
}
