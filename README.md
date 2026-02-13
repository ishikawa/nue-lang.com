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

## Home Playground Embed

Home embeds the WASM playground as an Astro React island.
The required runtime files are committed in this repository, so deployment does
not depend on `$HOME/Developer/Workspace/nue/web`.

- Runtime module default: `/pkg/nue_wasm.js` (bundled in `site/public/pkg`)
- Override at build/dev time with `PUBLIC_PLAYGROUND_WASM_MODULE_URL`

```bash
cd site
PUBLIC_PLAYGROUND_WASM_MODULE_URL=http://localhost:4173/pkg/nue_wasm.js npm run dev
PUBLIC_PLAYGROUND_WASM_MODULE_URL=https://playground.example.com/pkg/nue_wasm.js npm run build
```
