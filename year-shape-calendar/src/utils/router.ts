/**
 * Simple hash-based router for single page app navigation
 */

export interface Route {
  path: string;
  handler: (params?: Record<string, string>) => void;
}

class HashRouter {
  private routes: Map<string, Route> = new Map();
  private notFoundHandler?: () => void;

  constructor() {
    this.attachListeners();
  }

  /**
   * Register a route
   * @param path - Route pattern (e.g., 'settings', 'week/:id', 'year/:year')
   * @param handler - Function to call when route matches
   */
  register = (path: string, handler: (params?: Record<string, string>) => void): void => {
    this.routes.set(path, { path, handler });
  };

  /**
   * Set handler for 404/not found
   */
  onNotFound = (handler: () => void): void => {
    this.notFoundHandler = handler;
  };

  /**
   * Navigate to a route
   */
  navigate = (path: string): void => {
    window.location.hash = path;
  };

  /**
   * Get current route path
   */
  getCurrentPath = (): string => {
    return window.location.hash.slice(1) || '';
  };

  /**
   * Parse route and extract parameters
   */
  private parseRoute = (hash: string): { route: Route; params: Record<string, string> } | null => {
    const path = hash.slice(1) || ''; // Remove #

    // Try exact match first
    const exactRoute = this.routes.get(path);
    if (exactRoute) {
      return { route: exactRoute, params: {} };
    }

    // Try parameterized routes
    for (const [pattern, route] of this.routes.entries()) {
      const regex = this.patternToRegex(pattern);
      const match = path.match(regex);
      
      if (match) {
        const params = this.extractParams(pattern, path);
        return { route, params };
      }
    }

    return null;
  };

  /**
   * Convert route pattern to regex
   */
  private patternToRegex = (pattern: string): RegExp => {
    const regexPattern = pattern.replace(/:(\w+)/g, '([^/]+)');
    return new RegExp(`^${regexPattern}$`);
  };

  /**
   * Extract parameters from path
   */
  private extractParams = (pattern: string, path: string): Record<string, string> => {
    const params: Record<string, string> = {};
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    patternParts.forEach((part, index) => {
      if (part.startsWith(':')) {
        const paramName = part.slice(1);
        params[paramName] = pathParts[index];
      }
    });

    return params;
  };

  /**
   * Handle hash change
   */
  private handleHashChange = (): void => {
    const hash = window.location.hash;
    const result = this.parseRoute(hash);

    if (result) {
      result.route.handler(result.params);
    } else if (hash && this.notFoundHandler) {
      this.notFoundHandler();
    }
  };

  /**
   * Attach event listeners
   */
  private attachListeners = (): void => {
    window.addEventListener('hashchange', this.handleHashChange);
    window.addEventListener('load', this.handleHashChange);
  };

  /**
   * Remove event listeners
   */
  destroy = (): void => {
    window.removeEventListener('hashchange', this.handleHashChange);
    window.removeEventListener('load', this.handleHashChange);
    this.routes.clear();
  };
}

// Singleton instance
export const router = new HashRouter();

