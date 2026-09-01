# Repository Guidelines

## Project Structure & Module Organization

- `mds/` is the source knowledge base: Markdown interview questions grouped by topic, plus `mds/index.md` and progress metadata. Preserve the existing Chinese category and file names when editing content.
- `web/` contains the Vite + React + TypeScript learning app. UI components are in `web/src/components/`, hooks in `web/src/hooks/`, Zustand state in `web/src/stores/`, and global styles in `web/src/styles/`.
- `web/scripts/build-data.js` converts `mds/` Markdown into JSON indexes and per-category content. Generated data is written under `web/src/data/` and `web/public/data/`; update the source Markdown and regenerate it rather than hand-editing generated JSON.
- Static assets and PWA files belong in `web/public/`. Follow the design tokens documented in `DESIGN.md` and implemented in `web/tailwind.config.js`.

## Build, Test, and Development Commands

Run frontend commands from `web/`:

```bash
npm install             # Install dependencies
npm run dev             # Start Vite at http://localhost:5173
npm run build           # Regenerate data, type-check, and create dist/
npm run build:data      # Regenerate JSON only after mds/ changes
npm run preview         # Preview the production build
```

There is currently no automated test or lint script. Run `npm run build` before submitting frontend changes; manually check search, category loading, question navigation, theme switching, and responsive layouts when relevant.

## Coding Style & Naming Conventions

Use four-space indentation in TypeScript/TSX and JavaScript, semicolons, and single quotes where consistent with nearby code. Name React components in PascalCase (`QuestionDetail.tsx`), hooks with a `use` prefix, and functions/variables in camelCase. Keep content headings and Markdown code examples clear and technically accurate. Use Tailwind classes and existing design tokens before adding new global CSS.

## Testing Guidelines

No test framework or coverage threshold is configured. For data changes, run `npm run build:data` and inspect the affected generated category/search entries. For UI changes, run the production build and verify the affected route in the browser.

## Commit & Pull Request Guidelines

Use short, imperative commit subjects with a prefix, for example `feat: add random quiz` or `chore: update generated data`. Pull requests should explain the user-visible change, identify content or generated-data updates, include validation commands run, and attach screenshots for visual changes. Keep generated JSON synchronized with Markdown source changes.
