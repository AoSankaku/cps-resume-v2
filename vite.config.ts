import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { parse } from 'yaml'

const yamlData = (): Plugin => ({
  name: 'yaml-data',
  enforce: 'pre',
  transform(source, id) {
    const fileName = id.split('?', 1)[0]
    if (!fileName || !/\.ya?ml$/i.test(fileName)) return null
    const data = parse(source)
    return { code: `export default ${JSON.stringify(data)};`, map: null }
  },
})

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [yamlData(), react()],
  server: {
    port: 35173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
