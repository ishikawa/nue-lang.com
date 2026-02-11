# Nue Website (`site/`)

This is the deployable Astro + MDX project for the Nue official website.

## Run locally

```bash
npm install
npm run dev
```

## Build for deployment

```bash
npm run build
```

### Build with theme

Set `PUBLIC_THEME` at build time.

```bash
PUBLIC_THEME=tuna npm run build
PUBLIC_THEME=fjord npm run build
PUBLIC_THEME=newsprint npm run build
PUBLIC_THEME=signal npm run build
```

If omitted, `signal` is used.

When deploying (for example to GitHub Pages), publish this `site/` directory only.
