/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="gapi" />
/// <reference types="gapi.auth2" />
/// <reference types="gapi.client.calendar" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_GOOGLE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


// Side-effect CSS import (font): TS 7 checks side-effect imports and the package ships no types
declare module "@fontsource-variable/inter";
