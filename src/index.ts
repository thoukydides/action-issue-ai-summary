// GitHub action
// Copyright © 2026 Alexander Thoukydides

import { GitHub } from '@actions/github/lib/utils.js';
import * as core from '@actions/core';
import { getIssue } from './get_issue.js';
import { cleanIssue } from './clean_issue.js';
import { makeResult, Result } from './result_context.js';
import { truncateIssue } from './truncate_issue.js';
import { jsonTokens } from './tokens.js';
import { plural } from './utils.js';

// GPT tokeniser: 1 token ≈ 4 prose characters or 3-3.5 for code/logs
const CHARS_PER_TOKEN = 3; // (assume worst case when truncating to fit)

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
    const maxIssueTokens    = input_tokens - input_prompt_tokens;
    const maxIssueChars     = maxIssueTokens * CHARS_PER_TOKEN;
    core.info(`Budget for issue context: ${maxIssueChars} characters = ${maxIssueTokens} tokens`
              + ` (${input_tokens} tokens - ${input_prompt_tokens} prompt tokens)`);

    // Truncate the issue to fit within the available input context
    const [truncatedIssue, omittedComments] = truncateIssue(cleanedIssue, maxIssueChars);

    // Try calculating the actual token count
    const finalTokens = jsonTokens(makeResult(truncatedIssue, omittedComments));
    core.info(`Final size ${plural(finalTokens, 'token')}`);

    // Provide useful fields as discrete outputs and return the context
    core.setOutput('issue_title', restIssue.title);
    core.setOutput('issue_url',   restIssue.url);
    core.setOutput('issue_user',  restIssue.author);
    return makeResult(truncatedIssue, omittedComments);
}