/**
 * Line-icon set for the torqOS landing page. Built from primitive shapes
 * (circle/rect/line) rather than traced glyph paths — keeps the set visually
 * consistent with the mono/technical brand voice and avoids pulling in an
 * icon-library dependency for a dozen one-off marks.
 */

type IconProps = {
  className?: string;
};

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <polyline points="5 12.5 9.5 17 19 6.5" />
    </svg>
  );
}

export function ScatterIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="6" cy="7" r="1.4" />
      <circle cx="16.5" cy="6" r="1.1" />
      <circle cx="11" cy="12.5" r="1.7" />
      <circle cx="18" cy="15" r="1.2" />
      <circle cx="5.5" cy="17" r="1" />
      <circle cx="14.5" cy="18.5" r="1.3" />
    </svg>
  );
}

export function GridIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <line x1="4" y1="10.5" x2="20" y2="10.5" />
      <line x1="4" y1="15.5" x2="20" y2="15.5" />
      <line x1="10.5" y1="4" x2="10.5" y2="20" />
    </svg>
  );
}

export function EyeOffIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 12s3.4-5.5 9-5.5 9 5.5 9 5.5-3.4 5.5-9 5.5S3 12 3 12Z" />
      <circle cx="12" cy="12" r="2.1" />
      <line x1="4" y1="19" x2="20" y2="5" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8" />
      <line x1="12" y1="7.5" x2="12" y2="12" />
      <line x1="12" y1="12" x2="15" y2="14" />
    </svg>
  );
}

export function UnlinkIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="9.5" width="6" height="5" rx="1.5" />
      <rect x="15" y="9.5" width="6" height="5" rx="1.5" />
      <line x1="9.5" y1="12" x2="8.5" y2="12" />
      <line x1="15.5" y1="12" x2="14.5" y2="12" />
      <line x1="4" y1="18" x2="6" y2="20" />
      <line x1="18" y1="4" x2="20" y2="6" />
    </svg>
  );
}

export function DiceIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <circle cx="8.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
      <circle cx="17" cy="9" r="2.3" />
      <path d="M15 14.2c2.5.2 4.5 2.2 4.5 5.3" />
    </svg>
  );
}

export function ChecklistIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <path d="M7.5 12l1.8 1.8L11.5 10" />
      <line x1="13.5" y1="8" x2="17" y2="8" />
      <line x1="13.5" y1="16" x2="17" y2="16" />
      <path d="M7.5 16.2h.01" />
    </svg>
  );
}

export function WalletIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="6" width="17" height="13" rx="1.8" />
      <path d="M3.5 10h17" />
      <circle cx="16.5" cy="14" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ZapIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12.5 3.5 6 13h4.5l-1 7.5 6.5-9.5H11.5l1-7.5Z" />
    </svg>
  );
}

export function TrendingUpIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <polyline points="4 16 9.5 10.5 13.5 14.5 20 7" />
      <polyline points="14.5 7 20 7 20 12.5" />
    </svg>
  );
}

export function PlugIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 9V4.5M15 9V4.5" />
      <rect x="7" y="9" width="10" height="6" rx="2" />
      <path d="M12 15v2.5a3 3 0 0 1-3 3H7.5" />
    </svg>
  );
}

export function WrenchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M14.5 4.5a4.5 4.5 0 0 0-5.8 5.8L4 15v3h3l4.7-4.7a4.5 4.5 0 0 0 5.8-5.8L15 10 12 8.5 12 5.5 14.5 4.5Z" />
    </svg>
  );
}

export function MegaphoneIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 11v3a1.5 1.5 0 0 0 1.5 1.5H7l1 4h2l-.7-4H10l8 3.5V6.5L10 10H6A2 2 0 0 0 4 11Z" />
      <line x1="6.5" y1="15.5" x2="6.5" y2="11" />
    </svg>
  );
}

export function CartIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 4h2l2.3 11.2A1.8 1.8 0 0 0 9.5 16.7h7.3a1.8 1.8 0 0 0 1.75-1.4L20 8H6.2" />
      <circle cx="10" cy="20" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TruckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="7.5" width="11" height="8" rx="1" />
      <path d="M13.5 10h4l3 3v2.5h-7Z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  );
}

export function BriefcaseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="8" width="17" height="11" rx="1.8" />
      <path d="M8.5 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" />
      <line x1="3.5" y1="13" x2="20.5" y2="13" />
    </svg>
  );
}

export function MapPinIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 21s7-6.5 7-11.5a7 7 0 0 0-14 0C5 14.5 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.8 6.2l-1.6 1.6M7.8 16.2l-1.6 1.6M17.8 17.8l-1.6-1.6M7.8 7.8 6.2 6.2" />
    </svg>
  );
}

export function CatalogIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 4.5h11a2 2 0 0 1 2 2V19H7a2 2 0 0 1-2-2Z" />
      <path d="M5 17a2 2 0 0 1 2-2h11" />
      <line x1="9" y1="8.5" x2="14.5" y2="8.5" />
    </svg>
  );
}

export function TechnicianIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="9.5" cy="7" r="2.7" />
      <path d="M4 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16.5 12.5a2.3 2.3 0 0 0-3-2.2l1 1-.4 1.4-1.4.4-1-1a2.3 2.3 0 0 0 3 3l2.7 2.7 1.4-1.4Z" />
    </svg>
  );
}

export function ReceiptIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4Z" />
      <line x1="8.5" y1="8" x2="15.5" y2="8" />
      <line x1="8.5" y1="12" x2="15.5" y2="12" />
      <line x1="8.5" y1="16" x2="12.5" y2="16" />
    </svg>
  );
}

export function ContactCardIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="5.5" width="18" height="13" rx="1.8" />
      <circle cx="8.5" cy="11" r="1.9" />
      <path d="M5.5 15.5c0-1.7 1.3-2.8 3-2.8s3 1.1 3 2.8" />
      <line x1="14.5" y1="9.5" x2="18" y2="9.5" />
      <line x1="14.5" y1="13" x2="18" y2="13" />
    </svg>
  );
}

export function LayersIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.5 20.5 8 12 12.5 3.5 8Z" />
      <path d="M3.5 12 12 16.5 20.5 12" />
      <path d="M3.5 16 12 20.5 20.5 16" />
    </svg>
  );
}

export function ShieldCheckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.2-7 9-4.1-1.8-7-4.8-7-9V6Z" />
      <path d="M8.7 12.2l2.2 2.2 4.4-4.4" />
    </svg>
  );
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8" />
      <ellipse cx="12" cy="12" rx="3.4" ry="8" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  );
}

export function TicketIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.8a1.7 1.7 0 0 0 0 3.4V15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.8a1.7 1.7 0 0 0 0-3.4Z" />
      <line x1="13.5" y1="6.5" x2="13.5" y2="16.5" strokeDasharray="2 2.2" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <polyline points="6 9.5 12 15 18 9.5" />
    </svg>
  );
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M8 5.5v13a1 1 0 0 0 1.53.85l10.5-6.5a1 1 0 0 0 0-1.7l-10.5-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}
