"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

interface Specification {
    label: string;
    value: string;
    tooltip?: string;
}

interface SpecificationGroup {
    title: string;
    specs: Specification[];
}

interface ProductSpecificationsProps {
    specifications?: SpecificationGroup[];
    description?: string;
    sku?: string;
    className?: string;
}

// Default specifications from product data if none provided
function generateDefaultSpecs(sku?: string): SpecificationGroup[] {
    return [
        {
            title: "Informations générales",
            specs: [
                { label: "Référence", value: sku || "N/A" },
                { label: "Garantie", value: "2 ans" },
                { label: "Origine", value: "Union Européenne" },
            ]
        },
        {
            title: "Conformité",
            specs: [
                { label: "Normes CE", value: "Oui" },
                { label: "Certification ISO", value: "ISO 13485" },
                { label: "Marquage", value: "Conforme" },
            ]
        }
    ];
}

export function ProductSpecifications({
    specifications,
    description,
    sku,
    className
}: ProductSpecificationsProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Informations générales"]));

    const specGroups = specifications || generateDefaultSpecs(sku);

    const toggleGroup = (title: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(title)) {
                next.delete(title);
            } else {
                next.add(title);
            }
            return next;
        });
    };

    return (
        <section className={cn("mt-12 pt-8 border-t border-slate-200", className)}>
            <h2 className="text-2xl font-bold tracking-tight mb-6">
                Caractéristiques techniques
            </h2>

            {/* Description if provided */}
            {description && (
                <div className="mb-8 p-4 bg-slate-50 rounded-xl">
                    <p className="text-slate-600 leading-relaxed">
                        {description}
                    </p>
                </div>
            )}

            {/* Specification Groups */}
            <div className="space-y-3">
                {specGroups.map((group) => {
                    const isExpanded = expandedGroups.has(group.title);

                    return (
                        <div
                            key={group.title}
                            className="border border-slate-200 rounded-xl overflow-hidden"
                        >
                            <button
                                onClick={() => toggleGroup(group.title)}
                                className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left"
                                aria-expanded={isExpanded}
                            >
                                <span className="font-semibold text-slate-900">
                                    {group.title}
                                </span>
                                {isExpanded ? (
                                    <ChevronUp className="size-5 text-slate-400" />
                                ) : (
                                    <ChevronDown className="size-5 text-slate-400" />
                                )}
                            </button>

                            <div className={cn(
                                "overflow-hidden transition-all duration-300",
                                isExpanded ? "max-h-96" : "max-h-0"
                            )}>
                                <div className="bg-slate-50 px-4 py-3">
                                    <dl className="divide-y divide-slate-200">
                                        {group.specs.map((spec, index) => (
                                            <div
                                                key={index}
                                                className="flex justify-between py-3 first:pt-0 last:pb-0"
                                            >
                                                <dt className="flex items-center gap-1.5 text-sm text-slate-600">
                                                    {spec.label}
                                                    {spec.tooltip && (
                                                        <span
                                                            className="cursor-help"
                                                            title={spec.tooltip}
                                                        >
                                                            <Info className="size-3.5 text-slate-400" />
                                                        </span>
                                                    )}
                                                </dt>
                                                <dd className="text-sm font-medium text-slate-900">
                                                    {spec.value}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
