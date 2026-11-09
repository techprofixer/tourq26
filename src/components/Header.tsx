"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLink, NavMegaMenus } from "@/lib/nav-content";

/**
 * Sticky marketing nav (DESIGN.md → nav-bar).
 * Behaviour: opens transparent over the hero (canvas-dark) band; switches to a
 * glass-blurred chrome once the user scrolls so it remains legible on both
 * dark hero bands and white product bands.
 */

export default function Header({
  navLinks = [],
  megaMenus = {},
  logoUrl,
  bannerActive = false,
}: {
  navLinks?: NavLink[];
  megaMenus?: NavMegaMenus;
  logoUrl?: string;
  /** Offsets the header below the fixed OfferBanner (h-10) when one is showing. */
  bannerActive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const resolvedLinks = navLinks;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 z-50 transition-colors duration-200 ${bannerActive ? "top-10" : "top-0"} ${
        scrolled
          ? "glass-panel"
          : "bg-[var(--brand-canvas-dark)] text-white border-b border-transparent"
      }`}
      data-band={scrolled ? "auto" : "dark"}
    >
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-6 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-display text-[20px] font-medium tracking-[-0.02em] text-inherit transition-opacity hover:opacity-80"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-7 w-auto" />
          ) : (
            <>
              torq<span className="brand-gradient-text">.studio</span>
            </>
          )}
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {resolvedLinks.map((link) => {
            const isActive = pathname === link.href;
            const menuItems = megaMenus[link.href];
            const hasMenu = !!menuItems && menuItems.length > 0;

            return (
              <div
                key={link.href}
                className={hasMenu ? "group/nav relative" : "relative"}
              >
                <Link
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  aria-haspopup={hasMenu ? "true" : undefined}
                  className={`group relative py-1 text-[14px] font-medium tracking-tight text-inherit transition-opacity duration-200 ${
                    isActive ? "opacity-100" : "opacity-85 hover:opacity-100"
                  }`}
                  {...(link.openInNewTab
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {link.label}
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-x-0 -bottom-1 h-[1.5px] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 ${
                      isActive ? "scale-x-100" : ""
                    }`}
                    style={{ backgroundImage: "var(--brand-gradient)" }}
                  />
                </Link>

                {hasMenu ? (
                  <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-4 opacity-0 transition-[opacity,visibility] duration-150 group-hover/nav:visible group-hover/nav:opacity-100">
                    <div
                      className="w-[560px] max-w-[80vw] rounded-[var(--radius-md)] border p-5 shadow-2xl"
                      style={{
                        backgroundColor: "var(--app-surface)",
                        borderColor: "var(--app-hairline)",
                        color: "var(--app-fg)",
                      }}
                    >
                      <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
                        {menuItems!.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className="block truncate rounded-[var(--radius-sm)] px-2 py-1.5 text-[13px] text-[var(--app-muted-fg)] transition-colors hover:bg-[color-mix(in_srgb,var(--app-fg)_6%,transparent)] hover:text-[var(--app-fg)]"
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={link.href}
                        className="mono-button mt-4 inline-flex items-center gap-1 border-t pt-4"
                        style={{ borderColor: "var(--app-hairline)" }}
                      >
                        VIEW ALL {link.label.toUpperCase()} →
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/contact"
            className="mono-button rounded-[var(--radius-sm)] px-4 py-2 text-inherit/90 hover:text-inherit"
          >
            Contact sales
          </Link>
          <Link
            href="/contact"
            className="btn-base btn-primary"
          >
            Get started
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          className="-m-2 flex flex-col gap-1.5 rounded-md p-2 md:hidden"
          onClick={() => setOpen(!open)}
        >
          <span
            className={`h-0.5 w-6 bg-current transition-all duration-200 ${open ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`h-0.5 w-6 bg-current transition-all duration-200 ${open ? "scale-0 opacity-0" : ""}`}
          />
          <span
            className={`h-0.5 w-6 bg-current transition-all duration-200 ${open ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {open && (
        <div className="border-t border-[var(--app-glass-border)] bg-[var(--brand-canvas-dark)] text-white md:hidden">
          <div className="flex flex-col gap-3 px-4 py-4">
            <nav className="flex flex-col gap-1" aria-label="Mobile primary">
              {resolvedLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={`rounded-[var(--radius-sm)] px-3 py-3 text-[15px] font-medium transition-colors duration-150 hover:bg-white/5 hover:text-white ${
                      isActive ? "bg-white/5 text-white" : "text-white/80"
                    }`}
                    {...(link.openInNewTab
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="btn-base btn-white w-full"
              >
                Contact sales
              </Link>
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="btn-base btn-mint w-full"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
