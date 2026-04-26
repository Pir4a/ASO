"use client";

import { useRef, useState } from "react";
import { authFetch } from "@/lib/auth";
import { API_URL } from "@/lib/api";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/*";

interface MediaUploadProps {
    /** Current image URL (full, e.g. `${API_URL}/media/<id>` or any external URL). */
    value: string;
    onChange: (url: string) => void;
    label?: string;
    /** Optional preview height (px). */
    previewHeight?: number;
}

export function MediaUpload({
    value,
    onChange,
    label,
    previewHeight = 100,
}: MediaUploadProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [uploading, setUploading] = useState(false);
    const [hover, setHover] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const upload = async (file: File) => {
        setError(null);
        if (!file.type.startsWith("image/")) {
            setError("Format non supporté (image/* uniquement).");
            return;
        }
        if (file.size > MAX_BYTES) {
            setError("Fichier trop volumineux (max 5 Mo).");
            return;
        }
        setUploading(true);
        try {
            const form = new FormData();
            form.append("file", file);
            const res = await authFetch(`${API_URL}/admin/media`, {
                method: "POST",
                body: form,
            });
            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as { message?: string };
                throw new Error(body.message || `HTTP ${res.status}`);
            }
            const data = (await res.json()) as { id: string; url: string };
            onChange(`${API_URL}${data.url}`);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setUploading(false);
        }
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setHover(false);
        const file = e.dataTransfer.files?.[0];
        if (file) void upload(file);
    };

    const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) void upload(file);
        e.target.value = ""; // allow re-uploading the same file
    };

    return (
        <div>
            {label && <label className="bo-label" style={{ display: "block", marginBottom: 4 }}>{label}</label>}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setHover(true);
                }}
                onDragLeave={() => setHover(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                style={{
                    border: `1px dashed ${hover ? "var(--bo-brand)" : "var(--bo-border)"}`,
                    background: hover ? "color-mix(in srgb, var(--bo-brand) 8%, transparent)" : "var(--bo-panel-2)",
                    borderRadius: 8,
                    padding: 12,
                    cursor: "pointer",
                    transition: "border 0.15s, background 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                }}
            >
                {value ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={value}
                        alt=""
                        style={{
                            height: previewHeight,
                            maxWidth: previewHeight * 1.6,
                            objectFit: "cover",
                            borderRadius: 4,
                            background: "white",
                            border: "1px solid var(--bo-border)",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            height: previewHeight,
                            width: previewHeight * 1.6,
                            borderRadius: 4,
                            background: "white",
                            border: "1px dashed var(--bo-border)",
                            display: "grid",
                            placeItems: "center",
                            color: "var(--bo-text-dim)",
                            fontSize: 11,
                        }}
                    >
                        Aucune image
                    </div>
                )}
                <div style={{ flex: 1, fontSize: 12, color: "var(--bo-text)" }}>
                    {uploading ? (
                        <p>Téléversement…</p>
                    ) : (
                        <>
                            <p style={{ fontWeight: 600 }}>Glissez une image ici</p>
                            <p className="bo-muted" style={{ fontSize: 11 }}>
                                ou cliquez pour sélectionner — JPG/PNG/WebP, max 5 Mo
                            </p>
                        </>
                    )}
                    {error && (
                        <p style={{ color: "var(--error, #c0392b)", fontSize: 11, marginTop: 4 }}>{error}</p>
                    )}
                    {value && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange("");
                            }}
                            className="bo-btn"
                            style={{ marginTop: 6, padding: "2px 8px", fontSize: 11 }}
                        >
                            Retirer
                        </button>
                    )}
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPT}
                    onChange={onPick}
                    style={{ display: "none" }}
                />
            </div>
        </div>
    );
}
