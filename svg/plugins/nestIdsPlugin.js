/**
 * Plugin de SVGO para jerarquizar ids. <g id="uno"><g id="dos"/></g/> 
 * se convierte en <g id="uno"><g id="uno.dos"/></g/>
 * Usado en svgo.config.js. Útil para evitar colisiones de IDs en SVGs anidados.
 */
const nestIdsPlugin = {
  name: 'nestIds',
  description: 'Anida IDs en SVGs para evitar colisiones, separando los niveles con `.`',
  fn: () => {
    // Track the current ID path as we traverse the tree
    const idPath = [];
    
    return {
      element: {
        enter: (node) => {
          
          // Check if the node has an ID attribute
          const idAttr = node.attributes.id;
          
          if (idAttr) {
            console.log(`Entrando en node: ${idAttr}, stack es ${idPath}`);
            // Store the original ID
            const originalId = idAttr;
            
            // If we have a parent ID path, create a nested ID
            if (idPath.length > 0) {
              // Create the fully qualified ID by joining parent path with current ID
              const nestedId = [...idPath, originalId].join('.');
              // Update the node's ID attribute
              node.attributes.id = nestedId;
            }
            
            // Add this ID to the path for child elements
            idPath.push(originalId);
            
            // Store the original ID to restore it when exiting
            node._originalId = originalId;
          }
        },
        exit: (node) => {
          // If this node had an ID, remove it from the path when exiting
          if (node._originalId) {
            idPath.pop();
            // Clean up our temporary property
            delete node._originalId;
          }
        }
      }
    };
  }
};

// Export as CommonJS module
module.exports = { nestIdsPlugin };