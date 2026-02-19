// GitHub action
// Copyright © 2026 Alexander Thoukydides

// Marker for any removed content
const TRUNCATION_MARKER = '\n\n[…truncated…]\n\n';

// Patterns that match blocks that resemble logs
const LOG_PATTERNS = [
    // Matterbridge format logs
    /^(?:\w* ?\[\d\d:\d\d:\d\d\.\d\d\d\] ?\[.*\n)+/gm,
    // Homebridge format logs
    /(?:^(?:\[[^\]]+\] )?\[\d\d?[-/.]\d\d?[-/.]\d\d\d\d, \d\d?:\d\d:\d\d(?: \w+)?\] .*\n)+/gm,
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

// Patterns that match URLs
const URL_PATTERNS = [
    // Markdown link
    /(?<=\]\()\w[\w+-]*:\S*?(?<!\\)(?=\))/g,
    // Bare URL
    /https?:\/\/[^\s"<>|()[\]{}]+/g
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

// Remove any long URLs
export function truncateURLs(text: string): string {
    for (const re of URL_PATTERNS) {
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


export function truncateText2(text: string, maxChars: number): string {
    if (text.length <= maxChars)                return text;
    if (maxChars < TRUNCATION_MARKER.length)    return '';

    // Get the lengths of segments in the text according to a segmenter or regex
    const getSegmentOffsets = (str: string, segmenter: Intl.Segmenter): number[] => {
        const lengths: number[] = [];
        let lastIndex = 0;
        for (const { index } of segmenter.segment(str)) {
            if (index === 0) continue;
            lengths.push(index - lastIndex);
            lastIndex = index;
        }
        if (lastIndex < str.length) lengths.push(str.length - lastIndex);
        return lengths;
    };
    const getRegexOffsets = (str: string, regex: RegExp): number[] => {
        const lengths: number[] = [];
        let lastIndex = 0;
        let match;
        while ((match = regex.exec(str)) !== null) {
            lengths.push(match.index - lastIndex); // The text before the match
            lengths.push(match[0].length);         // The match itself (the delimiter)
            lastIndex = regex.lastIndex;
        }
        if (lastIndex < str.length) lengths.push(str.length - lastIndex);
        return lengths;
    };

    // Search for a partition under the target length
    const findBestBreak = (maxChars: number, isSuffix: boolean): number => {
        const minChars = Math.floor(maxChars * 0.8);
        const partitionChars = Math.min(maxChars + Math.round(Math.max(maxChars * 0.2, 100)), text.length);
        const source = isSuffix ? text.slice(-partitionChars) : text.slice(0, partitionChars);

        // Partition the text with different granularity
        const partitionOffsets: number[][] = [
            getRegexOffsets(source, /\n\n+/g),  // (paragraphs)
            getRegexOffsets(source, /\n+/g),    // (lines)
            getSegmentOffsets(source, sentenceSegmenter),
            getSegmentOffsets(source, wordSegmenter)
        ];
        let length = 0;
        for (const offsets of partitionOffsets) {
            if (isSuffix) offsets.reverse();

            // Find longest length of this partition under the limit
            length = 0;
            for (const len of offsets) {
                if (maxChars < length + len) break;
                length += len;
            }
            if (minChars <= length) break;
        }
        return length;
    };

    // Cut out the middle of the text to end up under the target
    const maxPrefixChars = Math.floor((maxChars - TRUNCATION_MARKER.length) / 2);
    const prefixIndex = findBestBreak(maxPrefixChars, false);
    const prefix = text.substring(0, prefixIndex).trimEnd();
    const maxSuffixChars = maxChars - prefix.length - TRUNCATION_MARKER.length;
    const suffixIndex = findBestBreak(maxSuffixChars, true);
    const suffix = text.substring(suffixIndex).trimStart();
    return `${prefix}${TRUNCATION_MARKER}${suffix}`;
}

// Replace a matched string with the truncation marker, but only if shorter
function truncateIfShorter(match: string): string {
    const truncationMarker = match.includes('\n') ? TRUNCATION_MARKER : TRUNCATION_MARKER.trim();
    return truncationMarker.length < match.length ? truncationMarker : match;
}