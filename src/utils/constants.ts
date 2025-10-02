/**
 * Application Constants
 */

// Default Routes
export const DEFAULT_ROUTES = {
  /** Default token address for redirects */
  DEFAULT_TOKEN: '0x85Ca16Fd0e81659e0b8Be337294149E722528731',
  /** Default token route path */
  DEFAULT_TOKEN_PATH: '/token/0x85Ca16Fd0e81659e0b8Be337294149E722528731',
  DEFAULT_AUTHENTICATION: 'authentication'
} as const;

// Export individual constants for convenience
export const DEFAULT_TOKEN_ADDRESS = DEFAULT_ROUTES.DEFAULT_TOKEN;
export const DEFAULT_TOKEN_ROUTE = DEFAULT_ROUTES.DEFAULT_TOKEN_PATH;
export const DEFAULT_AUTHENTICATION = DEFAULT_ROUTES.DEFAULT_AUTHENTICATION;
