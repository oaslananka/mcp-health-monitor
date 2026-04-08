# Contributing

## Setup

```bash
npm install
npm run build
npm test
npm run test:integration
```

## Standards

- TypeScript strict mode is required
- Do not use `any` in `src/`
- Add or update tests for every new tool or behavior change
- Update `CHANGELOG.md` for user-visible changes
- Run `npm run ci:check` before opening a PR

## Commit Convention

Examples:

- `feat(report): add markdown health report tool`
- `fix(registry): remove dashboard N+1 queries`
- `docs: clarify PAT storage behavior`
- `chore(ci): switch pipelines to npm ci`

## PR Checklist

- [ ] `npm run ci:check` passes
- [ ] New tests were added or existing tests were updated
- [ ] `CHANGELOG.md` was updated for notable changes
- [ ] `README.md` was updated if a tool API or runtime workflow changed
