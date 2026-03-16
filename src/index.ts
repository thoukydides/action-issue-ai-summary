// GitHub action
// Copyright © 2026 Alexander Thoukydides

import { GitHub } from '@actions/github/lib/utils';
import * as core from '@actions/core';
import { getIssue } from './get_issue.js';
import { cleanIssue } from './clean_issue.js';
import { Result } from './result_context.js';
import { truncateIssue } from './truncate_issue.js';
import { plural } from './utils.js';
import { getLatestRelease } from './get_release.js';

// Script entry point
export default async function run(github: InstanceType<typeof GitHub>): Promise<Result> {
    // Action inputs
    const repository            =        core.getInput       ('repository',             { required: true });
    const issue_number          = Number(core.getInput       ('issue_number',           { required: true }));
    const include_comments      =        core.getBooleanInput('include_comments',       { required: true });
    const input_tokens          = Number(core.getInput       ('input_tokens',           { required: true }));
    const input_prompt_tokens   = Number(core.getInput       ('input_prompt_tokens',    { required: true }));

    // Retrieve and filter the issue with its comments
    const [owner, repo] = repository.split('/', 2);
    if (!owner || !repo) throw new Error(`repository input not in 'owner/repo' format: ${repository}`);
    const restIssue = await getIssue(github, owner, repo, issue_number, include_comments);
    const cleanedIssue = cleanIssue(restIssue);

    // Input context available for the issue
    if (input_tokens < input_prompt_tokens) throw new Error('input_tokens < input_prompt_tokens');
    const maxIssueTokens = input_tokens - input_prompt_tokens;
    core.info(`Budget for issue context: ${plural(maxIssueTokens, 'token')}`
              + ` (${plural(input_tokens, 'token')} - ${plural(input_prompt_tokens, 'prompt token')})`);

    // Truncate the issue to fit within the available input context
    const result = truncateIssue(cleanedIssue, maxIssueTokens);

    // Retrieve the latest release
    const release = (await getLatestRelease(github, owner, repo)) ?? 'latest release';

    // Provide useful fields as discrete outputs and return the context
    core.setOutput('owner',       owner);
    core.setOutput('repo',        repo);
    core.setOutput('issue_title', restIssue.title);
    core.setOutput('issue_url',   restIssue.url);
    core.setOutput('issue_user',  restIssue.author);
    core.setOutput('release',     release);
    return result;
}