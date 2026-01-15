import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  canonical?: string;
}

/**
 * Composant pour gérer les métadonnées SEO et Open Graph
 * Utilisé pour optimiser le partage social et le référencement
 */
export function SEOHead({
  title,
  description,
  keywords = [],
  image,
  url,
  type = "website",
  author,
  publishedDate,
  modifiedDate,
  canonical,
}: SEOHeadProps) {
  useEffect(() => {
    // Titre de la page
    document.title = `${title} | Ressourcerie IFAC`;

    // Meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    }

    // Meta keywords
    if (keywords.length > 0) {
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute("content", keywords.join(", "));
      }
    }

    // Open Graph - Title
    updateMetaTag("og:title", title);

    // Open Graph - Description
    updateMetaTag("og:description", description);

    // Open Graph - Type
    updateMetaTag("og:type", type);

    // Open Graph - Image
    if (image) {
      updateMetaTag("og:image", image);
      updateMetaTag("og:image:width", "1200");
      updateMetaTag("og:image:height", "630");
    }

    // Open Graph - URL
    if (url) {
      updateMetaTag("og:url", url);
    }

    // Twitter Card
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", title);
    updateMetaTag("twitter:description", description);
    if (image) {
      updateMetaTag("twitter:image", image);
    }

    // Article metadata
    if (type === "article") {
      if (author) {
        updateMetaTag("article:author", author);
      }
      if (publishedDate) {
        updateMetaTag("article:published_time", publishedDate);
      }
      if (modifiedDate) {
        updateMetaTag("article:modified_time", modifiedDate);
      }
    }

    // Canonical URL
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonical);
    }

    // Structured Data (JSON-LD)
    const structuredData = {
      "@context": "https://schema.org",
      "@type": type === "article" ? "Article" : "WebPage",
      name: title,
      description: description,
      ...(image && { image: image }),
      ...(url && { url: url }),
      ...(author && { author: { "@type": "Person", name: author } }),
      ...(publishedDate && { datePublished: publishedDate }),
      ...(modifiedDate && { dateModified: modifiedDate }),
    };

    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement("script");
      script.setAttribute("type", "application/ld+json");
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
  }, [title, description, keywords, image, url, type, author, publishedDate, modifiedDate, canonical]);

  return null;
}

/**
 * Fonction utilitaire pour mettre à jour ou créer une balise meta
 */
function updateMetaTag(name: string, content: string) {
  let tag = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    const isProperty = name.startsWith("og:") || name.startsWith("article:");
    if (isProperty) {
      tag.setAttribute("property", name);
    } else {
      tag.setAttribute("name", name);
    }
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

/**
 * Hook pour générer les métadonnées SEO
 */
export function useSEO(seoProps: SEOHeadProps) {
  return <SEOHead {...seoProps} />;
}
