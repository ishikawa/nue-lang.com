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

## Home Playground Embed

The Home page mounts the playground as an Astro React island.
The runtime assets are bundled in this repo, so deployment does not depend on
`$HOME/Developer/Workspace/nue/web`.

- Default runtime module URL: `/pkg/nue_wasm.js` (bundled in `public/pkg`)
- Configure with `PUBLIC_PLAYGROUND_WASM_MODULE_URL`

```bash
PUBLIC_PLAYGROUND_WASM_MODULE_URL=http://localhost:4173/pkg/nue_wasm.js npm run dev
PUBLIC_PLAYGROUND_WASM_MODULE_URL=https://playground.example.com/pkg/nue_wasm.js npm run build
```
