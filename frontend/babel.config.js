module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    // Strips TypeScript syntax so Jest can run .ts/.tsx files without tsc.
    ['@babel/preset-typescript'],
  ],
  plugins: ['babel-plugin-transform-import-meta'],
};
