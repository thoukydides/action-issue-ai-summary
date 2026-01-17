// GitHub action
// Copyright © 2026 Alexander Thoukydides

// Marker for any removed content
const TRUNCATION_MARKER = '\n\n[…truncated…]\n\n';

// Patterns that match blocks that resemble logs
const LOG_PATTERNS = [
    // Matterbridge format logs
    /^(?:\w* ?\[\d\d:\d\d:\d\d\.\d\d\d\] ?\[.*\n)+/gm,
    // Homebridge format logs
    /(?:^\[\d\d?[-/.]\d\d?[-/.]\d\d\d\d, \d\d?:\d\d:\d\d(?: \w+)?\] .*\n)+/gm,
    // Repeated date stamps at the start of lines
    /(?:^\[?\d\d\d\d[-/.]\d\d?[-/.]\d\d?\D.*\n){5,}/gm,
    /(?:^\[?\d\d?[-/.]\d\d?[-/.]\d\d\d\d\D.*\n){5,}/gm
];

// Patterns that match Markdown code blocks
const CODE_PATTERNS = [
    // Fenced code blocks
    /^```\S*\n[\s\S]*?\n```/gm,
    /^~~~\S*\n[\s\S]*?\n~~~/gm,
    // Indented code blocks (at least 4 spaces or 1 tab)
    /(?:^|\n\n)(?:(?: {4}|\t).*\n)(?:(?: {4}|\t).*\n|\s*\n)*(?=\n|$)/g
];

// Truncate any large blocks that resemble logs
export function truncateLogsPartial(text: string): string {
    for (const re of LOG_PATTERNS) {
        text = text.replaceAll(re, match => {
            const lines = match.split('\n');
            const replacement = [
                ...lines.slice(0, 3),   // Keep first 3 lines
                TRUNCATION_MARKER,
                ...lines.slice(-3)      // Keep last 3 lines
            ].join('\n');
            return replacement.length < match.length ? replacement : match;
        });
    }
    return text;
}

// Fully remove any large blocks that resemble logs
// (avoid chaining after truncateLogsPartial)
export function truncateLogsFull(text: string): string {
    for (const re of LOG_PATTERNS) {
        text = text.replaceAll(re, truncateIfShorter);
    }
    return text;
}

// Fully remove any Markdown code blocks
export function truncateCodeBlocks(text: string): string {
    for (const re of CODE_PATTERNS) {
        text = text.replaceAll(re, truncateIfShorter);
    }
    return text;
}

// Truncate text (try to use good break points, but meet target regardless)
const sentenceSegmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' });
const wordSegmenter     = new Intl.Segmenter(undefined, { granularity: 'word' });
export function truncateText(text: string, maxChars: number): string {
    if (text.length <= maxChars)                return text;
    if (maxChars < TRUNCATION_MARKER.length)    return '';

    // Partition the text with different granularity
    const textPartitions = [
        text.split(/(\n\n+)/),  // (paragraphs)
        text.split(/(\n+)/),    // (lines)
        [...sentenceSegmenter.segment(text)].map(({ segment }) => segment),
        [...wordSegmenter    .segment(text)].map(({ segment }) => segment)
    ];

    // Search for a partition under the target length
    const choosePrefix = (partitions: string[][], maxChars: number): string[] => {
        const minChars = Math.floor(maxChars * 0.8);
        let prefix: string[] = [];
        for (const partition of partitions) {
            // Find longest length of this partition under the limit
            prefix = [];
            let length = 0;
            for (const segment of partition) {
                if (maxChars < length + segment.length) break;
                prefix.push(segment);
                length += segment.length;
            }
            if (minChars <= length) break;
        }
        return prefix;
    };
    const chooseSuffix = (partitions: string[][], maxChars: number): string[] =>
        choosePrefix(partitions.map(p => p.toReversed()), maxChars).toReversed();

    // Cut out the middle of the text to end up under the target
    const maxPrefixChars = Math.floor((maxChars - TRUNCATION_MARKER.length) / 2);
    const prefix = choosePrefix(textPartitions, maxPrefixChars).join('').trimEnd();
    const maxSuffixChars = Math.floor(maxChars - prefix.length - TRUNCATION_MARKER.length);
    const suffix = chooseSuffix(textPartitions, maxSuffixChars).join('').trimStart();
    return `${prefix}${TRUNCATION_MARKER}${suffix}`;
}

// Replace a matched string with the truncation marker, but only if shorter
function truncateIfShorter(match: string): string {
    return TRUNCATION_MARKER.length < match.length ? TRUNCATION_MARKER : match;
}