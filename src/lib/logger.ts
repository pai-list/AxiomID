const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';

export const logger = {
  error: (...args: unknown[]) => {
    if (!isTest) {
      console.error(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (!isTest && !isProd) {
      console.info(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (!isTest) {
      console.warn(...args);
    }
  }
};
