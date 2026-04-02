# Assistudio Vigevano — Insurance Agency Platform

Insurance agency management platform for Assistudio Vigevano, a multi-mandate insurance agency based in Vigevano, Italy (est. 1986).

## Prerequisites

- Node.js >= 20.x
- npm >= 10.x

## Setup

```bash
npm install
```

## Development

```bash
npm run dev       # run with ts-node
npm run build     # compile TypeScript → dist/
npm start         # run compiled output
```

## Code Quality

```bash
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier format
npm run format:check  # Prettier check (used in CI)
npm run typecheck     # TypeScript type check (no emit)
```

## Testing

```bash
npm test                # run all tests
npm run test:watch      # watch mode
npm run test:coverage   # coverage report (threshold: 70%)
```

Coverage reports are written to `coverage/`.

## CI/CD

GitHub Actions workflow at `.github/workflows/ci.yml` runs on every push and PR to `main`/`develop`:

1. **Format check** — Prettier
2. **Lint** — ESLint with TypeScript rules
3. **Type check** — `tsc --noEmit`
4. **Tests + Coverage** — Jest with coverage thresholds

## Project Structure

```
src/
  __tests__/      # test files
  index.ts        # application entry point
.github/
  workflows/
    ci.yml        # CI pipeline
.eslintrc.js      # ESLint config
.prettierrc       # Prettier config
jest.config.js    # Jest config
tsconfig.json     # TypeScript config
```

## Contributing

- Branch from `develop`, target `develop` with PRs
- All CI checks must pass before merge
- Coverage must not drop below 70%
