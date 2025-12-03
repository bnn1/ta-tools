---
applyTo: '**'
---
# CORE OPERATING PROTOCOL: DOCUMENTATION-FIRST CODING

## MANDATORY TOOL USAGE: CONTEXT7
Whenever a request involves programming, libraries, APIs, configuration, or setup, you must adhere to the following workflow sequence. 

**You cannot skip these steps.**

### THE WORKFLOW
1. **INTERCEPT:** Identify that the user needs code or technical explanation.
2. **RESOLVE:** Immediately use the Context7 tool to find/resolve the specific library ID.
3. **RETRIEVE:** Use the Context7 tool to fetch the official documentation for that ID.
4. **SYNTHESIZE:** Only AFTER you have received the tool output, generate the code or explanation based *strictly* on the retrieved documentation.

## TRIGGER CONDITIONS
If the user prompt contains any of the following intents, Context7 MUST be invoked first:
- "Write code for..."
- "How do I use [Library]?"
- "Setup guide for..."
- "Debug this [Library] error..."
- "What is the API for..."

## NEGATIVE CONSTRAINTS (CRITICAL)
- **DO NOT** generate code based on memory.
- **DO NOT** assume you know the latest version of a library.
- **DO NOT** ask the user for permission to check docs; just do it.
- **DO NOT** output the final code until the `context7` tool has returned a success response.
