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
exports.getIssue = getIssue;
const github_1 = require("@actions/github");
const core = __importStar(require("@actions/core"));
const utils_1 = require("./utils");
// Retrieve an issue with all of its comments, and simplify its representation
async function getIssue(github, issue_number) {
    // Retrieve the issue and its comments
    const issue = (await github.rest.issues.get({ ...github_1.context.repo, issue_number })).data;
    const comments = await github.paginate(github.rest.issues.listComments, { ...github_1.context.repo, issue_number });
    core.info(`Retrieved issue #${issue_number}: "${issue.title}" (with ${(0, utils_1.plural)(comments.length, 'comment')})`);
    core.debug(`REST API Issue:\n${JSON.stringify(issue, null, 4)}`);
    core.debug(`REST API Comments:\n${JSON.stringify(issue, null, 4)}`);
    // Simplify the issue and its comments for easier processing
    return {
        number: issue_number,
        title: issue.title,
        labels: simplifyLabels(issue.labels),
        ...simplifyIssueComment(issue),
        comments: comments.map(simplifyIssueComment)
    };
}
// Simplify the list of labels applied to an issue
function simplifyLabels(labels) {
    return labels.map(l => typeof l === 'string' ? l : l.name ?? '').filter(Boolean);
}
// Simplify an issue body or comment
function simplifyIssueComment(comment) {
    return {
        url: comment.html_url,
        created_at: comment.created_at,
        author: comment.user?.login ?? '',
        role: authorAssociationToRole(comment),
        body: comment.body ?? ''
    };
}
// Identify an author's role
function authorAssociationToRole(comment) {
    const ASSOCIATION_TO_ROLE = {
        OWNER: 'Maintainer',
        MEMBER: 'Maintainer',
        COLLABORATOR: 'Maintainer',
        CONTRIBUTOR: 'User',
        FIRST_TIMER: 'User',
        FIRST_TIME_CONTRIBUTOR: 'User',
        MANNEQUIN: 'User',
        NONE: 'Unknown'
    };
    if (comment.user?.type === 'Bot')
        return 'Bot';
    return ASSOCIATION_TO_ROLE[comment.author_association];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0X2lzc3VlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dldF9pc3N1ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsZ0JBQWdCO0FBQ2hCLHlDQUF5Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQ3pDLDRCQWdCQztBQWpERCw0Q0FBMEM7QUFJMUMsb0RBQXNDO0FBQ3RDLG1DQUFpQztBQTJCakMsOEVBQThFO0FBQ3ZFLEtBQUssVUFBVSxRQUFRLENBQUMsTUFBbUMsRUFBRSxZQUFvQjtJQUNwRixzQ0FBc0M7SUFDdEMsTUFBTSxLQUFLLEdBQU8sQ0FBQyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsZ0JBQU8sQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUN6RixNQUFNLFFBQVEsR0FBSSxNQUFNLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLEVBQUUsR0FBRyxnQkFBTyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDO0lBQzVHLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLFlBQVksTUFBTSxLQUFLLENBQUMsS0FBSyxXQUFXLElBQUEsY0FBTSxFQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzdHLElBQUksQ0FBQyxLQUFLLENBQUMsb0JBQW9CLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDakUsSUFBSSxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUVwRSw0REFBNEQ7SUFDNUQsT0FBTztRQUNILE1BQU0sRUFBTSxZQUFZO1FBQ3hCLEtBQUssRUFBTyxLQUFLLENBQUMsS0FBSztRQUN2QixNQUFNLEVBQU0sY0FBYyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7UUFDeEMsR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7UUFDOUIsUUFBUSxFQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUM7S0FDakQsQ0FBQztBQUNOLENBQUM7QUFFRCxrREFBa0Q7QUFDbEQsU0FBUyxjQUFjLENBQUMsTUFBMkI7SUFDL0MsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3JGLENBQUM7QUFFRCxvQ0FBb0M7QUFDcEMsU0FBUyxvQkFBb0IsQ0FBQyxPQUFnQztJQUMxRCxPQUFPO1FBQ0gsR0FBRyxFQUFTLE9BQU8sQ0FBQyxRQUFRO1FBQzVCLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtRQUM5QixNQUFNLEVBQU0sT0FBTyxDQUFDLElBQUksRUFBRSxLQUFLLElBQUksRUFBRTtRQUNyQyxJQUFJLEVBQVEsdUJBQXVCLENBQUMsT0FBTyxDQUFDO1FBQzVDLElBQUksRUFBUSxPQUFPLENBQUMsSUFBSSxJQUFJLEVBQUU7S0FDakMsQ0FBQztBQUNOLENBQUM7QUFFRCw0QkFBNEI7QUFDNUIsU0FBUyx1QkFBdUIsQ0FBQyxPQUFnQztJQUM3RCxNQUFNLG1CQUFtQixHQUFvQztRQUN6RCxLQUFLLEVBQW1CLFlBQVk7UUFDcEMsTUFBTSxFQUFrQixZQUFZO1FBQ3BDLFlBQVksRUFBWSxZQUFZO1FBQ3BDLFdBQVcsRUFBYSxNQUFNO1FBQzlCLFdBQVcsRUFBYSxNQUFNO1FBQzlCLHNCQUFzQixFQUFFLE1BQU07UUFDOUIsU0FBUyxFQUFlLE1BQU07UUFDOUIsSUFBSSxFQUFvQixTQUFTO0tBQ3BDLENBQUM7SUFDRixJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxLQUFLLEtBQUs7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUMvQyxPQUFPLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBQzNELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBHaXRIdWIgYWN0aW9uXG4vLyBDb3B5cmlnaHQgwqkgMjAyNiBBbGV4YW5kZXIgVGhvdWt5ZGlkZXNcblxuaW1wb3J0IHsgY29udGV4dCB9IGZyb20gJ0BhY3Rpb25zL2dpdGh1Yic7XG5pbXBvcnQgeyBHaXRIdWIgfSBmcm9tICdAYWN0aW9ucy9naXRodWIvbGliL3V0aWxzJztcbmltcG9ydCB7IGNvbXBvbmVudHMgfSBmcm9tICdAb2N0b2tpdC9vcGVuYXBpLXR5cGVzJztcbmltcG9ydCB7IFJlc3RFbmRwb2ludE1ldGhvZFR5cGVzIH0gZnJvbSAnQG9jdG9raXQvcGx1Z2luLXJlc3QtZW5kcG9pbnQtbWV0aG9kcy9kaXN0LXR5cGVzL2dlbmVyYXRlZC9wYXJhbWV0ZXJzLWFuZC1yZXNwb25zZS10eXBlcyc7XG5pbXBvcnQgKiBhcyBjb3JlIGZyb20gJ0BhY3Rpb25zL2NvcmUnO1xuaW1wb3J0IHsgcGx1cmFsIH0gZnJvbSAnLi91dGlscyc7XG5cbi8vIEdpdEh1YiBSRVNUIEFQSSB0eXBlc1xudHlwZSBBdXRob3JBc3NvY2lhdGlvbiAgPSBjb21wb25lbnRzWydzY2hlbWFzJ11bJ2F1dGhvci1hc3NvY2lhdGlvbiddO1xudHlwZSBSZXN0SXNzdWUgICAgICAgICAgPSBSZXN0RW5kcG9pbnRNZXRob2RUeXBlc1snaXNzdWVzJ11bJ2dldCddWydyZXNwb25zZSddWydkYXRhJ107XG50eXBlIFJlc3RDb21tZW50ICAgICAgICA9IFJlc3RFbmRwb2ludE1ldGhvZFR5cGVzWydpc3N1ZXMnXVsnbGlzdENvbW1lbnRzJ11bJ3Jlc3BvbnNlJ11bJ2RhdGEnXVswXTtcblxuLy8gQSBzaW1wbGlmaWVkIHJlcHJlc2VudGF0aW9uIG9mIGFuIGF1dGhvciBhc3NvY2lhdGlvblxuZXhwb3J0IHR5cGUgUm9sZSA9ICdNYWludGFpbmVyJyB8ICdVc2VyJyB8ICdCb3QnIHwgJ1Vua25vd24nO1xuXG4vLyBBIHNpbXBsaWZpZWQgcmVwcmVzZW50YXRpb24gb2YgYW4gaXNzdWUgYm9keSBvciBjb21tZW50XG5leHBvcnQgaW50ZXJmYWNlIENvbW1lbnQge1xuICAgIHVybDogICAgICAgIHN0cmluZztcbiAgICBjcmVhdGVkX2F0OiBzdHJpbmc7XG4gICAgYXV0aG9yOiAgICAgc3RyaW5nO1xuICAgIHJvbGU6ICAgICAgIFJvbGU7XG4gICAgYm9keTogICAgICAgc3RyaW5nO1xufVxuXG4vLyBBIHNpbXBsaWZpZWQgcmVwcmVzZW50YXRpb24gb2YgYW4gaXNzdWUgd2l0aCBpdHMgY29tbWVudHNcbmV4cG9ydCBpbnRlcmZhY2UgSXNzdWUgZXh0ZW5kcyBDb21tZW50IHtcbiAgICBudW1iZXI6ICAgICBudW1iZXI7XG4gICAgdGl0bGU6ICAgICAgc3RyaW5nO1xuICAgIGxhYmVsczogICAgIHN0cmluZ1tdO1xuICAgIGNvbW1lbnRzOiAgIENvbW1lbnRbXTtcbn1cblxuLy8gUmV0cmlldmUgYW4gaXNzdWUgd2l0aCBhbGwgb2YgaXRzIGNvbW1lbnRzLCBhbmQgc2ltcGxpZnkgaXRzIHJlcHJlc2VudGF0aW9uXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0SXNzdWUoZ2l0aHViOiBJbnN0YW5jZVR5cGU8dHlwZW9mIEdpdEh1Yj4sIGlzc3VlX251bWJlcjogbnVtYmVyKTogUHJvbWlzZTxJc3N1ZT4ge1xuICAgIC8vIFJldHJpZXZlIHRoZSBpc3N1ZSBhbmQgaXRzIGNvbW1lbnRzXG4gICAgY29uc3QgaXNzdWUgICAgID0gKGF3YWl0IGdpdGh1Yi5yZXN0Lmlzc3Vlcy5nZXQoeyAuLi5jb250ZXh0LnJlcG8sIGlzc3VlX251bWJlciB9KSkuZGF0YTtcbiAgICBjb25zdCBjb21tZW50cyAgPSBhd2FpdCBnaXRodWIucGFnaW5hdGUoZ2l0aHViLnJlc3QuaXNzdWVzLmxpc3RDb21tZW50cywgeyAuLi5jb250ZXh0LnJlcG8sIGlzc3VlX251bWJlciB9KTtcbiAgICBjb3JlLmluZm8oYFJldHJpZXZlZCBpc3N1ZSAjJHtpc3N1ZV9udW1iZXJ9OiBcIiR7aXNzdWUudGl0bGV9XCIgKHdpdGggJHtwbHVyYWwoY29tbWVudHMubGVuZ3RoLCAnY29tbWVudCcpfSlgKTtcbiAgICBjb3JlLmRlYnVnKGBSRVNUIEFQSSBJc3N1ZTpcXG4ke0pTT04uc3RyaW5naWZ5KGlzc3VlLCBudWxsLCA0KX1gKTtcbiAgICBjb3JlLmRlYnVnKGBSRVNUIEFQSSBDb21tZW50czpcXG4ke0pTT04uc3RyaW5naWZ5KGlzc3VlLCBudWxsLCA0KX1gKTtcblxuICAgIC8vIFNpbXBsaWZ5IHRoZSBpc3N1ZSBhbmQgaXRzIGNvbW1lbnRzIGZvciBlYXNpZXIgcHJvY2Vzc2luZ1xuICAgIHJldHVybiB7XG4gICAgICAgIG51bWJlcjogICAgIGlzc3VlX251bWJlcixcbiAgICAgICAgdGl0bGU6ICAgICAgaXNzdWUudGl0bGUsXG4gICAgICAgIGxhYmVsczogICAgIHNpbXBsaWZ5TGFiZWxzKGlzc3VlLmxhYmVscyksXG4gICAgICAgIC4uLnNpbXBsaWZ5SXNzdWVDb21tZW50KGlzc3VlKSxcbiAgICAgICAgY29tbWVudHM6ICAgY29tbWVudHMubWFwKHNpbXBsaWZ5SXNzdWVDb21tZW50KVxuICAgIH07XG59XG5cbi8vIFNpbXBsaWZ5IHRoZSBsaXN0IG9mIGxhYmVscyBhcHBsaWVkIHRvIGFuIGlzc3VlXG5mdW5jdGlvbiBzaW1wbGlmeUxhYmVscyhsYWJlbHM6IFJlc3RJc3N1ZVsnbGFiZWxzJ10pOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIGxhYmVscy5tYXAobCA9PiB0eXBlb2YgbCA9PT0gJ3N0cmluZycgPyBsIDogbC5uYW1lID8/ICcnKS5maWx0ZXIoQm9vbGVhbik7XG59XG5cbi8vIFNpbXBsaWZ5IGFuIGlzc3VlIGJvZHkgb3IgY29tbWVudFxuZnVuY3Rpb24gc2ltcGxpZnlJc3N1ZUNvbW1lbnQoY29tbWVudDogUmVzdElzc3VlIHwgUmVzdENvbW1lbnQpOiBDb21tZW50IHtcbiAgICByZXR1cm4ge1xuICAgICAgICB1cmw6ICAgICAgICBjb21tZW50Lmh0bWxfdXJsLFxuICAgICAgICBjcmVhdGVkX2F0OiBjb21tZW50LmNyZWF0ZWRfYXQsXG4gICAgICAgIGF1dGhvcjogICAgIGNvbW1lbnQudXNlcj8ubG9naW4gPz8gJycsXG4gICAgICAgIHJvbGU6ICAgICAgIGF1dGhvckFzc29jaWF0aW9uVG9Sb2xlKGNvbW1lbnQpLFxuICAgICAgICBib2R5OiAgICAgICBjb21tZW50LmJvZHkgPz8gJydcbiAgICB9O1xufVxuXG4vLyBJZGVudGlmeSBhbiBhdXRob3IncyByb2xlXG5mdW5jdGlvbiBhdXRob3JBc3NvY2lhdGlvblRvUm9sZShjb21tZW50OiBSZXN0SXNzdWUgfCBSZXN0Q29tbWVudCk6IFJvbGUge1xuICAgIGNvbnN0IEFTU09DSUFUSU9OX1RPX1JPTEU6IFJlY29yZDxBdXRob3JBc3NvY2lhdGlvbiwgUm9sZT4gPSB7XG4gICAgICAgIE9XTkVSOiAgICAgICAgICAgICAgICAgICdNYWludGFpbmVyJyxcbiAgICAgICAgTUVNQkVSOiAgICAgICAgICAgICAgICAgJ01haW50YWluZXInLFxuICAgICAgICBDT0xMQUJPUkFUT1I6ICAgICAgICAgICAnTWFpbnRhaW5lcicsXG4gICAgICAgIENPTlRSSUJVVE9SOiAgICAgICAgICAgICdVc2VyJyxcbiAgICAgICAgRklSU1RfVElNRVI6ICAgICAgICAgICAgJ1VzZXInLFxuICAgICAgICBGSVJTVF9USU1FX0NPTlRSSUJVVE9SOiAnVXNlcicsXG4gICAgICAgIE1BTk5FUVVJTjogICAgICAgICAgICAgICdVc2VyJyxcbiAgICAgICAgTk9ORTogICAgICAgICAgICAgICAgICAgJ1Vua25vd24nXG4gICAgfTtcbiAgICBpZiAoY29tbWVudC51c2VyPy50eXBlID09PSAnQm90JykgcmV0dXJuICdCb3QnO1xuICAgIHJldHVybiBBU1NPQ0lBVElPTl9UT19ST0xFW2NvbW1lbnQuYXV0aG9yX2Fzc29jaWF0aW9uXTtcbn0iXX0=