// svg/normalizeIdsPlugin.js

/**
 * Plugin de SVGO para normalizar ids. "activo1" -> "activo"
 * "inactivo2" -> "inactivo", etc.
 * Usado en svgo.config.js en combinación con jerarquización
 * para tener ids únicos y predecibles
 */
const normalizeIdsPlugin = {
  name: 'normalizeIds',
  description: 'Normaliza ids removiendo sufijos numéricos, excepto aquellos que empiezan con `_`',
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