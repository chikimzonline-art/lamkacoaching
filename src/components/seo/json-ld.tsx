/**
 * JsonLd — Reusable component for injecting JSON-LD structured data.
 * Renders a <script type="application/ld+json"> tag server-side so
 * search engines can read it without executing JavaScript.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
