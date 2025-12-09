"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectWallet } from "@thirdweb-dev/react";
import { Menu, X, Zap, BarChart3, ShoppingBag, PlusCircle } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
    { href: "/create-agent", label: "Create Agent", icon: PlusCircle },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "backdrop-blur-xl bg-black/50 border-b border-white/10"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-gradient-to-br from-purple-600 to-cyan-500 p-1.5 sm:p-2 rounded-lg">
                  <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
              </motion.div>
              <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                AgentHub
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 rounded-lg flex items-center space-x-2 text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Connect Wallet Button */}
            <div className="hidden md:block">
              <ConnectWallet
                theme="dark"
                btnTitle="Connect Wallet"
                className="!bg-gradient-to-r !from-purple-600 !to-cyan-600 hover:!from-purple-500 hover:!to-cyan-500 !transition-all !duration-300 !rounded-lg !px-4 !py-2 md:!px-6 md:!py-3 !font-semibold !text-sm md:!text-base"
              />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors touch-manipulation"
              aria-label="Toggle menu"
              tabIndex={0}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-16 sm:top-20 left-0 right-0 z-40 md:hidden backdrop-blur-xl bg-black/90 border-b border-white/10 max-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-5rem)] overflow-y-auto"
          >
            <div className="px-3 sm:px-4 py-4 sm:py-6 space-y-2 sm:space-y-3">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      tabIndex={0}
                      role="button"
                      aria-label={link.label}
                    >
                      <Icon className="w-5 h-5 text-purple-400" />
                      <span className="text-white font-medium">{link.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
              <div className="pt-3 sm:pt-4">
                <ConnectWallet
                  theme="dark"
                  btnTitle="Connect Wallet"
                  className="!w-full !bg-gradient-to-r !from-purple-600 !to-cyan-600 !rounded-lg !py-2.5 sm:!py-3 !text-sm sm:!text-base"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

