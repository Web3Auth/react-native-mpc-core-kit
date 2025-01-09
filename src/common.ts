export enum TssLibAction {
  BatchSize = "batch_size",
  RandomGenerator = "random_generator",
  RandomGeneratorFree = "random_generator_free",
  ThresholdSigner = "threshold_signer",
  ThresholdSignerFree = "threshold_signer_free",
  Setup = "setup",
  Precompute = "precompute",
  LocalSign = "local_sign",
  GetRFromPrecompute = "get_r_from_precompute",
  LocalVerify = "local_verify",
  Sign = "sign",

  JsSendMsg = "js_send_msg",
  JsReadMsg = "js_read_msg",
  JsSendMsgDone = "js_send_msg_done",
  JsReadMsgDone = "js_read_msg_done",
}

export enum BrigeToRNMessageType {
  CoreKitResponse = "coreKitResponse",
  StorageRequest = "storageRequest",
}

export enum BrigeToWebViewMessageType {
  CoreKitRequest = "coreKitRequest",
  StorageResponse = "storageRespond",
}

export type MessageResponse = {
  ruid: string;
  action: string;
  result?: any;
  error?: any;
};

export type MessageRequest = {
  ruid: string;
  action: string;
  payload: any;
};

export type LibError = {
  msg: string;
  payload: any;
  error: any;
};

export enum CoreKitAction {
  createInstance = "create_instance",
  Init = "init",
  loginWithJWT = "login_with_jwt",
  inputFactorKey = "input_factor_key",
  createFactor = "create_factor",
  deleteFactor = "delete_factor",
  enableMFA = "enable_mfa",
  commitChanges = "commit_changes",
  sign = "sign",
  logout = "logout",
  _UNSAFE_exportTssKey = "_UNSAFE_exportTssKey",
  _UNSAFE_exportTssEd25519Seed = "_UNSAFE_exportTssEd25519Seed",
  _UNSAFE_resetAccount = "_UNSAFE_resetAccount",
  getCurrentFactorKey = "get_current_factor_key",
  getUserInfo = "get_user_info",
  getKeyDetails = "get_key_details",
  getDeviceFactor = "get_device_factor",
  setDeviceFactor = "set_device_factor",

  setManualSync = "set_manual_sync",
  setTssWalletIndex = "set_tss_wallet_index",
  getTssFactorPub = "get_tss_factor_pub",

  getPubKeyEd25519 = "get_pub_key_ed25519",
  getPubKeyPoint = "get_pub_key_point",
  getPubKey = "get_pub_key",
}

export enum StorageAction {
  setItem = "setItem",
  getItem = "getItem",
}

// data from bridge could not retain Buffer object.
// try via copy Buffer
export const copyBuffer = (oriBuf: Buffer) => {
  const json = JSON.stringify(oriBuf);
  const copy = JSON.parse(json, (_key, value) => {
    return value.type === "Buffer" ? Buffer.from(value) : value;
  });
  return copy;
};
