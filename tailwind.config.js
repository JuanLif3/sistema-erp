const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Escanea los archivos dentro de tu frontend
    join(__dirname, 'apps/frontend/**/*!(*.stories|*.spec).{ts,tsx,html}'),
    
    // (Opcional) Escanea librerías compartidas si creas alguna en el futuro
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};