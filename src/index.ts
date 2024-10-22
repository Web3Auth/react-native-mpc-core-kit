export * from './Bridge';
import * as mpclib from './mpclib';
import { KeyType } from '@tkey/common-types';

// using tsslib V3 interface
const TssFrostLib = {
    keyType : KeyType.ed25519,
    lib: {}
}
const TssDklsLib = {
    keyType : KeyType.secp256k1,
    lib: {}
}

export { mpclib , TssDklsLib, TssFrostLib };
export default mpclib;
