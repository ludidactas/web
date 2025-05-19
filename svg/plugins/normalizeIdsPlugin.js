// svg/normalizeIdsPlugin.js

/**
 * SVGO plugin that normalizes IDs by removing numeric suffixes
 * For example: "activo1" -> "activo", "inactivo2" -> "inactivo"
 */
const normalizeIdsPlugin = {
  name: 'normalizeIds',
  description: 'Normalizes IDs by removing numeric suffixes',
  fn: () => {
    // Helper que remueve los números al final de un id
    const normalizeId = (id) => {
      return id.replace(/(\D+)(\d+)$/, '$1');
    };
    
    return {
      element: {
        enter: (node) => {
          // Agarramos el id
          const id = node.attributes.id;
          // Omitimos los ids que empiezan con el prefijo que affinity usa para linkear reglas `use` con imágenes,
          // al resto le quitamos los números al final ya que a continuación los vamos a calificar
          if (id && !(id.startsWith('_'))) node.attributes.id = normalizeId(id)
        }
      }
    };
  }
};

// Export as CommonJS module
module.exports = { normalizeIdsPlugin };