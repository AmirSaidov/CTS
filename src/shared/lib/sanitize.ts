import DOMPurify from "isomorphic-dompurify";

/** Пользовательский HTML (статьи, описания турниров) — только после санитайза. */
export function sanitize(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "h2", "h3", "blockquote", "cite", "figure", "figcaption", "img", "a", "strong", "em", "ul", "ol", "li", "br"],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "data-placeholder", "target", "rel"],
    ALLOWED_URI_REGEXP: /^(?:https?:|\/)/i,
  });
}
