import path from 'path';

export default {
  test: {
    environment: 'node',
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
};
