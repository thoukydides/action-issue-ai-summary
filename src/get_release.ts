// GitHub action
// Copyright © 2026 Alexander Thoukydides

import { GitHub } from '@actions/github/lib/utils';
import * as core from '@actions/core';

// Retrieve the latest release version (tag name)
export async function getLatestRelease(github: InstanceType<typeof GitHub>, owner: string, repo: string): Promise<string | undefined> {
    try {
        const release = (await github.rest.repos.getLatestRelease({ owner, repo })).data;
        core.info(`Latest release: ${release.tag_name}: ${release.html_url}`);
        core.debug(`REST API Latest Release:\n${JSON.stringify(release, null, 4)}`);
        return release.tag_name;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        core.error(`Failed to retrieve latest release: ${message}`);
    }
}