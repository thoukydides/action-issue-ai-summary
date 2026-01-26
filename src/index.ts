// GitHub action
// Copyright © 2026 Alexander Thoukydides

import { GitHub } from '@actions/github/lib/utils.js';
import * as core from '@actions/core';
import { getIssue } from './get_issue.js';
import { cleanIssue } from './clean_issue.js';
import { Result } from './result_context.js';
import { truncateIssue } from './truncate_issue.js';
import { plural } from './utils.js';

// Script entry point
export default async function run(github: InstanceType<typeof GitHub>): Promise<Result> {
    // Action inputs
    const issue_number          = Number(core.getInput('issue_number',          { required: true }));
    const input_tokens          = Number(core.getInput('input_tokens',          { required: true }));
    const input_prompt_tokens   = Number(core.getInput('input_prompt_tokens',   { required: true }));

    // Retrieve and filter the issue with its comments
    const restIssue = await getIssue(github, issue_number);
    const cleanedIssue = cleanIssue(restIssue);

    // Input context available for the issue
    if (input_tokens < input_prompt_tokens) throw new Error('input_tokens < input_prompt_tokens');
    const maxIssueTokens = input_tokens - input_prompt_tokens;
    core.info(`Budget for issue context: ${plural(maxIssueTokens, 'token')}`
              + ` (${plural(input_tokens, 'token')} - ${plural(input_prompt_tokens, 'prompt token')})`);

    // Truncate the issue to fit within the available input context
    const result = truncateIssue(cleanedIssue, maxIssueTokens);

    // Provide useful fields as discrete outputs and return the context
    core.setOutput('issue_title', restIssue.title);
    core.setOutput('issue_url',   restIssue.url);
    core.setOutput('issue_user',  restIssue.author);
    return result;
}