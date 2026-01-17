// GitHub action
// Copyright © 2026 Alexander Thoukydides

import * as core from '@actions/core';
import { Issue } from './get_issue';
import { getResultChars } from './result_context';
import { truncateCodeBlocks, truncateLogsFull, truncateLogsPartial, truncateText } from './truncate_text';
import { plural } from './utils';

// Proportion of context to allocate to the issue body when truncation required
const ISSUE_BODY_FRACTION = 0.25; // 25% body + 75% comments

// Number of priority comments
const MIN_PRIORITY_COMMENTS = 3;
const MAX_PRIORITY_COMMENTS = 10;

// A truncation method
export type Truncation = (text: string, index: number) => string;

// Truncate the issue to fit within the available input context
export function truncateIssue(issue: Issue, maxChars: number): [Issue, number] {
    // Log progress with fitting the issue into the available context
    function logProgress(description: string): void {
        const chars = getResultChars(issue);
        const deltaPercent = 100 * (chars - maxChars) / maxChars;
        const underOver = 0 < deltaPercent ? 'over' : 'under';
        core.info(`Progress [${description}]: ${plural(chars, 'character')} ${underOver} budget [${deltaPercent.toFixed(1)}%]`
                  + ` (${plural(issue.body.length, 'body character')} + ${plural(issue.comments.length, 'comment')})`);
    }
    logProgress('Initial');

    // Check whether the size target has been achieved
    const minBodyChars = Math.round(maxChars * ISSUE_BODY_FRACTION);
    const issueSizeMet = (issue: Issue) => getResultChars(issue) <= maxChars;
    const bodySizeMet  = (issue: Issue) => issueSizeMet(issue) || issue.body.length < minBodyChars;

    // Attempt to fit issue body and comments by removing logs and code blocks
    const truncateAll = (issue: Issue, opName: string, op: Truncation, keepOnFail?: boolean): Issue => {
        issue = applyTruncations(issue, 'comment', issueSizeMet, mapIssueComments, opName, op, keepOnFail);
        issue = applyTruncations(issue, 'body',    bodySizeMet,  mapIssueBody,     opName, op, keepOnFail);
        return issue;
    };
    issue = truncateAll(issue, 'partial logs', truncateLogsPartial, false);
    issue = truncateAll(issue, 'full logs',    truncateLogsFull);
    issue = truncateAll(issue, 'code blocks',  truncateCodeBlocks);
    logProgress('Stripped logs');

    // Truncate the issue body text if still too large
    const commentChars = getResultChars(mapIssueBody(issue, () => ''));
    const maxBodyChars = Math.max(maxChars - commentChars, minBodyChars);
    issue = applyTruncations(issue, 'body', bodySizeMet, mapIssueBody, 'text', body => truncateText(body, maxBodyChars));
    logProgress('Truncated body');

    // Select the comments to squeeze into the context
    const totalComments = issue.comments.length;
    const minComments = getMinComments(issue);
    while (minComments < issue.comments.length && !issueSizeMet(issue)) issue.comments.shift();
    const omittedComments = totalComments - issue.comments.length;
    core.info(`Selected ${issue.comments.length} of ${plural(totalComments, 'comment')}`);
    if (omittedComments) core.warning(`Discarded ${plural(omittedComments, 'oldest comment')} to fit context`);
    logProgress('Selected comments');

    // Truncate comment bodies as necessary to fit within the context
    let availableCommentChars = maxChars - getResultChars(mapIssueComments(issue, () => ''));
    issue = mapIssueComments(issue, (body, index) => {
        // Available context for this comment, if equal limit applied
        const tail = issue.comments.length - index;
        const equalMaxChars = Math.floor(availableCommentChars / tail);
        const tailChars = issue.comments.slice(index + 1).reduce((acc, c) => acc + Math.min(c.body.length, equalMaxChars), 0);
        const maxCommentChars = availableCommentChars - tailChars;

        // Truncate this comment to the selected size
        body = truncateText(body, maxCommentChars);
        availableCommentChars -= body.length;
        return body;
    });
    logProgress('Truncated comments');

    // Return the truncated issue
    return [issue, omittedComments];
}

// Determine the number of tail comments that must be included
function getMinComments(issue: Issue): number {
    const { comments } = issue;

    // Identify last block of comments by a project maintainer
    const lastMaintainerIndex   = comments.findLastIndex(c => c.role === 'Maintainer');
    const firstMaintainerIndex  = comments.slice(0, lastMaintainerIndex).findLastIndex(c => c.role !== 'Maintainer') + 1;
    const maintainerCommentTail = lastMaintainerIndex !== -1 ? comments.length - firstMaintainerIndex : 0;

    // Choose the number of comments to squeeze into the context (include one non-maintainer comment)
    return Math.min(Math.max(maintainerCommentTail + 1, MIN_PRIORITY_COMMENTS), comments.length, MAX_PRIORITY_COMMENTS);
}

// Map a function over issue or comment bodies
function mapIssueBody(issue: Issue, op: Truncation): Issue {
    return { ...issue, body: op(issue.body, 0) };
}
function mapIssueComments(issue: Issue, op: Truncation): Issue {
    return { ...issue, comments: issue.comments.map((c, i) => ({ ...c, body: op(c.body, i) })) };
}

// Apply successive truncations until the result is small enough
function applyTruncations(
    issue:      Issue,
    type:       string,
    isDone:     (issue: Issue) => boolean,
    mapper:     (issue: Issue, op: Truncation) => Issue,
    opName:     string,
    op:         Truncation,
    keepOnFail  = true
): Issue {
    const state = { done: false, applied: 0, truncated: 0 };
    const isDoneLatching = () => state.done ||= isDone(issue);

    // Iterate over the items to truncate
    const resultIssue = mapper(issue, (text: string, index: number) => {
        if (isDoneLatching()) return text;
        const opText = op(text, index);
        ++state.applied;
        if (opText !== text) ++state.truncated;
        return opText;
    });

    // Decide whether to keep the result
    const keepResult = keepOnFail || isDoneLatching();

    // Log a summary of the actions performed, if any
    if (state.applied) {
        const action = keepResult ? 'Truncated' : 'Discarded';
        core.info(`${action} ${opName} ${state.truncated} of ${plural(state.applied, type)}`);
    }
    return keepResult ? resultIssue : issue;
}