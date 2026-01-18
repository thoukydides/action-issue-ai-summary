// GitHub action
// Copyright © 2026 Alexander Thoukydides

import { Issue } from './get_issue.js';
import * as core from '@actions/core';
import { plural } from './utils.js';

// Match line endings (allowing CRLF, CR, or LF)
const LINE_ENDING = /\r\n|(?<!\r)\n|\r(?!\n)/g;

// Match ANSI colour codes (including textual representation of escape code)
// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE = /(?:\x1B|ESC)\[[0-9;]*[msuK]/g;

// Remove comments by bots and any ANSI colour codes
export function cleanIssue(issue: Issue): Issue {
    const { body: rawBody, comments: rawComments, ...restIssue } = issue;

    // Exclude comments by bots
    const humanComments = rawComments.filter(comment => comment.role !== 'Bot');
    const botCount = rawComments.length - humanComments.length;
    if (0 < botCount) core.info(`Excluded ${plural(botCount, 'comment')} by bots`);

    // Normalise line endings and remove ANSI codes from the body and comments
    const body = cleanBody(rawBody);
    const comments = humanComments.map(({ body, ...rest }) => ({ body: cleanBody(body), ...rest }));

    // Return the cleaned result
    return { body, comments, ...restIssue };
}

// Clean an issue or comment body
function cleanBody(text: string): string {
    return text
        .replaceAll(LINE_ENDING, '\n')
        .replaceAll(ANSI_ESCAPE, '');
}