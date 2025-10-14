/**
 * Application Constants
 */

// Default Routes
export const DEFAULT_ROUTES = {
  /** Default token address for redirects */
  DEFAULT_PAIR: '0x299270c5d97c23b2a5d4c8e045ef8682197b8fc0',
  /** Default token route path */
  DEFAULT_PAIR_PATH: '/token/0x299270c5d97c23b2a5d4c8e045ef8682197b8fc0',
  DEFAULT_AUTHENTICATION: 'authentication'
} as const;

// Export individual constants for convenience
export const DEFAULT_PAIR_ADDRESS = DEFAULT_ROUTES.DEFAULT_PAIR;
export const DEFAULT_PAIR_ROUTE = DEFAULT_ROUTES.DEFAULT_PAIR_PATH;
export const DEFAULT_AUTHENTICATION = DEFAULT_ROUTES.DEFAULT_AUTHENTICATION;
