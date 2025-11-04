/**
 * Environment detection utility for logger
 * This module isolates import.meta usage for easier mocking in tests
 */

export const getEnvironment = () => {
  // In test environment, use NODE_ENV
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return {
      isProd: false,
      isDev: true,
    };
  }
  
  // In Vite/browser environment
  return {
    isProd: import.meta.env.PROD,
    isDev: import.meta.env.DEV,
  };
};
