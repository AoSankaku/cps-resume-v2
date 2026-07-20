/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.yaml' {
  const data: unknown
  export default data
}
