import { BNString, Point } from "@tkey/common-types";
import { ICoreKit, JWTLoginParams, MPCKeyDetails } from "@web3auth/mpc-core-kit";

export interface ICoreKitRN extends Omit<ICoreKit, "getKeyDetails" | "tKey" | "sessionId" | "deleteFactor"> {
  /**
   * Get information about how the keys of the user is managed according to the information in the metadata server.
   */
  getKeyDetails(): Promise<MPCKeyDetails>;
  deleteFactor(factorPub: Point, factorKey?: BNString): Promise<void>;
}

export type { JWTLoginParams };
