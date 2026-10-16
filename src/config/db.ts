import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { app } from './firebase';

/**
 * Firestore tuned for slow / mobile-data connections.
 *
 * - experimentalForceLongPolling: Firestore normally keeps a streaming connection open.
 *   Some mobile carriers' proxies buffer or block that stream, so the app waits forever
 *   on a spinner. Long-polling uses plain HTTP requests that get through those proxies.
 *
 * - persistentLocalCache: keeps the catalog, orders, etc. on the phone (IndexedDB).
 *   Repeat visits show data instantly from the cache, then update when the network replies,
 *   and the app still shows saved data when the connection drops.
 *   If the browser can't use IndexedDB, Firestore falls back to memory automatically.
 */
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
