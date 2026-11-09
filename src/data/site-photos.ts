/**
 * Curated stock photography, self-hosted as WebP under /public/images/photos/
 * (originally sourced from Unsplash, free to use under their license).
 * Swap `src` to your own shots whenever you have them.
 */
export type SitePhoto = { src: string; alt: string };

export const sitePhotos = {
  galleryTeam: {
    src: "/images/photos/gallery-team.webp",
    alt: "Engineering team collaborating around laptops",
  },
  galleryMobile: {
    src: "/images/photos/gallery-mobile.webp",
    alt: "Person using a mobile app on a smartphone",
  },
  galleryCode: {
    src: "/images/photos/gallery-code.webp",
    alt: "Software code on a monitor",
  },
} as const satisfies Record<string, SitePhoto>;
