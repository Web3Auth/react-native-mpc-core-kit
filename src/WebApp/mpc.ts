import { Point } from "@tkey/common-types";
import { Web3AuthMPCCoreKit, Web3AuthState } from "@web3auth/mpc-core-kit";
import { BN } from "bn.js";

import { copyBuffer, CoreKitAction, MessageRequest, MessageResponse } from "../common";

function getPostMessageCoreKitState(corekitInstance: Web3AuthMPCCoreKit): Omit<Web3AuthState, "factorKey"> & { factorKey: string | undefined } {
  return { ...corekitInstance.state, factorKey: corekitInstance.state.factorKey?.toString("hex") };
}

export async function handleMPCCoreKitRequest(data: MessageRequest, corekitInstance: Web3AuthMPCCoreKit): Promise<MessageResponse> {
  const { action, payload, ruid } = data as MessageRequest;

  if (action === CoreKitAction.sign) {
    const { data: msgData, hashed } = payload;
    const result = await corekitInstance.sign(copyBuffer(msgData), hashed);
    return { ruid, action, result: { result, status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }
  if (action === CoreKitAction.Init) {
    await corekitInstance.init();
    return { ruid, action, result: { status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }
  if (action === CoreKitAction.loginWithJWT) {
    const { jwt } = payload;
    await corekitInstance.loginWithJWT(jwt);
    return { ruid, action, result: { status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }
  if (action === CoreKitAction.inputFactorKey) {
    const { factorKey } = payload;
    await corekitInstance.inputFactorKey(new BN(factorKey, "hex"));
    return { ruid, action, result: { status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }
  if (action === CoreKitAction.createFactor) {
    const { createFactorParams } = payload;
    const result = await corekitInstance.createFactor({
      ...createFactorParams,
      factorKey: createFactorParams.factorKey ? new BN(createFactorParams.factorKey, "hex") : undefined,
    });
    return { ruid, action, result: { result, status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }
  if (action === CoreKitAction.deleteFactor) {
    const { factorPub, factorKey } = payload;

    await corekitInstance.deleteFactor(Point.fromJSON(factorPub), factorKey ? new BN(factorKey, "hex") : undefined);
    return { ruid, action, result: { status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }
  if (action === CoreKitAction.enableMFA) {
    const { enableMFAParams, recoveryFactor } = payload;
    const result = await corekitInstance.enableMFA(
      {
        ...enableMFAParams,
        factorKey: enableMFAParams.factorKey ? new BN(enableMFAParams.factorKey, "hex") : undefined,
      },
      recoveryFactor
    );
    return { ruid, action, result: { result, status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }
  if (action === CoreKitAction.commitChanges) {
    await corekitInstance.commitChanges();
    return { ruid, action, result: { status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }
  if (action === CoreKitAction.logout) {
    await corekitInstance.logout();
    return { ruid, action, result: { status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }

  if (action === CoreKitAction._UNSAFE_exportTssKey) {
    const result = await corekitInstance._UNSAFE_exportTssKey();
    return { ruid, action, result: { result, status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }

  if (action === CoreKitAction._UNSAFE_exportTssEd25519Seed) {
    const result = await corekitInstance._UNSAFE_exportTssEd25519Seed();
    return { ruid, action, result: { result, status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }

  if (action === CoreKitAction._UNSAFE_resetAccount) {
    await corekitInstance.tKey.storageLayer.setMetadata({
      privKey: new BN(corekitInstance.state.postBoxKey!, "hex"),
      input: { message: "KEY_NOT_FOUND" },
    });
    return { ruid, action, result: { status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }

  if (action === CoreKitAction.getDeviceFactor) {
    const result = await corekitInstance.getDeviceFactor();
    return { ruid, action, result: { result, status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }
  if (action === CoreKitAction.setDeviceFactor) {
    const { factorKey, replace } = payload;
    await corekitInstance.setDeviceFactor(factorKey, replace);
    return { ruid, action, result: { status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }

  if (action === CoreKitAction.setManualSync) {
    const { manualSync } = payload;
    const result = await corekitInstance.setManualSync(manualSync);
    return { ruid, action, result: { result, status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }
  if (action === CoreKitAction.setTssWalletIndex) {
    const { accountIndex } = payload;
    corekitInstance.setTssWalletIndex(accountIndex);
    return { ruid, action, result: { status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }
  if (action === CoreKitAction.getTssFactorPub) {
    const result = corekitInstance.getTssFactorPub();
    return { ruid, action, result: { result, status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }
  if (action === CoreKitAction.getKeyDetails) {
    const result = corekitInstance.getKeyDetails();
    return { ruid, action, result: { result, status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }

  if (action === CoreKitAction.getPubKeyPoint) {
    const result = corekitInstance.getPubKeyPoint();
    return { ruid, action, result: { result, status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }
  if (action === CoreKitAction.getPubKey) {
    const result = corekitInstance.getPubKey();
    return { ruid, action, result: { result, status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }

  if (action === CoreKitAction.getPubKeyEd25519) {
    const result = corekitInstance.getPubKeyEd25519();
    return { ruid, action, result: { result, status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }

  if (action === CoreKitAction._UNSAFE_recoverTssKey) {
    const { factorKeys } = payload as { factorKeys: string[] };
    const result = await corekitInstance._UNSAFE_recoverTssKey(factorKeys);
    return { ruid, action, result: { result, status: corekitInstance.status, state: getPostMessageCoreKitState(corekitInstance) } };
  }

  throw new Error("unknown action");
  // return { ruid, action, result: 'unknown action', error: 'unknown action' };
}
