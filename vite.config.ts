import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

/*
 * Nitro is what makes this deployable as a real server rather than a folder of
 * files. Start emits dist/client + dist/server; Nitro takes that and builds
 * the host's own format — on Vercel, .vercel/output, which is what gets picked
 * up as a Function. Without it a host sees a plain Vite build, looks for an
 * index.html at the output root, and finds nothing.
 */
const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [devtools(), tailwindcss(), tanstackStart(), nitro(), viteReact()],
})

export default config
