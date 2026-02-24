# `action-issue-ai-summary`

This action uses Google Gemini to summarise the body and comments of an issue:
- **Fetch Issue and Comments**: Retrieves the issue body and all comments, excluding bot comments.
- **Truncate Content**: Intelligently truncates logs, code blocks, and long text to fit the AI model's context limit.
- **Generate Output**: Uses Google AI Studio to generate output using either a default or custom `.prompt.yml` file.

> [!CAUTION]
> This action is provided for my own use and published in case it is useful to others. If you rely on it, fork and maintain your own copy. No support or stability guarantees are offered.

## Prerequisites

Before using this workflow, ensure:
- The workflow has `issues: read` and `contents: read` permissions (either via the default `GITHUB_TOKEN` or a fine-grained token).
- You have created a [Gemini API key](https://ai.google.dev/gemini-api/docs/api-key) and placed it in a repository secret (e.g. `GEMINI_API_KEY`).
- You understand the [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) for your chosen model and usage tier.

> [!TIP]
> Google AI Studio Gemini rate limits are per-project. Create multiple projects, each with its own API key, to increase quotas.

## Inputs

Various inputs are defined in the action to configure its operation:

| Name | Description | Default
| --- | --- | ---
| `gemini_api_key` | The Google AI Studio Gemini API key | *required*
| `repository` | The repository to check in the format `'owner/repo'` | `${{ github.repository }}`
| `issue_number` | The GitHub issue to summarise | *required*
| `include_comments` | Should comments be included in the model's context | `true`
| `prompt_file` | Path to a custom `.prompt.yml` file containing the AI prompt template | Internal `'default.prompt.yml'`
| `prompt_vars` | Additional template variables in YAML format to substitute into the AI prompt | `''`
| `prompt_vars_files` | Additional template variables in YAML format, where the values are file paths | `''`
| `input_tokens` | The maximum number of input tokens that the AI model will accept (used to guide truncation of the issue body and comments to fit the available context) | `50000`
| `input_prompt_tokens` | The number of input tokens reserved for the prompt template itself (deducted from `input_tokens` when truncating the issue) | `100`
| `output_tokens` | The maximum number of output tokens for the AI model to generate (only affects truncation of the generated summary; if it is too small, the model may drop sections of the response) | `65536`

> [!CAUTION]
> The input token count is estimated using the `o200k_base` encoding. This is intended for OpenAI models (in the `o1`, `o3`, `o4-mini`, `gpt-5`, `gpt-4.1`, and `gpt-4o` families). It provides a general guide for Gemini usage but is not precise.

## Outputs

The action provides the following outputs:

| Name | Description
| --- | ---
| `response` | The response from the AI model
| `context` | The issue context that was provided to the AI
| `issue_title` | The issue title
| `issue_url` | The issue URL
| `issue_user` | The issue author

## Prompt Variables

The following variables are substituted in the `.prompt.yml` template:

| Variable | Description
| --- | ---
| `{{context}}` | The issue body and comments as a minified JSON string (truncated as necessary to fit within the model's input context)
| `{{owner}}` | The user ID of the repo owner
| `{{repository}}` | The repository name
| `{{release}}` | The tag of the latest non-prerelease, or `'latest release'` if none
| `{{user}}` | The user ID of the issue's creator

Additional template variables can be specified using the `prompt_vars` input.

## Usage

Example workflow to generate a summary when an issue is closed:

```yaml
name: Closed Issue Summary
permissions:
  issues: read
  contents: read

on:
  issues:
    types: [closed]
  workflow_dispatch:
    inputs:
      issue_number:
        description: 'Issue number'
        required: true
        type: number

jobs:
  closed-issue-summary:
    runs-on: ubuntu-latest

    steps:
    - name: Summarise the issue and its comments
      uses: thoukydides/action-issue-ai-summary@v1
      with:
        gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
        # Use the event issue number for label triggers, or the manual input for workflow_dispatch
        issue_number: ${{ github.event.issue.number || fromJson(inputs.issue_number) }}
        prompt_file: ${{ github.workspace }}/issue-summary.prompt.yml
        input_prompt_tokens: 1000
```

> [!TIP]
> Use the Google AI Studio [Playground](https://aistudio.google.com/prompts/new_chat) to determine `input_prompt_tokens` if a custom `prompt_file` is used. Ensure that the same model is selected as specified by the prompt file.

> [!TIP]
> If you want to use your own prompt, provide a path relative to the repository root (e.g. `./.github/prompts/my-triage.yml`).

### Prompt with unstructured output

Example `.prompt.yml` for unstructured output:

```yaml
model: gemini-3-flash-preview

messages:

  - role: system
    content: |-
      You are a helpful assistant
      
  - role: user
    content: |- # markdown
      Summarise the following GitHub issue in one paragraph:

      ```json
      {{context}}
      ```
```

### Prompt with JSON schema

Example `.prompt.yml` with JSON schema:

```yaml
model: gemini-3-flash-preview

messages:

  - role: system
    content: |-
      You are a triage bot.
      Return a JSON object with fields: status, blocker, next_steps, confidence.
      Use lowercase enum values. Do not include extra keys.

  - role: user
    content: |- # markdown
      Analyse the following GitHub issue:

      ```json
      {{context}}
      ```

responseFormat: json_schema

jsonSchema: |-
  {
    "name": "issue",
    "strict": true,
    "schema": {
      "title": "IssueSummary",
      "type": "object",
      "properties": {
        "status": {
          "enum": ['resolved', 'waiting for feedback', 'under review', 'invalid'],
          "description": "The current issue status"
        },
        "blocker": {
          "type": "string",
          "description": "A brief description of the current technical blocker(s)"
        },
        "next_steps": {
          "type": "string",
          "description": "Required next steps to progress the issue"
        },
        "confidence": {
          "enum": ['high', 'medium', 'low'],
          "description": "Confidence level of the issue analysis "
        }
      },
      "additionalProperties": false,
      "required": ["status", "blocker", "next_steps", "confidence"]
    }
  }
```

## ISC License (ISC)

<details>
<summary>Copyright © 2026 Alexander Thoukydides</summary>

> Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
>
> THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
</details>