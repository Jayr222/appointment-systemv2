// BSON Preload Module
// This ensures BSON is loaded and available before MongoDB driver tries to use it
// This fixes the "Cannot read properties of undefined (reading 'NumberUtils')" error in Vercel

// Import BSON and ensure it's available globally if needed
import * as BSON from 'bson';

// Export BSON to ensure it's bundled
export default BSON;
export * from 'bson';

// Also assign to global if needed (for some bundlers)
if (typeof global !== 'undefined') {
  global.BSON = BSON;
}

console.log('✅ BSON preloaded successfully');

