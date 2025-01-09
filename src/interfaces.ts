import { ICoreKit, MPCKeyDetails } from "@web3auth/mpc-core-kit";

export interface ICoreKitRN extends Omit<ICoreKit, "getKeyDetails" | "tKey" | "sessionId"> {
  /**
   * Get information about how the keys of the user is managed according to the information in the metadata server.
   */
  getKeyDetails(): Promise<MPCKeyDetails>;
}
