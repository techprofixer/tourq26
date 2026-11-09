"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLink, NavMegaMenus } from "@/lib/nav-content";

/**
 * Sticky marketing nav (DESIGN.md → nav-bar).
 * - Opens on the dark hero band; switches to a glass-blurred light chrome once scrolled.
 * - Desktop (lg+): centred link row with accessible dropdowns (hover, click, keyboard, Esc).
 * - Mobile (<lg): full-height drawer with accordion submenus, scroll lock, Esc / route-change close.
 */

const HOVER_CLOSE_DELAY = 140;

function isLinkActive(pathname: string, href: string) {
  if (!href || href.includes("#")) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function externalProps(link: NavLink) {
  return link.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {};
}

function ChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={`h-3.5 w-3.5 ${className}`}>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={`h-3.5 w-3.5 ${className}`}>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Header({
  navLinks = [],
  megaMenus = {},
  logoUrl,
  logoDarkUrl,
  bannerActive = false,
}: {
  navLinks?: NavLink[];
  megaMenus?: NavMegaMenus;
  logoUrl?: string;
  /** Logo variant for dark backgrounds (hero band / mobile drawer); falls back to `logoUrl`. */
  logoDarkUrl?: string;
  /** Offsets the header below the fixed OfferBanner (h-10) when one is showing. */
  bannerActive?: boolean;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Close everything on navigation (state adjustment during render, no effect needed).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMobileOpen(false);
    setMobileSection(null);
    setOpenMenu(null);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Esc closes whichever menu is open and returns focus to its trigger.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (openMenu) {
        triggerRefs.current[openMenu]?.focus();
        setOpenMenu(null);
      }
      setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openMenu]);

  // Lock page scroll behind the mobile drawer; auto-close it when resized to desktop.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => e.matches && setMobileOpen(false);
    mq.addEventListener("change", onChange);
    return () => {
      document.body.style.overflow = prev;
      mq.removeEventListener("change", onChange);
    };
  }, [mobileOpen]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenMenu(null), HOVER_CLOSE_DELAY);
  }, [cancelClose]);

  // Dark chrome while over the hero, or whenever the mobile drawer is open.
  const dark = !scrolled || mobileOpen;
  const topOffset = bannerActive ? "2.5rem" : "0px";
  const activeLogo = (dark && logoDarkUrl) || logoUrl;

  return (
    <header
      className={`fixed inset-x-0 z-[55] transition-[background-color,color,box-shadow] duration-300 ${
        bannerActive ? "top-10" : "top-0"
      } ${
        dark
          ? "border-b border-white/[0.06] bg-[var(--brand-canvas-dark)] text-white"
          : "glass-panel text-[var(--app-fg)] shadow-[0_1px_24px_-12px_rgba(0,0,0,0.18)]"
      }`}
      data-band={dark ? "dark" : "auto"}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center gap-4 px-4 sm:px-6 lg:gap-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          aria-label="Home"
          className="flex shrink-0 items-center font-display text-[20px] font-medium tracking-[-0.02em] text-inherit transition-opacity hover:opacity-80"
        >
          {activeLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={activeLogo} alt="" className="h-7 w-auto" />
          ) : (
            <>
              torq<span className="brand-gradient-text">.studio</span>
            </>
          )}
        </Link>

        {/* Desktop links */}
        <nav className="hidden min-w-0 flex-1 justify-center lg:flex" aria-label="Primary">
          <ul className="flex items-center gap-0.5 xl:gap-1">
            {navLinks.map((link) => {
              const items = megaMenus[link.href] ?? [];
              const hasMenu = items.length > 0;
              const active = isLinkActive(pathname, link.href);
              const isOpen = openMenu === link.href;
              const menuId = `nav-menu-${link.href.replace(/[^a-z0-9]/gi, "")}`;

              const itemBase = `inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1.5 text-[13.5px] font-medium tracking-tight transition-colors duration-150 xl:px-3 ${
                dark
                  ? active || isOpen
                    ? "bg-white/10 text-white"
                    : "text-white/75 hover:bg-white/[0.07] hover:text-white"
                  : active || isOpen
                    ? "bg-black/[0.06] text-[var(--app-fg)]"
                    : "text-[var(--app-muted-fg)] hover:bg-black/[0.04] hover:text-[var(--app-fg)]"
              }`;

              if (!hasMenu) {
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={itemBase}
                      {...externalProps(link)}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              }

              const columns = items.length > 6;
              return (
                <li
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => {
                    cancelClose();
                    setOpenMenu(link.href);
                  }}
                  onMouseLeave={scheduleClose}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpenMenu(null);
                  }}
                >
                  <button
                    type="button"
                    ref={(el) => {
                      triggerRefs.current[link.href] = el;
                    }}
                    aria-expanded={isOpen}
                    aria-controls={menuId}
                    onClick={() => setOpenMenu(isOpen ? null : link.href)}
                    className={itemBase}
                  >
                    {link.label}
                    <ChevronDown
                      className={`opacity-70 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <div
                    id={menuId}
                    className={`absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 transition-[opacity,transform,visibility] duration-200 ease-out ${
                      isOpen
                        ? "visible translate-y-0 opacity-100"
                        : "invisible -translate-y-1 opacity-0 pointer-events-none"
                    }`}
                  >
                    <div
                      className={`overflow-hidden rounded-[var(--radius-lg)] border shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] ${
                        columns ? "w-[580px]" : "w-[300px]"
                      }`}
                      style={{
                        backgroundColor: "var(--app-surface)",
                        borderColor: "rgba(0,0,0,0.08)",
                        color: "var(--app-fg)",
                      }}
                    >
                      <div className="h-[2px]" style={{ backgroundImage: "var(--brand-gradient)" }} />
                      <div className="p-3">
                        <p className="mono-eyebrow px-2.5 pb-2 pt-1 text-[var(--app-muted-fg)]">
                          {link.label}
                        </p>
                        <ul className={columns ? "grid grid-cols-2 gap-x-2" : "flex flex-col"}>
                          {items.map((item) => {
                            const itemActive = isLinkActive(pathname, item.href);
                            return (
                              <li key={item.href}>
                                <Link
                                  href={item.href}
                                  aria-current={itemActive ? "page" : undefined}
                                  className={`group/item flex items-center justify-between gap-3 rounded-[var(--radius-md)] px-2.5 py-2 text-[13.5px] transition-colors hover:bg-[var(--app-muted)] hover:text-[var(--app-fg)] focus-visible:bg-[var(--app-muted)] ${
                                    itemActive ? "bg-[var(--app-muted)] text-[var(--app-fg)]" : "text-[var(--app-muted-fg)]"
                                  }`}
                                >
                                  <span className="truncate">{item.label}</span>
                                  <ArrowRight className="shrink-0 -translate-x-1 opacity-0 transition-all duration-150 group-hover/item:translate-x-0 group-hover/item:opacity-100" />
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      <Link
                        href={link.href}
                        className="mono-button flex items-center justify-between border-t px-5 py-3.5 text-[12px] transition-colors hover:bg-[var(--app-muted)]"
                        style={{ borderColor: "rgba(0,0,0,0.06)" }}
                        {...externalProps(link)}
                      >
                        View all {link.label}
                        <ArrowRight />
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Desktop CTAs */}
        <div className="ml-auto hidden shrink-0 items-center gap-2 lg:flex">
          <Link
            href="/contact"
            className={`mono-button hidden rounded-[var(--radius-sm)] px-3 py-2 transition-opacity xl:inline-flex ${
              dark ? "text-white/80 hover:text-white" : "text-[var(--app-muted-fg)] hover:text-[var(--app-fg)]"
            }`}
          >
            Contact sales
          </Link>
          <Link
            href="/contact"
            className={`btn-base group/cta !py-2.5 ${dark ? "btn-mint" : "btn-primary"}`}
          >
            Get started
            <ArrowRight className="transition-transform duration-150 group-hover/cta:translate-x-0.5" />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          className={`relative -mr-2 ml-auto flex h-10 w-10 items-center justify-center rounded-full transition-colors lg:hidden ${
            dark ? "hover:bg-white/10" : "hover:bg-black/5"
          }`}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span className="relative block h-3.5 w-5">
            <span
              className={`absolute left-0 top-0 h-[1.5px] w-5 rounded bg-current transition-all duration-300 ${
                mobileOpen ? "top-1/2 -translate-y-1/2 rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 h-[1.5px] w-5 -translate-y-1/2 rounded bg-current transition-opacity duration-200 ${
                mobileOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute bottom-0 left-0 h-[1.5px] w-5 rounded bg-current transition-all duration-300 ${
                mobileOpen ? "bottom-1/2 translate-y-1/2 -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        className={`absolute inset-x-0 top-full flex flex-col overflow-hidden border-t border-white/[0.06] bg-[var(--brand-canvas-dark)] text-white transition-[opacity,transform,visibility] duration-300 ease-out lg:hidden ${
          mobileOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0 pointer-events-none"
        }`}
        style={{ height: `calc(100dvh - 4rem - ${topOffset})` }}
        aria-hidden={!mobileOpen}
      >
        <nav className="flex-1 overflow-y-auto px-4 py-4 sm:px-6" aria-label="Mobile primary">
          <ul className="flex flex-col divide-y divide-white/[0.06]">
            {navLinks.map((link) => {
              const items = megaMenus[link.href] ?? [];
              const hasMenu = items.length > 0;
              const active = isLinkActive(pathname, link.href);
              const expanded = mobileSection === link.href;
              const sectionId = `m-nav-${link.href.replace(/[^a-z0-9]/gi, "")}`;

              return (
                <li key={link.href}>
                  {hasMenu ? (
                    <>
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={sectionId}
                        onClick={() => setMobileSection(expanded ? null : link.href)}
                        className={`flex w-full items-center justify-between py-4 text-left text-[17px] font-medium ${
                          active ? "text-white" : "text-white/85"
                        }`}
                      >
                        {link.label}
                        <ChevronDown
                          className={`h-4 w-4 text-white/60 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                        />
                      </button>
                      <div
                        id={sectionId}
                        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <ul className="flex flex-col gap-0.5 pb-4 pl-3">
                            {items.map((item) => (
                              <li key={item.href}>
                                <Link
                                  href={item.href}
                                  tabIndex={expanded ? undefined : -1}
                                  onClick={() => setMobileOpen(false)}
                                  className={`block rounded-[var(--radius-md)] px-3 py-2.5 text-[15px] transition-colors hover:bg-white/5 hover:text-white ${
                                    isLinkActive(pathname, item.href) ? "bg-white/5 text-white" : "text-white/65"
                                  }`}
                                >
                                  {item.label}
                                </Link>
                              </li>
                            ))}
                            <li>
                              <Link
                                href={link.href}
                                tabIndex={expanded ? undefined : -1}
                                onClick={() => setMobileOpen(false)}
                                className="mono-button mt-1 inline-flex items-center gap-2 px-3 py-2.5 text-[12px] text-[var(--brand-mint)]"
                              >
                                View all {link.label}
                                <ArrowRight />
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center justify-between py-4 text-[17px] font-medium transition-colors hover:text-white ${
                        active ? "text-white" : "text-white/85"
                      }`}
                      {...externalProps(link)}
                    >
                      {link.label}
                      {active ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-mint)]" aria-hidden="true" />
                      ) : null}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="grid grid-cols-2 gap-2 border-t border-white/[0.08] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
          <Link href="/contact" onClick={() => setMobileOpen(false)} className="btn-base btn-white w-full">
            Contact sales
          </Link>
          <Link href="/contact" onClick={() => setMobileOpen(false)} className="btn-base btn-mint w-full">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
