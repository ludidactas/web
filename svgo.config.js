// Optimiza, limpia y estandariza un svg
// svgo source.svg -o target.svg --pretty --config svgo.config.js
// eslint-disable-next-line import/no-anonymous-default-export
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

    {
      name: 'prefixIds',
      params: {
        prefix: (_, { path }) => {

          // Usamos el nombre del archivo como prefijoID
          const fileName = path.split('/').pop().replace(/\.[^/.]+$/, '');
          return `svg-${fileName}`;
        },
        delim: '-', 
        prefixIds: true,
      },
    },
   
  ],
}
