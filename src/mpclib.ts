import { generatePrivate } from '@toruslabs/eccrypto';
import { bridgeEmit } from './Bridge';
import { copyBuffer, CoreKitAction, CoreKitRequestType } from './common';
import { rejectMap, resolveMap, storageMap } from './Bridge';
import {   COREKIT_STATUS, CoreKitSigner, CreateFactorParams,   EnableMFAParams,    IFactorKey,   InitParams,  JWTLoginParams,  MPCKeyDetails,  OAuthLoginParams,  UserInfo,  Web3AuthOptions, Web3AuthState   } from '@web3auth/mpc-core-kit';
import { KeyType, Point } from '@tkey/common-types';
import BN from 'bn.js';

export async function createInstance( options: Web3AuthOptions): Promise<string> {
    let ruid = generatePrivate().toString('hex');

    storageMap[ruid] = options.storage;

    const action = CoreKitAction.createInstance;
    bridgeEmit({
      type: CoreKitRequestType.CoreKitRequest,
      data: { ruid, action, payload: { options } },
    });

    await new Promise((resolve, reject) => {
      resolveMap.set(ruid + action, resolve);
      rejectMap.set(ruid + action, reject);
    });
    return ruid;
}

const genericCoreKitRequestWrapper = async <P,T>(action: CoreKitAction, payload: P) : Promise<T> => {
  let ruid = generatePrivate().toString('hex');
  bridgeEmit({
    type: CoreKitRequestType.CoreKitRequest,
    data: { ruid, action, payload },
  });
  const result = await new Promise((resolve, reject) => {
    resolveMap.set(ruid + action, resolve);
    rejectMap.set(ruid + action, reject);
  });
  return result as T;
};

// TODO fix ICoreKit to not include variable
export class Web3AuthMPCCoreKitRN implements CoreKitSigner {
  options : Web3AuthOptions;

  private ruid? : string;


  private _status : COREKIT_STATUS;

  keyType: KeyType;

  public state: Web3AuthState = { accountIndex: 0 };


  /**
   * Gets the current status of the CoreKit.
   *
   * @returns A string corresponding to the current status of the CoreKit.
   *          The status can be one of: NOT_INITIALIZED, INITIALIZED, LOGGED_IN, REQUIRED_SHARE, RECOVERY_REQUIRED
   */
  get status(): COREKIT_STATUS {
    return this._status;
  }

  constructor( options: Web3AuthOptions) {
    this.options = options;
    this.keyType = options.tssLib.keyType;
    this._status = COREKIT_STATUS.NOT_INITIALIZED;
    this.ruid = undefined;
  }

  public async genericRequestWithStateUpdate <P,T>(action: CoreKitAction, payload: P) : Promise<T>{
    const result : {result : T, status: COREKIT_STATUS, state: Web3AuthState} = await genericCoreKitRequestWrapper( action, payload);
    this.state = result.state;
    this._status = result.status;
    return result.result;
  }

  // Signer interface
  async sign(data: Buffer, hashed?: boolean): Promise<Buffer> {
    const buf: Buffer = await this.genericRequestWithStateUpdate(CoreKitAction.sign, {data, hashed});
    return copyBuffer(buf);
  }

  getPubKey(): Buffer {
    if (!this.state.tssPubKey) {
      throw new Error('state.tssPubKey not set');
    }
    return copyBuffer(this.state.tssPubKey);
  }

  public async init(params?: InitParams): Promise<void> {
    console.log('init in progress', this.ruid);
    console.log('bridgeEmit', bridgeEmit);
    if (!this.ruid) {
      const ruid = await createInstance(this.options);
      this.ruid = ruid;
    }
    console.log('create done');
    return this.genericRequestWithStateUpdate(CoreKitAction.Init, {params});
  }

  public async loginWithOAuth(_loginParams: OAuthLoginParams): Promise<void> {
    throw new Error('Method is not supported for React Native');
  }

  public async loginWithJWT(jwt: JWTLoginParams): Promise<void> {
    return this.genericRequestWithStateUpdate(CoreKitAction.loginWithJWT, {jwt});
  }

  public async inputFactorKey(factorKey: import('bn.js')): Promise<void> {
    return this.genericRequestWithStateUpdate(CoreKitAction.inputFactorKey, {factorKey});
  }

  public async createFactor(createFactorParams: CreateFactorParams): Promise<string> {
    return this.genericRequestWithStateUpdate(CoreKitAction.createFactor, {createFactorParams});
  }

  public async deleteFactor(factorPub: Point): Promise<void> {
    return this.genericRequestWithStateUpdate(CoreKitAction.deleteFactor, {factorPub});
  }

  public async enableMFA(enableMFAParams: EnableMFAParams, recoveryFactor?: boolean): Promise<string> {
    return this.genericRequestWithStateUpdate(CoreKitAction.enableMFA, {enableMFAParams, recoveryFactor});
  }

  public async commitChanges(): Promise<void> {
    return this.genericRequestWithStateUpdate(CoreKitAction.commitChanges, {});
  }


  public async logout(): Promise<void> {
    return this.genericRequestWithStateUpdate(CoreKitAction.logout, {});
  }

  public getCurrentFactorKey(): IFactorKey {
    if (!this.state.factorKey || !this.state.tssShareIndex) {throw new Error('Factor key not available');}
    return {
      factorKey: this.state.factorKey,
      shareType: this.state.tssShareIndex,
    };
  }

  public getUserInfo(): UserInfo {
    if (!this.state.userInfo) { throw new Error('invalid userInfo'); }
    return this.state.userInfo;
  }

  public async _UNSAFE_exportTssKey(): Promise<string> {
    return this.genericRequestWithStateUpdate(CoreKitAction._UNSAFE_exportTssKey, {});
  }
  public async _UNSAFE_exportTssEd25519Seed(): Promise<Buffer> {
    const buf: Buffer = await this.genericRequestWithStateUpdate(CoreKitAction._UNSAFE_exportTssEd25519Seed, {});
    return copyBuffer(buf);
  }

  public async getDeviceFactor(): Promise<string> {
    return this.genericRequestWithStateUpdate(CoreKitAction.getDeviceFactor, {});
  }

  public async setDeviceFactor(factorKey: BN, replace = false): Promise<void> {
    return this.genericRequestWithStateUpdate(CoreKitAction.getDeviceFactor, { factorKey, replace});
  }

  public async setManualSync(manualSync: boolean): Promise<void> {
    return this.genericRequestWithStateUpdate(CoreKitAction.setManualSync, {manualSync});
  }

  // sycn func to async func as bridging is via async
  public async setTssWalletIndex(accountIndex: number) : Promise<void> {
    return this.genericRequestWithStateUpdate(CoreKitAction.setTssWalletIndex, {accountIndex});
  }

  public async getTssFactorPub (): Promise<string[]> {
    return this.genericRequestWithStateUpdate(CoreKitAction.getTssFactorPub, {});
  }

  public async getKeyDetails(): Promise<MPCKeyDetails> {
    return this.genericRequestWithStateUpdate(CoreKitAction.getKeyDetails, {});
  }

}
