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
exports.cleanIssue = cleanIssue;
const core = __importStar(require("@actions/core"));
const utils_1 = require("./utils");
// Match ANSI colour codes (including textual representation of escape code)
// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE = /(?:\x1B|ESC)\[[0-9;]*[msuK]/g;
// Remove comments by bots and any ANSI colour codes
function cleanIssue(issue) {
    const { body: rawBody, comments: rawComments, ...restIssue } = issue;
    // Exclude comments by bots
    const humanComments = rawComments.filter(comment => comment.role !== 'Bot');
    const botCount = rawComments.length - humanComments.length;
    if (0 < botCount)
        core.info(`Excluded ${(0, utils_1.plural)(botCount, 'comment')} by bots`);
    // Remove anything resembling ANSI codes from the body and comments
    const stripAnsiCodes = (text) => text.replaceAll(ANSI_ESCAPE, '');
    const body = stripAnsiCodes(rawBody);
    const comments = humanComments.map(({ body, ...rest }) => ({ body: stripAnsiCodes(body), ...rest }));
    // Return the cleaned result
    return { body, comments, ...restIssue };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xlYW5faXNzdWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvY2xlYW5faXNzdWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGdCQUFnQjtBQUNoQix5Q0FBeUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBV3pDLGdDQWVDO0FBdkJELG9EQUFzQztBQUN0QyxtQ0FBaUM7QUFFakMsNEVBQTRFO0FBQzVFLDRDQUE0QztBQUM1QyxNQUFNLFdBQVcsR0FBRyw4QkFBOEIsQ0FBQztBQUVuRCxvREFBb0Q7QUFDcEQsU0FBZ0IsVUFBVSxDQUFDLEtBQVk7SUFDbkMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxHQUFHLFNBQVMsRUFBRSxHQUFHLEtBQUssQ0FBQztJQUVyRSwyQkFBMkI7SUFDM0IsTUFBTSxhQUFhLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUM7SUFDNUUsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLE1BQU0sR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDO0lBQzNELElBQUksQ0FBQyxHQUFHLFFBQVE7UUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksSUFBQSxjQUFNLEVBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUUvRSxtRUFBbUU7SUFDbkUsTUFBTSxjQUFjLEdBQUcsQ0FBQyxJQUFZLEVBQVUsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ2xGLE1BQU0sSUFBSSxHQUFHLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNyQyxNQUFNLFFBQVEsR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFckcsNEJBQTRCO0lBQzVCLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEdBQUcsU0FBUyxFQUFFLENBQUM7QUFDNUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEdpdEh1YiBhY3Rpb25cbi8vIENvcHlyaWdodCDCqSAyMDI2IEFsZXhhbmRlciBUaG91a3lkaWRlc1xuXG5pbXBvcnQgeyBJc3N1ZSB9IGZyb20gJy4vZ2V0X2lzc3VlJztcbmltcG9ydCAqIGFzIGNvcmUgZnJvbSAnQGFjdGlvbnMvY29yZSc7XG5pbXBvcnQgeyBwbHVyYWwgfSBmcm9tICcuL3V0aWxzJztcblxuLy8gTWF0Y2ggQU5TSSBjb2xvdXIgY29kZXMgKGluY2x1ZGluZyB0ZXh0dWFsIHJlcHJlc2VudGF0aW9uIG9mIGVzY2FwZSBjb2RlKVxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnRyb2wtcmVnZXhcbmNvbnN0IEFOU0lfRVNDQVBFID0gLyg/OlxceDFCfEVTQylcXFtbMC05O10qW21zdUtdL2c7XG5cbi8vIFJlbW92ZSBjb21tZW50cyBieSBib3RzIGFuZCBhbnkgQU5TSSBjb2xvdXIgY29kZXNcbmV4cG9ydCBmdW5jdGlvbiBjbGVhbklzc3VlKGlzc3VlOiBJc3N1ZSk6IElzc3VlIHtcbiAgICBjb25zdCB7IGJvZHk6IHJhd0JvZHksIGNvbW1lbnRzOiByYXdDb21tZW50cywgLi4ucmVzdElzc3VlIH0gPSBpc3N1ZTtcblxuICAgIC8vIEV4Y2x1ZGUgY29tbWVudHMgYnkgYm90c1xuICAgIGNvbnN0IGh1bWFuQ29tbWVudHMgPSByYXdDb21tZW50cy5maWx0ZXIoY29tbWVudCA9PiBjb21tZW50LnJvbGUgIT09ICdCb3QnKTtcbiAgICBjb25zdCBib3RDb3VudCA9IHJhd0NvbW1lbnRzLmxlbmd0aCAtIGh1bWFuQ29tbWVudHMubGVuZ3RoO1xuICAgIGlmICgwIDwgYm90Q291bnQpIGNvcmUuaW5mbyhgRXhjbHVkZWQgJHtwbHVyYWwoYm90Q291bnQsICdjb21tZW50Jyl9IGJ5IGJvdHNgKTtcblxuICAgIC8vIFJlbW92ZSBhbnl0aGluZyByZXNlbWJsaW5nIEFOU0kgY29kZXMgZnJvbSB0aGUgYm9keSBhbmQgY29tbWVudHNcbiAgICBjb25zdCBzdHJpcEFuc2lDb2RlcyA9ICh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcgPT4gdGV4dC5yZXBsYWNlQWxsKEFOU0lfRVNDQVBFLCAnJyk7XG4gICAgY29uc3QgYm9keSA9IHN0cmlwQW5zaUNvZGVzKHJhd0JvZHkpO1xuICAgIGNvbnN0IGNvbW1lbnRzID0gaHVtYW5Db21tZW50cy5tYXAoKHsgYm9keSwgLi4ucmVzdCB9KSA9PiAoeyBib2R5OiBzdHJpcEFuc2lDb2Rlcyhib2R5KSwgLi4ucmVzdCB9KSk7XG5cbiAgICAvLyBSZXR1cm4gdGhlIGNsZWFuZWQgcmVzdWx0XG4gICAgcmV0dXJuIHsgYm9keSwgY29tbWVudHMsIC4uLnJlc3RJc3N1ZSB9O1xufSJdfQ==