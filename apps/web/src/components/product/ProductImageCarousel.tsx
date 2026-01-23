"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductImageCarouselProps {
    images: string[];
    productName: string;
    className?: string;
}

export function ProductImageCarousel({
    images,
    productName,
    className
}: ProductImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

    // Fallback to placeholder if no images
    const displayImages = images.length > 0 ? images : ["/placeholder-product.jpg"];
    const hasMultipleImages = displayImages.length > 1;

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % displayImages.length);
    }, [displayImages.length]);

    const goToPrevious = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
    }, [displayImages.length]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isZoomed) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoomPosition({ x, y });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowLeft") goToPrevious();
        if (e.key === "ArrowRight") goToNext();
        if (e.key === "Escape") setIsZoomed(false);
    };

    return (
        <div className={cn("space-y-4", className)}>
            {/* Main Image */}
            <div
                className="relative aspect-square w-full overflow-hidden rounded-3xl bg-slate-50 border border-slate-100 shadow-sm group cursor-zoom-in"
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="img"
                aria-label={`${productName} - Image ${currentIndex + 1} of ${displayImages.length}`}
            >
                <div
                    className={cn(
                        "relative w-full h-full transition-transform duration-300",
                        isZoomed && "scale-150"
                    )}
                    style={isZoomed ? {
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                    } : undefined}
                >
                    <Image
                        src={displayImages[currentIndex]}
                        alt={`${productName} - Vue ${currentIndex + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                        priority={currentIndex === 0}
                    />
                </div>

                {/* Zoom indicator */}
                <div className={cn(
                    "absolute top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-opacity",
                    isZoomed ? "opacity-0" : "opacity-100"
                )}>
                    <ZoomIn className="size-4 text-slate-600" />
                </div>

                {/* Navigation Arrows */}
                {hasMultipleImages && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Image précédente"
                        >
                            <ChevronLeft className="size-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); goToNext(); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Image suivante"
                        >
                            <ChevronRight className="size-5" />
                        </Button>
                    </>
                )}

                {/* Image Counter */}
                {hasMultipleImages && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
                        {currentIndex + 1} / {displayImages.length}
                    </div>
                )}
            </div>

            {/* Thumbnails */}
            {hasMultipleImages && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {displayImages.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all duration-200",
                                currentIndex === index
                                    ? "border-primary ring-2 ring-primary/20"
                                    : "border-transparent hover:border-slate-300"
                            )}
                            aria-label={`Voir image ${index + 1}`}
                            aria-current={currentIndex === index ? "true" : undefined}
                        >
                            <Image
                                src={image}
                                alt={`${productName} - Miniature ${index + 1}`}
                                fill
                                sizes="80px"
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
