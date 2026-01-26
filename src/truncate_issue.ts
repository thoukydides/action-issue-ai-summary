// GitHub action
// Copyright © 2026 Alexander Thoukydides

import * as core from '@actions/core';
import { Issue } from './get_issue.js';
import { IssueContext, makeResult, Result } from './result_context.js';
import { truncateCodeBlocks, truncateLogsFull, truncateLogsPartial, truncateText, truncateURLs } from './truncate_text.js';
import { plural } from './utils.js';
import { fitTokens, getTokensResult, TokenFitResult } from './tokens.js';

// Proportion of context to allocate to the issue body when truncation required
const ISSUE_BODY_FRACTION = 0.25; // 25% body + 75% comments

// Number of priority comments
const MIN_PRIORITY_COMMENTS = 3;
const MAX_PRIORITY_COMMENTS = 10;

// A truncation method
export type Truncation = (text: string) => string;

// The result of attempting to fit the issue
export type IssueResult = TokenFitResult<Result, IssueContext>;

// Truncate the issue to fit within the available input context
export function truncateIssue(issue: Issue, maxTokens: number): Result {
    let result = getIssueResult({ issue, omitted_comments: 0 }, maxTokens);

    // Log progress with fitting the issue into the available context
    function logProgress(description: string): void {
        const { tokens } = result;
        const deltaPercent = 100 * (tokens - maxTokens) / maxTokens;
        const underOver = 0 < deltaPercent ? 'over' : 'under';
        core.info(`Progress [${description}]: ${plural(tokens, 'token')} ${Math.abs(deltaPercent).toFixed(1)}% ${underOver} budget`
                  + ` (${plural(issue.body.length, 'body character')} + ${plural(issue.comments.length, 'comment')})`);
    }
    logProgress('Initial');

    // Body can use any space left by comments, with a guaranteed minimum
    const maxBodyTokens = () => {
        const { issue, omitted_comments } = result.context;
        const commentContext = { issue: { ...issue, body: '' }, omitted_comments };
        const commentTokens = getIssueResult(commentContext, maxTokens).tokens;
        const minBodyTokens = Math.round(maxTokens * ISSUE_BODY_FRACTION);
        return Math.max(maxTokens - commentTokens, minBodyTokens);
    };

    // Attempt to fit issue body and comments by removing logs and code blocks
    const truncateAll = (result: IssueResult, opName: string, op: Truncation, keepOnFail?: boolean): IssueResult => {
        const originalResult = result;
        result = fitByCommentsOp(result, opName, op, maxTokens);
        result = fitByBodyOp    (result, opName, op, maxTokens, maxBodyTokens());
        return result.done || keepOnFail ? result : originalResult;
    };
    result = truncateAll(result, 'partial logs',  truncateLogsPartial, false);
    result = truncateAll(result, 'full logs',     truncateLogsFull);
    result = truncateAll(result, 'code blocks',   truncateCodeBlocks);
    result = truncateAll(result, 'links',         truncateURLs);
    logProgress('Stripped logs');

    // Truncate the issue body text if still too large
    result = fitByMaxBodyLength(result, maxTokens, maxBodyTokens());
    logProgress('Truncated body');

    // Select the comments to squeeze into the context
    result = fitByOmittingComments(result, maxTokens);
    logProgress('Selected comments');

    // Finally, force the truncate comment bodies as necessary to force a fit
    result = fitByMaxCommentLength(result, maxTokens);
    logProgress('Truncated comments');

    // Return the truncated issue
    return result.value;
}

// Tokenisation result for an issue
function getIssueResult(context: IssueContext, maxTokens: number): IssueResult {
    const value = makeResult(context);
    return getTokensResult(() => ({ value, context }), maxTokens);
}

// Attempt to fit the body by applying a supplied truncation
function fitByBodyOp(result: IssueResult, opName: string, op: Truncation, maxTokens: number, maxBodyTokens: number): IssueResult {
    const { issue, omitted_comments } = result.context;
    if (result.done) return result;

    // Fit the issue body in isolation (0 = truncate, 1 = original)
    const maker = (param: number) => {
        const body = param ? issue.body : op(issue.body);
        const context = { issue: { ...issue, body }, omitted_comments };
        return { value: body, context };
    };
    const bodyResult = fitTokens(maker, maxBodyTokens, 0, 1);
    if (bodyResult.param === 0) core.info(`Truncated ${opName} body`);

    // Construct the issue level result (the only use of maxTokens)
    return getIssueResult(bodyResult.context, maxTokens);
}

// Attempt to fit the issue by applying a supplied truncation to some comments
function fitByCommentsOp(result: IssueResult, opName: string, op: Truncation, maxTokens: number): IssueResult {
    const { issue, omitted_comments } = result.context;

    // Truncated versions of all comments
    const truncatedComments = issue.comments.map(c => ({ ...c, body: op(c.body) }));

    // The parameter is the negated number of comments to truncate
    // (so that smaller parameter values reduce the token count)
    const maker = (param: number) => {
        const comments = truncatedComments.slice(0, -param).concat(issue.comments.slice(-param));
        const context = { issue: { ...issue, comments }, omitted_comments };
        return { value: makeResult(context), context };
    };

    // Select the parameter value that best fits the token budget
    result = fitTokens(maker, maxTokens, -issue.comments.length, 0);
    const count = result.context.issue.comments.reduce((acc, c, index) =>
        c.body === issue.comments[index]?.body ? acc : acc + 1, 0);
    if (count) core.info(`Truncated ${opName} ${count} of ${plural(-result.param, 'comment')}`);
    return result;
}

// Attempt to fit the issue by omitting some comments
function fitByOmittingComments(result: IssueResult, maxTokens: number): IssueResult {
    const { issue, omitted_comments } = result.context;
    const maxComments = issue.comments.length;

    // Identify last block of comments by a project maintainer
    const lastMaintainerIndex   = issue.comments.findLastIndex(c => c.role === 'Maintainer');
    const firstMaintainerIndex  = issue.comments.slice(0, lastMaintainerIndex).findLastIndex(c => c.role !== 'Maintainer') + 1;
    const maintainerCommentTail = lastMaintainerIndex !== -1 ? maxComments - firstMaintainerIndex : 0;

    // Choose the number of comments to squeeze into the context (include one non-maintainer comment)
    const priorityComments      = Math.max(maintainerCommentTail + 1, MIN_PRIORITY_COMMENTS);
    const minComments           = Math.min(priorityComments, maxComments, MAX_PRIORITY_COMMENTS);

    // The parameter is the number of comments to keep
    const maker = (param: number) => {
        const comments = issue.comments.slice(-param);
        const context = { issue: { ...issue, comments }, omitted_comments: omitted_comments + maxComments - param };
        return { value: makeResult(context), context };
    };

    // Select the parameter value that best fits the token budget
    result = fitTokens(maker, maxTokens, minComments, maxComments);
    if (result.param < maxComments) {
        core.info(`Selected ${result.param} of ${plural(maxComments, 'comment')}`);
        core.warning(`Discarded ${plural(result.context.omitted_comments, 'oldest comment')} to fit context`);
    }
    return result;
}

// Attempt to fit the body by applying a variable truncation
function fitByMaxBodyLength(result: IssueResult, maxTokens: number, maxBodyTokens: number): IssueResult {
    const { issue, omitted_comments } = result.context;
    if (result.done) return result;

    // Fit the issue body in isolation (parameter is length in characters)
    const maker = (param: number) => {
        const body = truncateText(issue.body, param);
        const context = { issue: { ...issue, body }, omitted_comments };
        return { value: body, context };
    };
    const bodyResult = fitTokens(maker, maxBodyTokens, 0, issue.body.length);
    if (bodyResult.param < issue.body.length) {
        core.info(`Truncated body from ${issue.body.length} to ${plural(bodyResult.param, 'character')}`);
    }

    // Construct the issue level result (the only use of maxTokens)
    return getIssueResult(bodyResult.context, maxTokens);
}

// Attempt to fit the issue by applying a variable truncation to all comments
function fitByMaxCommentLength(result: IssueResult, maxTokens: number): IssueResult {
    const { issue, omitted_comments } = result.context;
    const maxCommentChars = Math.max(...issue.comments.map(c => c.body.length), 0);

    // The parameter is the maximum number of characters to allow per comment
    const maker = (param: number) => {
        const comments = issue.comments.map(c => ({ ...c, body: truncateText(c.body, param) }));
        const context = { issue: { ...issue, comments }, omitted_comments };
        return { value: makeResult(context), context };
    };

    // Select the parameter value that best fits the token budget
    result = fitTokens(maker, maxTokens, 0, maxCommentChars);
    const count = result.context.issue.comments.reduce((acc, c, index) =>
        c.body === issue.comments[index]?.body ? acc : acc + 1, 0);
    if (count) core.info(`Truncated ${plural(count, 'comment')} from ${maxCommentChars} to ${plural(result.param, 'character')} each`);
    return result;
}