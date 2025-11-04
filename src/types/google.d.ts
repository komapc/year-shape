/**
 * TypeScript declarations for Google APIs
 */

// Google Identity Services types
declare global {
  interface Window {
    gapi: typeof gapi;
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: google.accounts.oauth2.InitTokenClientConfig) => google.accounts.oauth2.TokenClient;
          revoke: (accessToken: string) => void;
        };
      };
    };
  }

  namespace google {
    namespace accounts {
      namespace oauth2 {
        interface TokenClient {
          callback: (response: TokenResponse) => void;
          requestAccessToken: (options?: { prompt?: string }) => void;
        }

        interface TokenResponse {
          access_token: string;
          error?: string;
          expires_in?: number;
          token_type?: string;
          scope?: string;
        }

        interface InitTokenClientConfig {
          client_id: string;
          scope: string;
          callback: string | ((response: TokenResponse) => void);
        }

        function initTokenClient(config: InitTokenClientConfig): TokenClient;
        function revoke(accessToken: string): void;
      }
    }
  }
}

export {};

