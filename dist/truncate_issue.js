"use strict";
// GitHub action
// Copyright © 2026 Alexander Thoukydides
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.truncateIssue = truncateIssue;
const core = __importStar(require("@actions/core"));
const result_context_1 = require("./result_context");
const truncate_text_1 = require("./truncate_text");
const utils_1 = require("./utils");
// Proportion of context to allocate to the issue body when truncation required
const ISSUE_BODY_FRACTION = 0.25; // 25% body + 75% comments
// Number of priority comments
const MIN_PRIORITY_COMMENTS = 3;
const MAX_PRIORITY_COMMENTS = 10;
// Truncate the issue to fit within the available input context
function truncateIssue(issue, maxChars) {
    // Log progress with fitting the issue into the available context
    function logProgress(description) {
        const chars = (0, result_context_1.getResultChars)(issue);
        const deltaPercent = 100 * (chars - maxChars) / maxChars;
        const underOver = 0 < deltaPercent ? 'over' : 'under';
        core.info(`Progress [${description}]: ${(0, utils_1.plural)(chars, 'character')} ${underOver} budget [${deltaPercent.toFixed(1)}%]`
            + ` (${(0, utils_1.plural)(issue.body.length, 'body character')} + ${(0, utils_1.plural)(issue.comments.length, 'comment')})`);
    }
    logProgress('Initial');
    // Check whether the size target has been achieved
    const minBodyChars = Math.round(maxChars * ISSUE_BODY_FRACTION);
    const issueSizeMet = (issue) => (0, result_context_1.getResultChars)(issue) <= maxChars;
    const bodySizeMet = (issue) => issueSizeMet(issue) || issue.body.length < minBodyChars;
    // Attempt to fit issue body and comments by removing logs and code blocks
    const truncateAll = (issue, opName, op, keepOnFail) => {
        issue = applyTruncations(issue, 'comment', issueSizeMet, mapIssueComments, opName, op, keepOnFail);
        issue = applyTruncations(issue, 'body', bodySizeMet, mapIssueBody, opName, op, keepOnFail);
        return issue;
    };
    issue = truncateAll(issue, 'partial logs', truncate_text_1.truncateLogsPartial, false);
    issue = truncateAll(issue, 'full logs', truncate_text_1.truncateLogsFull);
    issue = truncateAll(issue, 'code blocks', truncate_text_1.truncateCodeBlocks);
    logProgress('Stripped logs');
    // Truncate the issue body text if still too large
    const commentChars = (0, result_context_1.getResultChars)(mapIssueBody(issue, () => ''));
    const maxBodyChars = Math.max(maxChars - commentChars, minBodyChars);
    issue = applyTruncations(issue, 'body', bodySizeMet, mapIssueBody, 'text', body => (0, truncate_text_1.truncateText)(body, maxBodyChars));
    logProgress('Truncated body');
    // Select the comments to squeeze into the context
    const totalComments = issue.comments.length;
    const minComments = getMinComments(issue);
    while (minComments < issue.comments.length && !issueSizeMet(issue))
        issue.comments.shift();
    const omittedComments = totalComments - issue.comments.length;
    core.info(`Selected ${issue.comments.length} of ${(0, utils_1.plural)(totalComments, 'comment')}`);
    if (omittedComments)
        core.warning(`Discarded ${(0, utils_1.plural)(omittedComments, 'oldest comment')} to fit context`);
    logProgress('Selected comments');
    // Truncate comment bodies as necessary to fit within the context
    let availableCommentChars = maxChars - (0, result_context_1.getResultChars)(mapIssueComments(issue, () => ''));
    issue = mapIssueComments(issue, (body, index) => {
        // Available context for this comment, if equal limit applied
        const tail = issue.comments.length - index;
        const equalMaxChars = Math.floor(availableCommentChars / tail);
        const tailChars = issue.comments.slice(index + 1).reduce((acc, c) => acc + Math.min(c.body.length, equalMaxChars), 0);
        const maxCommentChars = availableCommentChars - tailChars;
        // Truncate this comment to the selected size
        body = (0, truncate_text_1.truncateText)(body, maxCommentChars);
        availableCommentChars -= body.length;
        return body;
    });
    logProgress('Truncated comments');
    // Return the truncated issue
    return [issue, omittedComments];
}
// Determine the number of tail comments that must be included
function getMinComments(issue) {
    const { comments } = issue;
    // Identify last block of comments by a project maintainer
    const lastMaintainerIndex = comments.findLastIndex(c => c.role === 'Maintainer');
    const firstMaintainerIndex = comments.slice(0, lastMaintainerIndex).findLastIndex(c => c.role !== 'Maintainer') + 1;
    const maintainerCommentTail = lastMaintainerIndex !== -1 ? comments.length - firstMaintainerIndex : 0;
    // Choose the number of comments to squeeze into the context (include one non-maintainer comment)
    return Math.min(Math.max(maintainerCommentTail + 1, MIN_PRIORITY_COMMENTS), comments.length, MAX_PRIORITY_COMMENTS);
}
// Map a function over issue or comment bodies
function mapIssueBody(issue, op) {
    return { ...issue, body: op(issue.body, 0) };
}
function mapIssueComments(issue, op) {
    return { ...issue, comments: issue.comments.map((c, i) => ({ ...c, body: op(c.body, i) })) };
}
// Apply successive truncations until the result is small enough
function applyTruncations(issue, type, isDone, mapper, opName, op, keepOnFail = true) {
    const state = { done: false, applied: 0, truncated: 0 };
    const isDoneLatching = () => state.done ||= isDone(issue);
    // Iterate over the items to truncate
    const resultIssue = mapper(issue, (text, index) => {
        if (isDoneLatching())
            return text;
        const opText = op(text, index);
        ++state.applied;
        if (opText !== text)
            ++state.truncated;
        return opText;
    });
    // Decide whether to keep the result
    const keepResult = keepOnFail || isDoneLatching();
    // Log a summary of the actions performed, if any
    if (state.applied) {
        const action = keepResult ? 'Truncated' : 'Discarded';
        core.info(`${action} ${opName} ${state.truncated} of ${(0, utils_1.plural)(state.applied, type)}`);
    }
    return keepResult ? resultIssue : issue;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJ1bmNhdGVfaXNzdWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdHJ1bmNhdGVfaXNzdWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGdCQUFnQjtBQUNoQix5Q0FBeUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJ6QyxzQ0E0REM7QUE3RUQsb0RBQXNDO0FBRXRDLHFEQUFrRDtBQUNsRCxtREFBMEc7QUFDMUcsbUNBQWlDO0FBRWpDLCtFQUErRTtBQUMvRSxNQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQyxDQUFDLDBCQUEwQjtBQUU1RCw4QkFBOEI7QUFDOUIsTUFBTSxxQkFBcUIsR0FBRyxDQUFDLENBQUM7QUFDaEMsTUFBTSxxQkFBcUIsR0FBRyxFQUFFLENBQUM7QUFLakMsK0RBQStEO0FBQy9ELFNBQWdCLGFBQWEsQ0FBQyxLQUFZLEVBQUUsUUFBZ0I7SUFDeEQsaUVBQWlFO0lBQ2pFLFNBQVMsV0FBVyxDQUFDLFdBQW1CO1FBQ3BDLE1BQU0sS0FBSyxHQUFHLElBQUEsK0JBQWMsRUFBQyxLQUFLLENBQUMsQ0FBQztRQUNwQyxNQUFNLFlBQVksR0FBRyxHQUFHLEdBQUcsQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLEdBQUcsUUFBUSxDQUFDO1FBQ3pELE1BQU0sU0FBUyxHQUFHLENBQUMsR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ3RELElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxXQUFXLE1BQU0sSUFBQSxjQUFNLEVBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxJQUFJLFNBQVMsWUFBWSxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJO2NBQzFHLEtBQUssSUFBQSxjQUFNLEVBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCLENBQUMsTUFBTSxJQUFBLGNBQU0sRUFBQyxLQUFLLENBQUMs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QUFBLGNBQU0sRUFBQyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUMxRixDQUFDO0lBQ0QsT0FBTyxVQUFVLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQzVDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBHaXRIdWIgYWN0aW9uXG4vLyBDb3B5cmlnaHQgwqkgMjAyNiBBbGV4YW5kZXIgVGhvdWt5ZGlkZXNcblxuaW1wb3J0ICogYXMgY29yZSBmcm9tICdAYWN0aW9ucy9jb3JlJztcbmltcG9ydCB7IElzc3VlIH0gZnJvbSAnLi9nZXRfaXNzdWUnO1xuaW1wb3J0IHsgZ2V0UmVzdWx0Q2hhcnMgfSBmcm9tICcuL3Jlc3VsdF9jb250ZXh0JztcbmltcG9ydCB7IHRydW5jYXRlQ29kZUJsb2NrcywgdHJ1bmNhdGVMb2dzRnVsbCwgdHJ1bmNhdGVMb2dzUGFydGlhbCwgdHJ1bmNhdGVUZXh0IH0gZnJvbSAnLi90cnVuY2F0ZV90ZXh0JztcbmltcG9ydCB7IHBsdXJhbCB9IGZyb20gJy4vdXRpbHMnO1xuXG4vLyBQcm9wb3J0aW9uIG9mIGNvbnRleHQgdG8gYWxsb2NhdGUgdG8gdGhlIGlzc3VlIGJvZHkgd2hlbiB0cnVuY2F0aW9uIHJlcXVpcmVkXG5jb25zdCBJU1NVRV9CT0RZX0ZSQUNUSU9OID0gMC4yNTsgLy8gMjUlIGJvZHkgKyA3NSUgY29tbWVudHNcblxuLy8gTnVtYmVyIG9mIHByaW9yaXR5IGNvbW1lbnRzXG5jb25zdCBNSU5fUFJJT1JJVFlfQ09NTUVOVFMgPSAzO1xuY29uc3QgTUFYX1BSSU9SSVRZX0NPTU1FTlRTID0gMTA7XG5cbi8vIEEgdHJ1bmNhdGlvbiBtZXRob2RcbmV4cG9ydCB0eXBlIFRydW5jYXRpb24gPSAodGV4dDogc3RyaW5nLCBpbmRleDogbnVtYmVyKSA9PiBzdHJpbmc7XG5cbi8vIFRydW5jYXRlIHRoZSBpc3N1ZSB0byBmaXQgd2l0aGluIHRoZSBhdmFpbGFibGUgaW5wdXQgY29udGV4dFxuZXhwb3J0IGZ1bmN0aW9uIHRydW5jYXRlSXNzdWUoaXNzdWU6IElzc3VlLCBtYXhDaGFyczogbnVtYmVyKTogW0lzc3VlLCBudW1iZXJdIHtcbiAgICAvLyBMb2cgcHJvZ3Jlc3Mgd2l0aCBmaXR0aW5nIHRoZSBpc3N1ZSBpbnRvIHRoZSBhdmFpbGFibGUgY29udGV4dFxuICAgIGZ1bmN0aW9uIGxvZ1Byb2dyZXNzKGRlc2NyaXB0aW9uOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgY2hhcnMgPSBnZXRSZXN1bHRDaGFycyhpc3N1ZSk7XG4gICAgICAgIGNvbnN0IGRlbHRhUGVyY2VudCA9IDEwMCAqIChjaGFycyAtIG1heENoYXJzKSAvIG1heENoYXJzO1xuICAgICAgICBjb25zdCB1bmRlck92ZXIgPSAwIDwgZGVsdGFQZXJjZW50ID8gJ292ZXInIDogJ3VuZGVyJztcbiAgICAgICAgY29yZS5pbmZvKGBQcm9ncmVzcyBbJHtkZXNjcmlwdGlvbn1dOiAke3BsdXJhbChjaGFycywgJ2NoYXJhY3RlcicpfSAke3VuZGVyT3Zlcn0gYnVkZ2V0IFske2RlbHRhUGVyY2VudC50b0ZpeGVkKDEpfSVdYFxuICAgICAgICAgICAgICAgICAgKyBgICgke3BsdXJhbChpc3N1ZS5ib2R5Lmxlbmd0aCwgJ2JvZHkgY2hhcmFjdGVyJyl9ICsgJHtwbHVyYWwoaXNzdWUuY29tbWVudHMubGVuZ3RoLCAnY29tbWVudCcpfSlgKTtcbiAgICB9XG4gICAgbG9nUHJvZ3Jlc3MoJ0luaXRpYWwnKTtcblxuICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlIHNpemUgdGFyZ2V0IGhhcyBiZWVuIGFjaGlldmVkXG4gICAgY29uc3QgbWluQm9keUNoYXJzID0gTWF0aC5yb3VuZChtYXhDaGFycyAqIElTU1VFX0JPRFlfRlJBQ1RJT04pO1xuICAgIGNvbnN0IGlzc3VlU2l6ZU1ldCA9IChpc3N1ZTogSXNzdWUpID0+IGdldFJlc3VsdENoYXJzKGlzc3VlKSA8PSBtYXhDaGFycztcbiAgICBjb25zdCBib2R5U2l6ZU1ldCAgPSAoaXNzdWU6IElzc3VlKSA9PiBpc3N1ZVNpemVNZXQoaXNzdWUpIHx8IGlzc3VlLmJvZHkubGVuZ3RoIDwgbWluQm9keUNoYXJzO1xuXG4gICAgLy8gQXR0ZW1wdCB0byBmaXQgaXNzdWUgYm9keSBhbmQgY29tbWVudHMgYnkgcmVtb3ZpbmcgbG9ncyBhbmQgY29kZSBibG9ja3NcbiAgICBjb25zdCB0cnVuY2F0ZUFsbCA9IChpc3N1ZTogSXNzdWUsIG9wTmFtZTogc3RyaW5nLCBvcDogVHJ1bmNhdGlvbiwga2VlcE9uRmFpbD86IGJvb2xlYW4pOiBJc3N1ZSA9PiB7XG4gICAgICAgIGlzc3VlID0gYXBwbHlUcnVuY2F0aW9ucyhpc3N1ZSwgJ2NvbW1lbnQnLCBpc3N1ZVNpemVNZXQsIG1hcElzc3VlQ29tbWVudHMsIG9wTmFtZSwgb3AsIGtlZXBPbkZhaWwpO1xuICAgICAgICBpc3N1ZSA9IGFwcGx5VHJ1bmNhdGlvbnMoaXNzdWUsICdib2R5JywgICAgYm9keVNpemVNZXQsICBtYXBJc3N1ZUJvZHksICAgICBvcE5hbWUsIG9wLCBrZWVwT25GYWlsKTtcbiAgICAgICAgcmV0dXJuIGlzc3VlO1xuICAgIH07XG4gICAgaXNzdWUgPSB0cnVuY2F0ZUFsbChpc3N1ZSwgJ3BhcnRpYWwgbG9ncycsIHRydW5jYXRlTG9nc1BhcnRpYWwsIGZhbHNlKTtcbiAgICBpc3N1ZSA9IHRydW5jYXRlQWxsKGlzc3VlLCAnZnVsbCBsb2dzJywgICAgdHJ1bmNhdGVMb2dzRnVsbCk7XG4gICAgaXNzdWUgPSB0cnVuY2F0ZUFsbChpc3N1ZSwgJ2NvZGUgYmxvY2tzJywgIHRydW5jYXRlQ29kZUJsb2Nrcyk7XG4gICAgbG9nUHJvZ3Jlc3MoJ1N0cmlwcGVkIGxvZ3MnKTtcblxuICAgIC8vIFRydW5jYXRlIHRoZSBpc3N1ZSBib2R5IHRleHQgaWYgc3RpbGwgdG9vIGxhcmdlXG4gICAgY29uc3QgY29tbWVudENoYXJzID0gZ2V0UmVzdWx0Q2hhcnMobWFwSXNzdWVCb2R5KGlzc3VlLCAoKSA9PiAnJykpO1xuICAgIGNvbnN0IG1heEJvZHlDaGFycyA9IE1hdGgubWF4KG1heENoYXJzIC0gY29tbWVudENoYXJzLCBtaW5Cb2R5Q2hhcnMpO1xuICAgIGlzc3VlID0gYXBwbHlUcnVuY2F0aW9ucyhpc3N1ZSwgJ2JvZHknLCBib2R5U2l6ZU1ldCwgbWFwSXNzdWVCb2R5LCAndGV4dCcsIGJvZHkgPT4gdHJ1bmNhdGVUZXh0KGJvZHksIG1heEJvZHlDaGFycykpO1xuICAgIGxvZ1Byb2dyZXNzKCdUcnVuY2F0ZWQgYm9keScpO1xuXG4gICAgLy8gU2VsZWN0IHRoZSBjb21tZW50cyB0byBzcXVlZXplIGludG8gdGhlIGNvbnRleHRcbiAgICBjb25zdCB0b3RhbENvbW1lbnRzID0gaXNzdWUuY29tbWVudHMubGVuZ3RoO1xuICAgIGNvbnN0IG1pbkNvbW1lbnRzID0gZ2V0TWluQ29tbWVudHMoaXNzdWUpO1xuICAgIHdoaWxlIChtaW5Db21tZW50cyA8IGlzc3VlLmNvbW1lbnRzLmxlbmd0aCAmJiAhaXNzdWVTaXplTWV0KGlzc3VlKSkgaXNzdWUuY29tbWVudHMuc2hpZnQoKTtcbiAgICBjb25zdCBvbWl0dGVkQ29tbWVudHMgPSB0b3RhbENvbW1lbnRzIC0gaXNzdWUuY29tbWVudHMubGVuZ3RoO1xuICAgIGNvcmUuaW5mbyhgU2VsZWN0ZWQgJHtpc3N1ZS5jb21tZW50cy5sZW5ndGh9IG9mICR7cGx1cmFsKHRvdGFsQ29tbWVudHMsICdjb21tZW50Jyl9YCk7XG4gICAgaWYgKG9taXR0ZWRDb21tZW50cykgY29yZS53YXJuaW5nKGBEaXNjYXJkZWQgJHtwbHVyYWwob21pdHRlZENvbW1lbnRzLCAnb2xkZXN0IGNvbW1lbnQnKX0gdG8gZml0IGNvbnRleHRgKTtcbiAgICBsb2dQcm9ncmVzcygnU2VsZWN0ZWQgY29tbWVudHMnKTtcblxuICAgIC8vIFRydW5jYXRlIGNvbW1lbnQgYm9kaWVzIGFzIG5lY2Vzc2FyeSB0byBmaXQgd2l0aGluIHRoZSBjb250ZXh0XG4gICAgbGV0IGF2YWlsYWJsZUNvbW1lbnRDaGFycyA9IG1heENoYXJzIC0gZ2V0UmVzdWx0Q2hhcnMobWFwSXNzdWVDb21tZW50cyhpc3N1ZSwgKCkgPT4gJycpKTtcbiAgICBpc3N1ZSA9IG1hcElzc3VlQ29tbWVudHMoaXNzdWUsIChib2R5LCBpbmRleCkgPT4ge1xuICAgICAgICAvLyBBdmFpbGFibGUgY29udGV4dCBmb3IgdGhpcyBjb21tZW50LCBpZiBlcXVhbCBsaW1pdCBhcHBsaWVkXG4gICAgICAgIGNvbnN0IHRhaWwgPSBpc3N1ZS5jb21tZW50cy5sZW5ndGggLSBpbmRleDtcbiAgICAgICAgY29uc3QgZXF1YWxNYXhDaGFycyA9IE1hdGguZmxvb3IoYXZhaWxhYmxlQ29tbWVudENoYXJzIC8gdGFpbCk7XG4gICAgICAgIGNvbnN0IHRhaWxDaGFycyA9IGlzc3VlLmNvbW1lbnRzLnNsaWNlKGluZGV4ICsgMSkucmVkdWNlKChhY2MsIGMpID0+IGFjYyArIE1hdGgubWluKGMuYm9keS5sZW5ndGgsIGVxdWFsTWF4Q2hhcnMpLCAwKTtcbiAgICAgICAgY29uc3QgbWF4Q29tbWVudENoYXJzID0gYXZhaWxhYmxlQ29tbWVudENoYXJzIC0gdGFpbENoYXJzO1xuXG4gICAgICAgIC8vIFRydW5jYXRlIHRoaXMgY29tbWVudCB0byB0aGUgc2VsZWN0ZWQgc2l6ZVxuICAgICAgICBib2R5ID0gdHJ1bmNhdGVUZXh0KGJvZHksIG1heENvbW1lbnRDaGFycyk7XG4gICAgICAgIGF2YWlsYWJsZUNvbW1lbnRDaGFycyAtPSBib2R5Lmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGJvZHk7XG4gICAgfSk7XG4gICAgbG9nUHJvZ3Jlc3MoJ1RydW5jYXRlZCBjb21tZW50cycpO1xuXG4gICAgLy8gUmV0dXJuIHRoZSB0cnVuY2F0ZWQgaXNzdWVcbiAgICByZXR1cm4gW2lzc3VlLCBvbWl0dGVkQ29tbWVudHNdO1xufVxuXG4vLyBEZXRlcm1pbmUgdGhlIG51bWJlciBvZiB0YWlsIGNvbW1lbnRzIHRoYXQgbXVzdCBiZSBpbmNsdWRlZFxuZnVuY3Rpb24gZ2V0TWluQ29tbWVudHMoaXNzdWU6IElzc3VlKTogbnVtYmVyIHtcbiAgICBjb25zdCB7IGNvbW1lbnRzIH0gPSBpc3N1ZTtcblxuICAgIC8vIElkZW50aWZ5IGxhc3QgYmxvY2sgb2YgY29tbWVudHMgYnkgYSBwcm9qZWN0IG1haW50YWluZXJcbiAgICBjb25zdCBsYXN0TWFpbnRhaW5lckluZGV4ICAgPSBjb21tZW50cy5maW5kTGFzdEluZGV4KGMgPT4gYy5yb2xlID09PSAnTWFpbnRhaW5lcicpO1xuICAgIGNvbnN0IGZpcnN0TWFpbnRhaW5lckluZGV4ICA9IGNvbW1lbnRzLnNsaWNlKDAsIGxhc3RNYWludGFpbmVySW5kZXgpLmZpbmRMYXN0SW5kZXgoYyA9PiBjLnJvbGUgIT09ICdNYWludGFpbmVyJykgKyAxO1xuICAgIGNvbnN0IG1haW50YWluZXJDb21tZW50VGFpbCA9IGxhc3RNYWludGFpbmVySW5kZXggIT09IC0xID8gY29tbWVudHMubGVuZ3RoIC0gZmlyc3RNYWludGFpbmVySW5kZXggOiAwO1xuXG4gICAgLy8gQ2hvb3NlIHRoZSBudW1iZXIgb2YgY29tbWVudHMgdG8gc3F1ZWV6ZSBpbnRvIHRoZSBjb250ZXh0IChpbmNsdWRlIG9uZSBub24tbWFpbnRhaW5lciBjb21tZW50KVxuICAgIHJldHVybiBNYXRoLm1pbihNYXRoLm1heChtYWludGFpbmVyQ29tbWVudFRhaWwgKyAxLCBNSU5fUFJJT1JJVFlfQ09NTUVOVFMpLCBjb21tZW50cy5sZW5ndGgsIE1BWF9QUklPUklUWV9DT01NRU5UUyk7XG59XG5cbi8vIE1hcCBhIGZ1bmN0aW9uIG92ZXIgaXNzdWUgb3IgY29tbWVudCBib2RpZXNcbmZ1bmN0aW9uIG1hcElzc3VlQm9keShpc3N1ZTogSXNzdWUsIG9wOiBUcnVuY2F0aW9uKTogSXNzdWUge1xuICAgIHJldHVybiB7IC4uLmlzc3VlLCBib2R5OiBvcChpc3N1ZS5ib2R5LCAwKSB9O1xufVxuZnVuY3Rpb24gbWFwSXNzdWVDb21tZW50cyhpc3N1ZTogSXNzdWUsIG9wOiBUcnVuY2F0aW9uKTogSXNzdWUge1xuICAgIHJldHVybiB7IC4uLmlzc3VlLCBjb21tZW50czogaXNzdWUuY29tbWVudHMubWFwKChjLCBpKSA9PiAoeyAuLi5jLCBib2R5OiBvcChjLmJvZHksIGkpIH0pKSB9O1xufVxuXG4vLyBBcHBseSBzdWNjZXNzaXZlIHRydW5jYXRpb25zIHVudGlsIHRoZSByZXN1bHQgaXMgc21hbGwgZW5vdWdoXG5mdW5jdGlvbiBhcHBseVRydW5jYXRpb25zKFxuICAgIGlzc3VlOiAgICAgIElzc3VlLFxuICAgIHR5cGU6ICAgICAgIHN0cmluZyxcbiAgICBpc0RvbmU6ICAgICAoaXNzdWU6IElzc3VlKSA9PiBib29sZWFuLFxuICAgIG1hcHBlcjogICAgIChpc3N1ZTogSXNzdWUsIG9wOiBUcnVuY2F0aW9uKSA9PiBJc3N1ZSxcbiAgICBvcE5hbWU6ICAgICBzdHJpbmcsXG4gICAgb3A6ICAgICAgICAgVHJ1bmNhdGlvbixcbiAgICBrZWVwT25GYWlsICA9IHRydWVcbik6IElzc3VlIHtcbiAgICBjb25zdCBzdGF0ZSA9IHsgZG9uZTogZmFsc2UsIGFwcGxpZWQ6IDAsIHRydW5jYXRlZDogMCB9O1xuICAgIGNvbnN0IGlzRG9uZUxhdGNoaW5nID0gKCkgPT4gc3RhdGUuZG9uZSB8fD0gaXNEb25lKGlzc3VlKTtcblxuICAgIC8vIEl0ZXJhdGUgb3ZlciB0aGUgaXRlbXMgdG8gdHJ1bmNhdGVcbiAgICBjb25zdCByZXN1bHRJc3N1ZSA9IG1hcHBlcihpc3N1ZSwgKHRleHQ6IHN0cmluZywgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICBpZiAoaXNEb25lTGF0Y2hpbmcoKSkgcmV0dXJuIHRleHQ7XG4gICAgICAgIGNvbnN0IG9wVGV4dCA9IG9wKHRleHQsIGluZGV4KTtcbiAgICAgICAgKytzdGF0ZS5hcHBsaWVkO1xuICAgICAgICBpZiAob3BUZXh0ICE9PSB0ZXh0KSArK3N0YXRlLnRydW5jYXRlZDtcbiAgICAgICAgcmV0dXJuIG9wVGV4dDtcbiAgICB9KTtcblxuICAgIC8vIERlY2lkZSB3aGV0aGVyIHRvIGtlZXAgdGhlIHJlc3VsdFxuICAgIGNvbnN0IGtlZXBSZXN1bHQgPSBrZWVwT25GYWlsIHx8IGlzRG9uZUxhdGNoaW5nKCk7XG5cbiAgICAvLyBMb2cgYSBzdW1tYXJ5IG9mIHRoZSBhY3Rpb25zIHBlcmZvcm1lZCwgaWYgYW55XG4gICAgaWYgKHN0YXRlLmFwcGxpZWQpIHtcbiAgICAgICAgY29uc3QgYWN0aW9uID0ga2VlcFJlc3VsdCA/ICdUcnVuY2F0ZWQnIDogJ0Rpc2NhcmRlZCc7XG4gICAgICAgIGNvcmUuaW5mbyhgJHthY3Rpb259ICR7b3BOYW1lfSAke3N0YXRlLnRydW5jYXRlZH0gb2YgJHtwbHVyYWwoc3RhdGUuYXBwbGllZCwgdHlwZSl9YCk7XG4gICAgfVxuICAgIHJldHVybiBrZWVwUmVzdWx0ID8gcmVzdWx0SXNzdWUgOiBpc3N1ZTtcbn0iXX0=