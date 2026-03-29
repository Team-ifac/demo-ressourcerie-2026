import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const normalizedItems =
    items.length > 0 && items[0]?.href === "/" && items[0]?.label.trim().toLowerCase() === "accueil"
      ? items.slice(1)
      : items;

  return (
    <nav aria-label="Fil d'Ariane" className="breadcrumb">
      <Link href="/" className="breadcrumb-link">
        <Home className="h-4 w-4" />
      </Link>

      {normalizedItems.map((item, index) => {
        const isLast = index === normalizedItems.length - 1;

        return (
          <div key={index} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 breadcrumb-separator" />
            {isLast || !item.href ? (
              <span className="breadcrumb-current">{item.label}</span>
            ) : (
              <Link href={item.href} className="breadcrumb-link">
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
