import Link from "next/link";

export type BreadcrumbItem = { label: string; href: string };

/**
 * Migas de pan reutilizables: pinta el rastro visual (Inicio implícito
 * + los pasos indicados) y su BreadcrumbList en JSON-LD para SEO. El
 * último item se muestra como texto plano (es la página actual) pero
 * sí lleva su URL en el JSON-LD, como recomienda schema.org.
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://growwly-theta.vercel.app";

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
      ...items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: item.label,
        item: `${siteUrl}${item.href}`,
      })),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav
        aria-label="Migas de pan"
        className="flex flex-wrap items-center gap-1.5 text-sm text-ink-soft"
      >
        {items.map((item, i) =>
          i === items.length - 1 ? (
            <span key={item.href} className="text-ink">
              {item.label}
            </span>
          ) : (
            <span key={item.href} className="flex items-center gap-1.5">
              <Link href={item.href} className="hover:text-cyan">
                {item.label}
              </Link>
              <span aria-hidden>/</span>
            </span>
          ),
        )}
      </nav>
    </>
  );
}
