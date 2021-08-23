import { NodeResolvePlugin } from '@esbuild-plugins/node-resolve'
import { build } from 'esbuild'

build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  // splitting: true,
  // outdir: 'lib',
  sourcemap: 'external',
  outfile: 'lib/bundle.cjs.js',
  plugins: [
    NodeResolvePlugin({
      extensions: ['.ts'],
      onResolved: resolved => {
        if (
          resolved.includes('node_modules')
        ) {
          return {
            external: true,
          }
        } else {
          // console.log(resolved)
        }
        return resolved
      },
    }),
  ],
})

build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  // splitting: true,
  // outdir: 'lib',
  sourcemap: 'external',
  outfile: 'lib/bundle.esm.js',
  plugins: [
    NodeResolvePlugin({
      extensions: ['.ts'],
      onResolved: resolved => {
        if (
          resolved.includes('node_modules')
        ) {
          return {
            external: true,
          }
        } else {
          // console.log(resolved)
        }
        return resolved
      },
    }),
  ],
})