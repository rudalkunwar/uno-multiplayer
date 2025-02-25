import moduleAlias from 'module-alias';
import path from 'path';

// Add path aliases
moduleAlias.addAliases({
  '@': path.join(__dirname, '..'),
  '@config': path.join(__dirname, '../config'),
  '@services': path.join(__dirname, '../services'),
  '@types': path.join(__dirname, '../types'),
  '@utils': path.join(__dirname, '../utils'),
});