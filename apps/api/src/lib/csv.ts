/**
 * Minimal RFC 4180-ish CSV encoder. Quotes any value containing a comma,
 * quote, CR or LF; doubles internal quotes. Includes a UTF-8 BOM so Excel
 * picks up encoding correctly.
 */
const NEEDS_QUOTING = /[",\r\n]/;
const BOM = '﻿';

export function csvEscape(value: unknown): string {
    if (value === null || value === undefined) return '';
    const s = String(value);
    if (!NEEDS_QUOTING.test(s)) return s;
    return `"${s.replace(/"/g, '""')}"`;
}

export interface CsvColumn<T> {
    header: string;
    value: (row: T) => unknown;
}

export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
    const headerLine = columns.map((c) => csvEscape(c.header)).join(',');
    const lines = rows.map((row) =>
        columns.map((c) => csvEscape(c.value(row))).join(','),
    );
    return [BOM + headerLine, ...lines].join('\r\n');
}
