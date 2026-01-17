// GitHub action
// Copyright © 2026 Alexander Thoukydides

import { Issue, Role } from './get_issue';

// A simplified representation of an issue body or comment
export interface ResultComment {
    author:             string;
    role:               Role;
    body:               string;
}
export interface ResultCommentInterval {
    days_gap?:          number;
    days_stale?:        number;
    omitted_comments?:  number;
}
type ResultCommentOrInterval = ResultComment | ResultCommentInterval;

// A simplified representation of an issue with its comments
export interface Result extends ResultComment {
    title:              string;
    labels:             string[];
    comments:           ResultCommentOrInterval[];
}

// Convert an issue and its comments into a result context
export function makeResult(issue: Issue, omitted_comments?: number): Result {
    // Convert the issue body
    const { number, created_at, url, comments, ...restIssue } = issue;
    const result: Result = { ...restIssue, comments: [] };

    // Convert the comments, inserting time gap markers as required
    let prev_time = new Date(created_at).getTime();
    for (const comment of comments) {
        const { created_at, url, ...restComment } = comment;
        const this_time = new Date(created_at).getTime();
        const days_gap = daysBetween(prev_time, this_time);
        if (0 < days_gap) result.comments.push({ days_gap, omitted_comments });
        result.comments.push(restComment);
        prev_time = this_time;
        omitted_comments = undefined;
    }

    // Add a final stale time gap marker
    const days_stale = daysBetween(prev_time, Date.now());
    result.comments.push({ days_stale }); // (always include, even if 0)
    return result;
}

// The size of the result context
export function getResultChars(issue: Issue, omitted_comments?: number): number {
    const result = makeResult(issue, omitted_comments);
    return JSON.stringify(result).length;
}

// Elapsed days between two millisecond times
function daysBetween(ms1: number, ms2: number): number {
    const days = (ms2 - ms1) / (1000 * 60 * 60 * 24);
    return days < 1 ? 0 : Math.round(days);
}