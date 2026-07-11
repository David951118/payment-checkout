/**
 * Copy this file to `env.ts` (gitignored) and fill in your values.
 * The mobile app only ever knows the gateway PUBLIC key and the backend URL —
 * private keys and integrity secrets live exclusively in the backend.
 */
export const ENV = {
  /** Backend base URL. Android emulator reaches the host via 10.0.2.2. */
  BACKEND_URL: 'http://10.0.2.2:3000',
  /** Payment gateway sandbox base URL (public, used only for card tokenization). */
  GATEWAY_BASE_URL: 'https://sandbox-api.example.dev/v1',
  /** Gateway PUBLIC key (safe on-device by design). */
  GATEWAY_PUBLIC_KEY: 'pub_stagtest_xxxxxxxxxxxxxxxxxxxxxxxx',
  /**
   * Key for the AES redux-persist transform.
   * Trade-off (noted): a bundled static key obfuscates data at rest but is not
   * hardware-backed; production would derive it from the OS keystore.
   */
  PERSIST_ENCRYPTION_KEY: 'replace-with-a-long-random-string',
};

export type Env = typeof ENV;
