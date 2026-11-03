"use client";

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

interface NavbarProps {
  onOpenDemo?: (plan?: string) => void;
  onOpenLogin?: () => void;
}

export default function Navbar({ onOpenDemo, onOpenLogin }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Workspace", href: "#workspace" },
    { name: "Docs", href: "#docs" },
  ];

  return (
    <header className="w-full bg-[#F5F5F5] sticky top-0 z-40 transition-all border-b border-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-2 group transition-opacity hover:opacity-90"
            >
              <span className="text-[22px] font-black tracking-[-0.03em] text-black uppercase font-sans">
                QUIZFORGE
              </span>
              <div className="w-3.5 h-3.5 bg-black rounded-[1px] translate-y-[-1px]"></div>
            </Link>
          </div>

          {/* Centered Navigation Links: Features, Workspace, Docs */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <div key={link.name} className="relative flex flex-col items-center">
                <a
                  href={link.href}
                  className="text-[14px] font-medium text-neutral-700 hover:text-black transition-colors"
                >
                  {link.name}
                </a>
              </div>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link
              to="/login"
              className="bg-white hover:bg-neutral-50 text-neutral-900 font-medium text-[13px] px-5 py-2 rounded-full border border-neutral-300/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-neutral-400 hover:shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              Login
            </Link>

            <Link
              to="/login"
              className="bg-[#7B0FE8] hover:bg-[#680ec7] text-white font-medium text-[13px] px-5 py-2 rounded-full shadow-[0_2px_8px_rgba(123,15,232,0.25)] hover:shadow-[0_4px_14px_rgba(123,15,232,0.35)] transition-all active:scale-[0.98] cursor-pointer"
            >
              Get started free
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-neutral-800 hover:bg-neutral-200/60 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-neutral-200 px-6 py-6 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium py-1 text-neutral-700 hover:text-black"
              >
                {link.name}
              </a>
            ))}

            <div className="pt-4 border-t border-neutral-100 flex flex-col space-y-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center bg-white text-neutral-900 font-medium text-sm py-2.5 rounded-full border border-neutral-300 shadow-xs"
              >
                Login
              </Link>

              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center bg-[#7B0FE8] text-white font-medium text-sm py-2.5 rounded-full shadow-xs"
              >
                Get started free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
