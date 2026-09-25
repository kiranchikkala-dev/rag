## Project Overview

This is a Next.js application built with TypeScript.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

## General Rules

- Use TypeScript.
- Use functional React components.
- Prefer Server Components by default.
- Use `"use client"` only when client-side functionality is required.
- Use the Next.js App Router.
- Follow the existing project structure and conventions.
- Do not introduce new dependencies unless necessary.
- Reuse existing components before creating new ones.
- Keep components small and reusable.
- Avoid unnecessary duplication.

## Styling

- Use Tailwind CSS for styling.
- Use shadcn/ui components where appropriate.
- Do not introduce another CSS framework.
- Prefer responsive design.
- Keep UI consistent with the existing design system.

## Code Quality

- Use meaningful variable and function names.
- Avoid `any` unless absolutely necessary.
- Handle loading, error, and empty states.
- Keep business logic separate from UI when practical.
- Remove unused imports and variables.
- Do not leave debug `console.log` statements in production code.

## Next.js Guidelines

- Use the App Router.
- Use `next/image` for images.
- Use `next/link` for internal navigation.
- Use server-side data fetching where appropriate.
- Keep secrets and API keys in environment variables.
- Never expose private environment variables to the client.

## Before Making Changes

1. Inspect the existing codebase.
2. Understand the current architecture.
3. Reuse existing patterns and components.
4. Make the smallest change necessary.
5. Check for TypeScript/lint/build errors after changes.

## Important

Do not rewrite or restructure unrelated parts of the application.

When modifying an existing feature, preserve its current behavior unless the task explicitly requires changing it.
