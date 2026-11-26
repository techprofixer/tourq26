import sanitizeHtml from "sanitize-html";

const blogSanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    "h1",
    "h2",
    "h3",
    "img",
    "span",
    "u",
    "pre",
    "code",
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    // Every page template renders its own single <h1>; body copy exported from editors/Word often
    // uses <h1> for section titles, which would leave multiple H1s on the page. Demote to <h2>.
    h1: "h2",
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
};

export function sanitizeBlogHtml(html: string): string {
  return sanitizeHtml(html || "", blogSanitizeOptions);
}
