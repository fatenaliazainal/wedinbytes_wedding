import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useLocation } from "wouter";
import type { SiteNavItem } from "@/components/SiteHeader";

interface SharedNavDrawerProps {
  navItems: SiteNavItem[];
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  drawerFooter?: React.ReactNode;
}

export default function SharedNavDrawer({
  navItems,
  navOpen,
  setNavOpen,
  drawerFooter,
}: SharedNavDrawerProps) {
  const [, navigate] = useLocation();

  const handleNavClick = (item: SiteNavItem) => {
    if (item.onClick) item.onClick();
    else if (item.href) navigate(item.href);
    setNavOpen(false);
  };

  return (
    <AnimatePresence>
      {navOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setNavOpen(false)}
          />

          <motion.div
            key="drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="sm:hidden fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 shrink-0">
              <button
                onClick={() => { navigate("/"); setNavOpen(false); }}
                className="font-serif text-lg text-gray-800 tracking-wide hover:opacity-70 transition-opacity"
              >
                Wedinstudio
              </button>
              <button
                onClick={() => setNavOpen(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex flex-col px-4 py-4 gap-1 flex-1">
              {navItems.map((item, i) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.04 }}
                  onClick={() => handleNavClick(item)}
                  className="text-left text-sm font-semibold text-gray-600 hover:text-gray-900 tracking-widest py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  {item.label}
                </motion.button>
              ))}
            </nav>

            {drawerFooter && (
              <div className="border-t border-gray-100">
                {drawerFooter}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
