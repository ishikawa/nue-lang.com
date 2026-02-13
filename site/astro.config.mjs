import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";

const rawBase = process.env.PUBLIC_SITE_BASE || "/";
const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;

export default defineConfig({
  output: "static",
  base,
  integrations: [mdx(), react()]
});
