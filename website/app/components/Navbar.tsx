"use client";

import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // Detect scroll for blur + color change
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu when clicking a menu item
  useEffect(() => {
    const handler = () => setOpen(false);
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur bg-white/20 shadow-lg text-black"
          : "bg-transparent text-white"
      }`}
    >
      <div className="container mx-auto px-4 md:px-20 py-3 flex items-center justify-between">
        {/* LOGO */}
        <div className="flex items-center gap-3">
          <img
            src="/asets/smk.png"
            alt="logo"
            className="w-7 h-7 object-contain hover:scale-130 transition-all duration-600"
          />
          <div className="text-xl font-bold">SMK Islam Permatasari 2</div>
        </div>

        {/* DESKTOP MENU */}
        <nav className="hidden md:flex gap-6 items-center text-md font-semibold">
          <a href="#beranda" className="nav-link">
            Beranda
          </a>
          <a href="#profil" className="nav-link">
            Profil
          </a>
          <a href="#kompetensi" className="nav-link">
            Kompetensi
          </a>
          <a href="#fasilitas" className="nav-link">
            Fasilitas
          </a>
          <a href="#berita" className="nav-link">
            Berita
          </a>
          <a href="#kontak" className="nav-link">
            Hubungi Kami
          </a>
          {/* LOGIN BUTTON */}
          <a
            href="https://app.smkislampermatasari2.sch.id"
            target="_blank"
            className="btn-cta bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md font-semibold shadow ml-2"
          >
            Login
          </a>
        </nav>

        {/* MOBILE TOGGLE */}
        <button
          className="md:hidden p-2 rounded hover:bg-black/10"
          onClick={() => setOpen(!open)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {open ? (
              <path
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* MOBILE MENU */}
      <div
        className={`
    md:hidden transition-all duration-300 overflow-hidden
    ${open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}
    ${scrolled ? "mobile-scrolled" : "mobile-top"}
  `}
      >
        <div className="px-6 pb-6 pt-2 space-y-4 text-lg font-semibold">
          <a href="#beranda" className="block nav-link hover:text-blue-600">
            Beranda
          </a>
          <a href="#profil" className="block nav-link hover:text-blue-600">
            Profil
          </a>
          <a href="#kompetensi" className="block nav-link hover:text-blue-600">
            Kompetensi
          </a>
          <a href="#fasilitas" className="block nav-link hover:text-blue-600">
            Fasilitas
          </a>
          <a href="#berita" className="block nav-link hover:text-blue-600">
            Berita
          </a>
          <a href="#kontak" className="block nav-link hover:text-blue-600">
            Hubungi Kami
          </a>
          {/* LOGIN BUTTON MOBILE */}
          <a
            href="https://app.smkislampermatasari2.sch.id"
            target="_blank"
            className="block bg-blue-600 text-white text-center py-3 rounded-md font-semibold shadow cursor-pointer"
          >
            Login
          </a>
        </div>
      </div>
    </header>
  );
}
