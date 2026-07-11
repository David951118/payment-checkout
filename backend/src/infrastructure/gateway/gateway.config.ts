export const GATEWAY_CONFIG = Symbol('GatewayConfig');

export interface GatewayConfig {
  baseUrl: string;
  publicKey: string;
  privateKey: string;
  integritySecret: string;
}
