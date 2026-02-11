# nue-lang.com

Official website implementation for Nue.

## Directory Layout

- `site/`: Astro + MDX website project (deploy this directory only).

## Local Development

```bash
cd site
npm install
npm run dev
```

## Build

```bash
cd site
npm run build
```

Theme can be selected at build time via `PUBLIC_THEME`:

```bash
cd site
PUBLIC_THEME=tuna npm run build
PUBLIC_THEME=fjord npm run build
PUBLIC_THEME=newsprint npm run build
PUBLIC_THEME=signal npm run build
```

If `PUBLIC_THEME` is omitted, `signal` is used.
