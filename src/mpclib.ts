import { BNString, KeyType, Point } from "@tkey/common-types";
import { generatePrivate } from "@toruslabs/eccrypto";
import {
  COREKIT_STATUS,
  CoreKitSigner,
  CreateFactorParams,
  EnableMFAParams,
  IFactorKey,
  InitParams,
  JWTLoginParams,
  MPCKeyDetails,
  OAuthLoginParams,
  UserInfo,
  Web3AuthOptions,
  Web3AuthState,
} from "@web3auth/mpc-core-kit";
import BN from "bn.js";

import { bridgeEmit, rejectMap, resolveMap, storageMap } from "./Bridge";
import { BrigeToWebViewMessageType, copyBuffer, CoreKitAction } from "./common";
import { ICoreKitRN } from "./interfaces";

export async function createInstance(options: Web3AuthOptions): Promise<string> {
  const ruid = generatePrivate().toString("hex");

  storageMap[ruid] = options.storage;

  const action = CoreKitAction.createInstance;
  bridgeEmit({
    type: BrigeToWebViewMessageType.CoreKitRequest,
    data: { ruid, action, payload: { options } },
  });

  await new Promise((resolve, reject) => {
    resolveMap.set(ruid + action, resolve);
    rejectMap.set(ruid + action, reject);
  });
  return ruid;
}

const genericCoreKitRequestWrapper = async <P, T>(action: CoreKitAction, payload: P): Promise<T> => {
  const ruid = generatePrivate().toString("hex");
  bridgeEmit({
    type: BrigeToWebViewMessageType.CoreKitRequest,
    data: { ruid, action, payload },
  });
  const result = await new Promise((resolve, reject) => {
    resolveMap.set(ruid + action, resolve);
    rejectMap.set(ruid + action, reject);
  });
  return result as T;
};

// TODO fix ICoreKit to not include variable
export class Web3AuthMPCCoreKitRN implements ICoreKitRN, CoreKitSigner {
  options: Web3AuthOptions;

  keyType: KeyType;

  public state: Web3AuthState = { accountIndex: 0 };

  private ruid?: string;

  private _status: COREKIT_STATUS;

  constructor(options: Web3AuthOptions) {
    if (!options.web3AuthClientId) {
      // TODO: use CoreKitError class once its exported from @web3auth/mpc-core-kit
      throw new Error("web3AuthClientId is required");
    }
    if (options.uxMode) {
      if (options.uxMode !== "react-native") {
        throw new Error("Only react-native mode is supported");
      }
    }
    options.uxMode = "react-native";
    this.options = options;
    this.keyType = options.tssLib.keyType as KeyType;
    this._status = COREKIT_STATUS.NOT_INITIALIZED;
    this.ruid = undefined;
  }

  /**
   * Gets the current status of the CoreKit.
   *
   * @returns A string corresponding to the current status of the CoreKit.
   *          The status can be one of: NOT_INITIALIZED, INITIALIZED, LOGGED_IN, REQUIRED_SHARE, RECOVERY_REQUIRED
   */
  get status(): COREKIT_STATUS {
    return this._status;
  }

  get signatures(): string[] {
    return this.state?.signatures ? this.state.signatures : [];
  }

  get supportsAccountIndex(): boolean {
    return this.keyType !== KeyType.ed25519;
  }

  public async genericRequestWithStateUpdate<P, T>(action: CoreKitAction, payload: P): Promise<T> {
    if (!this.ruid) {
      throw new Error("Please initialize the sdk first using init function");
    }
    const overloadPayload = { ...payload, instanceId: this.ruid };
    const result: { result: T; status: COREKIT_STATUS; state: Omit<Web3AuthState, "factorKey"> & { factorKey: string | undefined } } =
      await genericCoreKitRequestWrapper(action, overloadPayload);
    this.state = { ...result.state, factorKey: result.state.factorKey ? new BN(result.state.factorKey, "hex") : undefined };
    this._status = result.status;
    return result.result;
  }

  public async init(params: InitParams = { handleRedirectResult: true }): Promise<void> {
    if (!this.ruid) {
      const ruid = await createInstance(this.options);
      this.ruid = ruid;
    }
    return this.genericRequestWithStateUpdate(CoreKitAction.Init, { params });
  }

  public async loginWithOAuth(_loginParams: OAuthLoginParams): Promise<void> {
    throw new Error("Method is not supported for React Native");
  }

  public async loginWithJWT(jwt: JWTLoginParams): Promise<void> {
    return this.genericRequestWithStateUpdate(CoreKitAction.loginWithJWT, { jwt });
  }

  // Signer interface
  async sign(data: Buffer, hashed?: boolean): Promise<Buffer> {
    const buf: Buffer = await this.genericRequestWithStateUpdate(CoreKitAction.sign, { data, hashed });
    return copyBuffer(buf);
  }

  public async inputFactorKey(factorKey: BN): Promise<void> {
    return this.genericRequestWithStateUpdate(CoreKitAction.inputFactorKey, { factorKey: factorKey.toString("hex") });
  }

  public async createFactor(createFactorParams: CreateFactorParams): Promise<string> {
    return this.genericRequestWithStateUpdate(CoreKitAction.createFactor, {
      createFactorParams: {
        ...createFactorParams,
        factorKey: createFactorParams.factorKey?.toString("hex"),
      },
    });
  }

  public async deleteFactor(factorPub: Point, factorKey?: BNString): Promise<void> {
    return this.genericRequestWithStateUpdate(CoreKitAction.deleteFactor, { factorPub: factorPub.toJSON(), factorKey: factorKey?.toString("hex") });
  }

  public async enableMFA(enableMFAParams: EnableMFAParams, recoveryFactor = true): Promise<string> {
    return this.genericRequestWithStateUpdate(CoreKitAction.enableMFA, {
      enableMFAParams: {
        ...enableMFAParams,
        factorKey: enableMFAParams.factorKey?.toString("hex"),
      },
      recoveryFactor,
    });
  }

  public async commitChanges(): Promise<void> {
    return this.genericRequestWithStateUpdate(CoreKitAction.commitChanges, {});
  }

  public async logout(): Promise<void> {
    await this.genericRequestWithStateUpdate(CoreKitAction.logout, {});
    this.ruid = undefined;
    await this.init();
  }

  public getCurrentFactorKey(): IFactorKey {
    if (!this.state.factorKey || !this.state.tssShareIndex) {
      throw new Error("Factor key not available");
    }
    return {
      factorKey: this.state.factorKey,
      shareType: this.state.tssShareIndex,
    };
  }

  public getUserInfo(): UserInfo {
    if (!this.state.userInfo) {
      throw new Error("userInfo not set, please login first");
    }
    return this.state.userInfo;
  }

  /**
   * WARNING: Use with caution. This will export the private signing key.
   *
   * Exports the private key scalar for the current account index.
   *
   * For keytype ed25519, consider using _UNSAFE_exportTssEd25519Seed.
   */
  public async _UNSAFE_exportTssKey(): Promise<string> {
    return this.genericRequestWithStateUpdate(CoreKitAction._UNSAFE_exportTssKey, {});
  }

  /**
   * Exports the TSS Ed25519 seed, if available.
   * This is a sensitive operation and should not be used in production.
   * @returns The Ed25519 seed as a Buffer.
   */
  public async _UNSAFE_exportTssEd25519Seed(): Promise<Buffer> {
    const buf: Buffer = await this.genericRequestWithStateUpdate(CoreKitAction._UNSAFE_exportTssEd25519Seed, {});
    return copyBuffer(buf);
  }

  public async _UNSAFE_recoverTssKey(factorKeys: string[]): Promise<string> {
    const result = await this.genericRequestWithStateUpdate(CoreKitAction._UNSAFE_recoverTssKey, { factorKeys });
    return result as string;
  }

  public async getDeviceFactor(): Promise<string> {
    return this.genericRequestWithStateUpdate(CoreKitAction.getDeviceFactor, {});
  }

  public async setDeviceFactor(factorKey: BN, replace = false): Promise<void> {
    return this.genericRequestWithStateUpdate(CoreKitAction.setDeviceFactor, { factorKey, replace });
  }

  public async setManualSync(manualSync: boolean): Promise<void> {
    return this.genericRequestWithStateUpdate(CoreKitAction.setManualSync, { manualSync });
  }

  // sycn func to async func as bridging is via async
  public async setTssWalletIndex(accountIndex: number): Promise<void> {
    return this.genericRequestWithStateUpdate(CoreKitAction.setTssWalletIndex, { accountIndex });
  }

  public async getTssFactorPub(): Promise<string[]> {
    return this.genericRequestWithStateUpdate(CoreKitAction.getTssFactorPub, {});
  }

  public async getKeyDetails(): Promise<MPCKeyDetails> {
    return this.genericRequestWithStateUpdate(CoreKitAction.getKeyDetails, {});
  }

  public async _UNSAFE_resetAccount(): Promise<void> {
    await this.genericRequestWithStateUpdate(CoreKitAction._UNSAFE_resetAccount, {});
    await this.logout();
  }

  /**
   * Get public key in ed25519 format.
   *
   * Throws an error if keytype is not compatible with ed25519.
   */
  public async getPubKeyEd25519(): Promise<Buffer> {
    return this.genericRequestWithStateUpdate(CoreKitAction.getPubKeyEd25519, {});
  }

  /**
   * @returns public key point for secp256k1 key type
   */
  public async getPubKeyPoint(): Promise<Point> {
    return this.genericRequestWithStateUpdate(CoreKitAction.getPubKeyPoint, {});
  }

  /**
   *
   * @returns pub key for secp256k1 key type
   */
  public async getPubKeySync(): Promise<Buffer> {
    return this.genericRequestWithStateUpdate(CoreKitAction.getPubKey, {});
  }

  /**
   *
   * @returns pub key for secp256k1 key type
   */
  public getPubKey(): Buffer {
    if (!this.state.tssPubKey) {
      throw new Error("tssPubKey not set, please login first");
    }
    return copyBuffer(this.state.tssPubKey);
  }
}
