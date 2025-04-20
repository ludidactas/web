// Optimiza, limpia y estandariza un svg
// svgo source.svg -o target.svg --pretty --config svgo.config.js
export default {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // disable a default plugin
          cleanupIds: false,
        },
      },
    },
  ],
}
