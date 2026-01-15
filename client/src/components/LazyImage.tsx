import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
}

export function LazyImage({
  src,
  alt,
  placeholder,
  className,
  width,
  height,
  onLoad,
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = src;
            observer.unobserve(img);
          }
        });
      },
      { rootMargin: "50px" }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src]);

  const handleLoad = () => {
    setImageSrc(src);
    setIsLoading(false);
    onLoad?.();
  };

  return (
    <div
      className={cn("relative overflow-hidden bg-muted", className)}
      style={{
        aspectRatio: width && height ? `${width}/${height}` : undefined,
      }}
    >
      <img
        ref={imgRef}
        src={placeholder || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3C/svg%3E"}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoading ? "opacity-50 blur-sm" : "opacity-100"
        )}
        onLoad={handleLoad}
        width={width}
        height={height}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="animate-pulse w-8 h-8 bg-muted-foreground/20 rounded-full" />
        </div>
      )}
    </div>
  );
}
