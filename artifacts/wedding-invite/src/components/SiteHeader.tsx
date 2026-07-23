import React from "react";
import { useLocation } from "wouter";
import { Menu, X } from "lucide-react";

export type SiteNavItem = {
  label: string;
  href?: string;
  onClick?: () => void;
};

interface SiteHeaderProps {
  navItems: SiteNavItem[];
  activeLabel?: string;
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  rightSlot?: React.ReactNode;
  onLogoClick?: () => void;
}

export default function SiteHeader({
  navItems,
  activeLabel,
  navOpen,
  setNavOpen,
  rightSlot,
  onLogoClick,
}: SiteHeaderProps) {
  const [, navigate] = useLocation();

  const handleNavClick = (item: SiteNavItem) => {
    if (item.onClick) item.onClick();
    else if (item.href) navigate(item.href);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
        <button
          className="sm:hidden text-gray-500 hover:text-gray-800 transition-colors"
          onClick={() => setNavOpen(!navOpen)}
          aria-label="Menu"
        >
          {navOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="flex-1 flex sm:flex-none items-center justify-center sm:justify-start">
          <button
            onClick={onLogoClick ?? (() => navigate("/"))}
            className="font-serif text-xl text-gray-800 tracking-wide hover:opacity-70 transition-opacity"
            style={{ fontFamily: "'Dancing Script', cursive" }}
          >
            WedInBytes
          </button>
        </div>

        <nav className="hidden sm:flex items-center gap-6 flex-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className={`text-xs font-semibold tracking-widest transition-colors ${
                item.label === activeLabel
                  ? "text-gray-900 border-b-2 border-gray-900 pb-0.5"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {rightSlot}
        </div>
      </div>
    </header>
  );
}
