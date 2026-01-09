---
id: {ID}
title: {TITLE}
stage: {STAGE}
date: {DATE_ISO}
surface: agent
model: {MODEL}
feature: {FEATURE}
branch: {BRANCH}
user: {USER}
command: /sp.phr
labels: [authentication, database, neon-postgresql, fastapi, nextjs, signup, login, security]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - backend/app/database.py
  - backend/app/auth.py
  - backend/create_test_user.py
  - frontend/app/login/page.tsx
  - frontend/app/signup/page.tsx
  - README.md
tests: []
---

# {TITLE}

## Context
{PROMPT_TEXT}

## Response Summary
{RESPONSE_TEXT}

## Outcome & Impact
{OUTCOME_IMPACT}

## Files Modified
{FILES_SUMMARY}

## Tests Summary
{TESTS_SUMMARY}

## Next Prompts
{NEXT_PROMPTS}

## Reflection Note
{REFLECTION_NOTE}

## Evaluation
Failure modes observed: {FAILURE_MODES}
Next experiment: {NEXT_EXPERIMENT}
