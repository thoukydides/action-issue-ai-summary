// GitHub action
// Copyright © 2026 Alexander Thoukydides

import { Issue } from './get_issue';
import * as core from '@actions/core';
import { plural } from './utils';

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

    // Remove anything resembling ANSI codes from the body and comments
    const stripAnsiCodes = (text: string): string => text.replaceAll(ANSI_ESCAPE, '');
    const body = stripAnsiCodes(rawBody);
    const comments = humanComments.map(({ body, ...rest }) => ({ body: stripAnsiCodes(body), ...rest }));

    // Return the cleaned result
    return { body, comments, ...restIssue };
}