# RaktaSetu AI Router Fix Summary

## Problem Identified

The AI chat was returning a fallback error message ("Sorry, I'm having trouble right now") instead of real AI responses. The root cause was a **URL construction bug** in the backend AI router.

## Root Cause

The LLM proxy endpoint is configured with `OPENAI_API_BASE=https://api.manus.im/api/llm-proxy/v1`, which already includes the `/v1` path component.

However, the `resolveApiUrl()` and `listLLMModels()` functions in `server/_core/llm.ts` were **unconditionally appending `/v1/chat/completions` and `/v1/models`** to the base URL, resulting in:

- **Expected:** `https://api.manus.im/api/llm-proxy/v1/chat/completions`
- **Actual (broken):** `https://api.manus.im/api/llm-proxy/v1/v1/chat/completions` ❌

This caused a **404 Not Found** error, which was caught by the error handler and returned the fallback message.

## Solution Implemented

Updated the URL resolution logic in `server/_core/llm.ts` to intelligently handle both cases:

### Changes Made

#### 1. Fixed `resolveApiUrl()` function (lines 215-230)

```typescript
const resolveApiUrl = () => {
  const baseUrl = ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? ENV.forgeApiUrl
    : "https://forge.manus.im";
  
  // Remove trailing slash
  const cleanUrl = baseUrl.replace(/\/$/, "");
  
  // If the URL already ends with /v1, append /chat/completions
  // Otherwise, append /v1/chat/completions
  if (cleanUrl.endsWith("/v1")) {
    return `${cleanUrl}/chat/completions`;
  }
  
  return `${cleanUrl}/v1/chat/completions`;
};
```

#### 2. Fixed `listLLMModels()` function (lines 447-461)

Applied the same intelligent URL resolution logic for the models endpoint:

```typescript
export async function listLLMModels(): Promise<ModelsResponse> {
  assertApiKey();

  const baseUrl = ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? ENV.forgeApiUrl
    : "https://forge.manus.im";
  
  // Remove trailing slash
  const cleanUrl = baseUrl.replace(/\/$/, "");
  
  // If the URL already ends with /v1, append /models
  // Otherwise, append /v1/models
  const url = cleanUrl.endsWith("/v1")
    ? `${cleanUrl}/models`
    : `${cleanUrl}/v1/models`;
  
  // ... rest of function
}
```

## Verification

✅ **LLM Invocation Test:** Successfully returns real AI responses
✅ **Models List Test:** Successfully lists available models
✅ **AI Chat Router Test:** Successfully processes blood emergency requests with JSON schema validation

### Test Results

```
Available Models:
- gpt-5-nano
- gpt-5-mini
- gpt-5
- gpt-5.5
- claude-haiku-4-5
- claude-sonnet-4-6
- claude-opus-4-6
- claude-opus-4-7
- gemini-3-flash-preview
- gemini-3.1-pro-preview
```

## Impact

This fix resolves the production issue where:
- ❌ Users saw "Sorry, I'm having trouble right now" fallback message
- ✅ Users now receive real, contextual AI responses for blood emergency queries

## Files Modified

- `server/_core/llm.ts` - Updated URL resolution logic in two functions
