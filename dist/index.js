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
exports.default = run;
const core = __importStar(require("@actions/core"));
const get_issue_1 = require("./get_issue");
const clean_issue_1 = require("./clean_issue");
const result_context_1 = require("./result_context");
const truncate_issue_1 = require("./truncate_issue");
// GPT tokeniser: 1 token ≈ 4 prose characters or 3-3.5 for code/logs
const CHARS_PER_TOKEN = 3; // (assume worst case when truncating to fit)
// Script entry point
async function run(github) {
    // Action inputs
    const issue_number = Number(core.getInput('issue_number', { required: true }));
    const input_tokens = Number(core.getInput('input_tokens', { required: true }));
    const input_prompt_tokens = Number(core.getInput('input_prompt_tokens', { required: true }));
    // Retrieve and filter the issue with its comments
    const restIssue = await (0, get_issue_1.getIssue)(github, issue_number);
    const cleanedIssue = (0, clean_issue_1.cleanIssue)(restIssue);
    // Input context available for the issue
    const maxIssueTokens = input_tokens - input_prompt_tokens;
    const maxIssueChars = maxIssueTokens * CHARS_PER_TOKEN;
    core.info(`Budget for issue context: ${maxIssueChars} characters = ${maxIssueTokens} tokens`
        + ` (${input_tokens} tokens - ${input_prompt_tokens} prompt tokens)`);
    // Truncate the issue to fit within the available input context
    const [truncatedIssue, omittedComments] = (0, truncate_issue_1.truncateIssue)(cleanedIssue, maxIssueChars);
    // Provide useful fields as discrete outputs and return the context
    core.setOutput('issue_title', restIssue.title);
    core.setOutput('issue_url', restIssue.url);
    core.setOutput('issue_user', restIssue.author);
    return (0, result_context_1.makeResult)(truncatedIssue, omittedComments);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGdCQUFnQjtBQUNoQix5Q0FBeUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBYXpDLHNCQXdCQztBQWxDRCxvREFBc0M7QUFDdEMsMkNBQXVDO0FBQ3ZDLCtDQUEyQztBQUMzQyxxREFBc0Q7QUFDdEQscURBQWlEO0FBRWpELHFFQUFxRTtBQUNyRSxNQUFNLGVBQWUsR0FBRyxDQUFDLENBQUMsQ0FBQyw2Q0FBNkM7QUFFeEUscUJBQXFCO0FBQ04sS0FBSyxVQUFVLEdBQUcsQ0FBQyxNQUFtQztJQUNqRSxnQkFBZ0I7SUFDaEIsTUFBTSxZQUFZLEdBQVksTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFXLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNqRyxNQUFNLFlBQVksR0FBWSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQVcsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2pHLE1BQU0sbUJBQW1CLEdBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMscUJBQXFCLEVBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRWpHLGtEQUFrRDtJQUNsRCxNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUEsb0JBQVEsRUFBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDdkQsTUFBTSxZQUFZLEdBQUcsSUFBQSx3QkFBVSxFQUFDLFNBQVMsQ0FBQyxDQUFDO0lBRTNDLHdDQUF3QztJQUN4QyxNQUFNLGNBQWMsR0FBTSxZQUFZLEdBQUcsbUJBQW1CLENBQUM7SUFDN0QsTUFBTSxhQUFhLEdBQU8sY0FBYyxHQUFHLGVBQWUsQ0FBQztJQUMzRCxJQUFJLENBQUMsSUFBSSxDQUFDLDZCQUE2QixhQUFhLGlCQUFpQixjQUFjLFNBQVM7VUFDaEYsS0FBSyxZQUFZLGFBQWEsbUJBQW1CLGlCQUFpQixDQUFDLENBQUM7SUFFaEYsK0RBQStEO0lBQy9ELE1BQU0sQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLEdBQUcsSUFBQSw4QkFBYSxFQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQztJQUVyRixtRUFBbUU7SUFDbkUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9DLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM3QyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDaEQsT0FBTyxJQUFBLDJCQUFVLEVBQUMsY0FBYyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0FBQ3ZELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBHaXRIdWIgYWN0aW9uXG4vLyBDb3B5cmlnaHQgwqkgMjAyNiBBbGV4YW5kZXIgVGhvdWt5ZGlkZXNcblxuaW1wb3J0IHsgR2l0SHViIH0gZnJvbSAnQGFjdGlvbnMvZ2l0aHViL2xpYi91dGlscyc7XG5pbXBvcnQgKiBhcyBjb3JlIGZyb20gJ0BhY3Rpb25zL2NvcmUnO1xuaW1wb3J0IHsgZ2V0SXNzdWUgfSBmcm9tICcuL2dldF9pc3N1ZSc7XG5pbXBvcnQgeyBjbGVhbklzc3VlIH0gZnJvbSAnLi9jbGVhbl9pc3N1ZSc7XG5pbXBvcnQgeyBtYWtlUmVzdWx0LCBSZXN1bHQgfSBmcm9tICcuL3Jlc3VsdF9jb250ZXh0JztcbmltcG9ydCB7IHRydW5jYXRlSXNzdWUgfSBmcm9tICcuL3RydW5jYXRlX2lzc3VlJztcblxuLy8gR1BUIHRva2VuaXNlcjogMSB0b2tlbiDiiYggNCBwcm9zZSBjaGFyYWN0ZXJzIG9yIDMtMy41IGZvciBjb2RlL2xvZ3NcbmNvbnN0IENIQVJTX1BFUl9UT0tFTiA9IDM7IC8vIChhc3N1bWUgd29yc3QgY2FzZSB3aGVuIHRydW5jYXRpbmcgdG8gZml0KVxuXG4vLyBTY3JpcHQgZW50cnkgcG9pbnRcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIHJ1bihnaXRodWI6IEluc3RhbmNlVHlwZTx0eXBlb2YgR2l0SHViPik6IFByb21pc2U8UmVzdWx0PiB7XG4gICAgLy8gQWN0aW9uIGlucHV0c1xuICAgIGNvbnN0IGlzc3VlX251bWJlciAgICAgICAgICA9IE51bWJlcihjb3JlLmdldElucHV0KCdpc3N1ZV9udW1iZXInLCAgICAgICAgICB7IHJlcXVpcmVkOiB0cnVlIH0pKTtcbiAgICBjb25zdCBpbnB1dF90b2tlbnMgICAgICAgICAgPSBOdW1iZXIoY29yZS5nZXRJbnB1dCgnaW5wdXRfdG9rZW5zJywgICAgICAgICAgeyByZXF1aXJlZDogdHJ1ZSB9KSk7XG4gICAgY29uc3QgaW5wdXRfcHJvbXB0X3Rva2VucyAgID0gTnVtYmVyKGNvcmUuZ2V0SW5wdXQoJ2lucHV0X3Byb21wdF90b2tlbnMnLCAgIHsgcmVxdWlyZWQ6IHRydWUgfSkpO1xuXG4gICAgLy8gUmV0cmlldmUgYW5kIGZpbHRlciB0aGUgaXNzdWUgd2l0aCBpdHMgY29tbWVudHNcbiAgICBjb25zdCByZXN0SXNzdWUgPSBhd2FpdCBnZXRJc3N1ZShnaXRodWIsIGlzc3VlX251bWJlcik7XG4gICAgY29uc3QgY2xlYW5lZElzc3VlID0gY2xlYW5Jc3N1ZShyZXN0SXNzdWUpO1xuXG4gICAgLy8gSW5wdXQgY29udGV4dCBhdmFpbGFibGUgZm9yIHRoZSBpc3N1ZVxuICAgIGNvbnN0IG1heElzc3VlVG9rZW5zICAgID0gaW5wdXRfdG9rZW5zIC0gaW5wdXRfcHJvbXB0X3Rva2VucztcbiAgICBjb25zdCBtYXhJc3N1ZUNoYXJzICAgICA9IG1heElzc3VlVG9rZW5zICogQ0hBUlNfUEVSX1RPS0VOO1xuICAgIGNvcmUuaW5mbyhgQnVkZ2V0IGZvciBpc3N1ZSBjb250ZXh0OiAke21heElzc3VlQ2hhcnN9IGNoYXJhY3RlcnMgPSAke21heElzc3VlVG9rZW5zfSB0b2tlbnNgXG4gICAgICAgICAgICAgICsgYCAoJHtpbnB1dF90b2tlbnN9IHRva2VucyAtICR7aW5wdXRfcHJvbXB0X3Rva2Vuc30gcHJvbXB0IHRva2VucylgKTtcblxuICAgIC8vIFRydW5jYXRlIHRoZSBpc3N1ZSB0byBmaXQgd2l0aGluIHRoZSBhdmFpbGFibGUgaW5wdXQgY29udGV4dFxuICAgIGNvbnN0IFt0cnVuY2F0ZWRJc3N1ZSwgb21pdHRlZENvbW1lbnRzXSA9IHRydW5jYXRlSXNzdWUoY2xlYW5lZElzc3VlLCBtYXhJc3N1ZUNoYXJzKTtcblxuICAgIC8vIFByb3ZpZGUgdXNlZnVsIGZpZWxkcyBhcyBkaXNjcmV0ZSBvdXRwdXRzIGFuZCByZXR1cm4gdGhlIGNvbnRleHRcbiAgICBjb3JlLnNldE91dHB1dCgnaXNzdWVfdGl0bGUnLCByZXN0SXNzdWUudGl0bGUpO1xuICAgIGNvcmUuc2V0T3V0cHV0KCdpc3N1ZV91cmwnLCAgIHJlc3RJc3N1ZS51cmwpO1xuICAgIGNvcmUuc2V0T3V0cHV0KCdpc3N1ZV91c2VyJywgIHJlc3RJc3N1ZS5hdXRob3IpO1xuICAgIHJldHVybiBtYWtlUmVzdWx0KHRydW5jYXRlZElzc3VlLCBvbWl0dGVkQ29tbWVudHMpO1xufSJdfQ==