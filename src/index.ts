// export * from "./Bridge";
import { KeyType } from "@tkey/common-types";
export { KeyType, Point, secp256k1 } from "@tkey/common-types";
export {
  COREKIT_STATUS,
  FactorKeyTypeShareDescription,
  generateFactorKey,
  keyToMnemonic,
  makeEthereumSigner,
  mnemonicToKey,
  parseToken,
  TssShareType,
  WEB3AUTH_NETWORK,
} from "@web3auth/mpc-core-kit";

import * as mpclib from "./mpclib";

// using tsslib V3 interface
const TssFrostLib = {
  keyType: KeyType.ed25519,
  lib: {},
};
const TssDklsLib = {
  keyType: KeyType.secp256k1,
  lib: {},
};

export { Bridge } from "./Bridge";
export { Web3AuthMPCCoreKitRN } from "./mpclib";
export type { JWTLoginParams } from "@web3auth/mpc-core-kit";
export { mpclib, TssDklsLib, TssFrostLib };
export default mpclib;
// IMP START - Quick Start
