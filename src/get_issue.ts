// GitHub action
// Copyright © 2026 Alexander Thoukydides

import { context } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils.js';
import { components } from '@octokit/openapi-types';
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types.js';
import * as core from '@actions/core';
import { plural } from './utils.js';

// GitHub REST API types
type AuthorAssociation  = components['schemas']['author-association'];
type RestIssue          = RestEndpointMethodTypes['issues']['get']['response']['data'];
type RestComment        = RestEndpointMethodTypes['issues']['listComments']['response']['data'][0];

// A simplified representation of an author association
export type Role = 'Maintainer' | 'User' | 'Bot' | 'Unknown';

// A simplified representation of an issue body or comment
export interface Comment {
    url:        string;
    created_at: string;
    author:     string;
    role:       Role;
    body:       string;
}

// A simplified representation of an issue with its comments
export interface Issue extends Comment {
    number:     number;
    title:      string;
    labels:     string[];
    comments:   Comment[];
}

// Retrieve an issue with all of its comments, and simplify its representation
export async function getIssue(github: InstanceType<typeof GitHub>, issue_number: number): Promise<Issue> {
    // Retrieve the issue and its comments
    const issue     = (await github.rest.issues.get({ ...context.repo, issue_number })).data;
    const comments  = await github.paginate(github.rest.issues.listComments, { ...context.repo, issue_number });
    core.info(`Retrieved issue #${issue_number}: "${issue.title}" (with ${plural(comments.length, 'comment')})`);
    core.debug(`REST API Issue:\n${JSON.stringify(issue, null, 4)}`);
    core.debug(`REST API Comments:\n${JSON.stringify(comments, null, 4)}`);

    // Simplify the issue and its comments for easier processing
    return {
        number:     issue_number,
        title:      issue.title,
        labels:     simplifyLabels(issue.labels),
        ...simplifyIssueComment(issue),
        comments:   comments.map(simplifyIssueComment)
    };
}

// Simplify the list of labels applied to an issue
function simplifyLabels(labels: RestIssue['labels']): string[] {
    return labels.map(l => typeof l === 'string' ? l : l.name ?? '').filter(Boolean);
}

// Simplify an issue body or comment
function simplifyIssueComment(comment: RestIssue | RestComment): Comment {
    return {
        url:        comment.html_url,
        created_at: comment.created_at,
        author:     comment.user?.login ?? '',
        role:       authorAssociationToRole(comment),
        body:       comment.body ?? ''
    };
}

// Identify an author's role
function authorAssociationToRole(comment: RestIssue | RestComment): Role {
    const ASSOCIATION_TO_ROLE: Record<string, Role> = {
        OWNER:                  'Maintainer',
        MEMBER:                 'Maintainer',
        COLLABORATOR:           'Maintainer',
        CONTRIBUTOR:            'User',
        FIRST_TIMER:            'User',
        FIRST_TIME_CONTRIBUTOR: 'User',
        MANNEQUIN:              'User',
        NONE:                   'Unknown'
    } satisfies Record<AuthorAssociation, Role>;
    if (comment.user?.type === 'Bot') return 'Bot';
    return ASSOCIATION_TO_ROLE[comment.author_association] ?? 'Unknown';
}