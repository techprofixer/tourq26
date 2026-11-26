"use client";

import { usePathname } from "next/navigation";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import WhatsAppIcon from "@/components/WhatsAppIcon";

const DEFAULT_MESSAGE = "Hi, I'd like to know more about your services.";

export default function FloatingWhatsApp() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  const url = buildWhatsAppUrl(DEFAULT_MESSAGE);
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-lg transition-all hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-whatsapp focus:ring-offset-2 focus:ring-offset-background"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
