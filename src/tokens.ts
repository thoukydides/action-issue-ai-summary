// GitHub action
// Copyright © 2026 Alexander Thoukydides

import { Tiktoken } from 'js-tiktoken/lite';
import ranks from 'js-tiktoken/ranks/o200k_base';

// 'o200k_base' encoding is used by the following model families:
//   - o1
//   - o3
//   - o4-mini
//   - gpt-5
//   - gpt-4.1
//   - gpt-4o

// Generate an object based on an integral parameter
// (size generally increases with parameter value)
export type TokenObjectMaker<T> = (param: number) => T;

// Result of a token optimisation
export interface TokenFitResult<T> {
    param:  number;     // The optimised integral parameter
    value:  T;          // The optimised value, i.e. the result of maker(param)
    tokens: number;     // The number of tokens in value
    done:   boolean;    // Was the token limit satisfied
}

// Initialise the encoder once
const encoder = new Tiktoken(ranks);

// Token count for a string
export function textTokens(text: string): number {
    return encoder.encode(text).length;
}

// Token count for JSON encoding of an object
export function jsonTokens(value: unknown): number {
    const jsonString = JSON.stringify(value);
    return textTokens(jsonString);
}

// Find the largest integral parameter that fits within a token count limit
// (might not be optimal if size changes non-monotonically)
export function fitTokens<T>(
    maker:      TokenObjectMaker<T>,
    maxTokens:  number,
    minParam:   number,
    maxParam:   number
): TokenFitResult<T> {
    // Assess a particular parameter value
    const getResult = (param: number): TokenFitResult<T> => {
        const value     = maker(param);
        const tokens    = jsonTokens(value);
        const done      = tokens <= maxTokens;
        return { param, value, tokens, done };
    };

    // Perform a binary search to find the largest parameter that fits
    while (minParam < maxParam) {
        const testParam = Math.ceil((minParam + maxParam) / 2);
        const { done } = getResult(testParam);
        if (done)   minParam = testParam;
        else        maxParam = testParam - 1;
    }

    // Return the best fit
    return getResult(maxParam);
}