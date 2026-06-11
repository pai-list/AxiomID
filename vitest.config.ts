import path from 'path';

const config = {
  test: {
    environment: 'node',
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
};

export default config;
