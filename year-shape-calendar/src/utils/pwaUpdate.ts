/**
 * PWA service-worker registration with an explicit "update available" toast.
 *
 * The app is a PWA whose service worker caches assets aggressively. With silent
 * auto-update, an already-open tab keeps serving the old bundle until a manual
 * hard reload — which is confusing ("my change isn't showing"). Instead we
 * register with `registerType: 'prompt'` and surface a toast with a Reload
 * action when a new version is ready.
 */
import { registerSW } from 'virtual:pwa-register';
import { showToast } from './toast';

export const setupPwaUpdates = (): void => {
  const updateSW = registerSW({
    onNeedRefresh() {
      showToast({
        type: 'info',
        message: 'A new version is available.',
        duration: 0, // persist until the user acts
        action: {
          label: 'Reload',
          onClick: () => updateSW(true),
        },
      });
    },
    onOfflineReady() {
      showToast({
        type: 'success',
        message: 'Ready to work offline.',
        duration: 4000,
      });
    },
  });
};
