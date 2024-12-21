import { Web3AuthMPCCoreKit } from '@web3auth/mpc-core-kit';
import { copyBuffer, CoreKitAction, MessageRequest, MessageResponse } from '../common';
import { BN } from 'bn.js';



export async function handleMPCCoreKitRequest(
    data: MessageRequest,
    corekitInstance: Web3AuthMPCCoreKit,
  ): Promise<MessageResponse> {
    const { action, payload, ruid } = data as MessageRequest;

    if (action === CoreKitAction.sign) {
      const { data : msgData, hashed } = payload;
      const result = await corekitInstance.sign(copyBuffer(msgData), hashed);
      return { ruid, action, result: { result,  status: corekitInstance.status , state: corekitInstance.state} };
    }
    if (action === CoreKitAction.Init) {
      await corekitInstance.init();
      return { ruid, action, result: { status: corekitInstance.status , state: corekitInstance.state} };
    }
    if (action === CoreKitAction.loginWithJWT) {
      const { jwt } = payload;
      await corekitInstance.loginWithJWT(jwt);
      return { ruid, action, result: { status: corekitInstance.status , state: corekitInstance.state} };
    }
    if (action === CoreKitAction.inputFactorKey) {
      const { factorKey } = payload;
      await corekitInstance.inputFactorKey(factorKey);
      return { ruid, action, result: { status: corekitInstance.status , state: corekitInstance.state} };
    }
    if (action === CoreKitAction.createFactor) {
      const { createFactorParams } = payload;
      const result = await corekitInstance.createFactor({
        ...createFactorParams
      });
      return { ruid, action, result : { result , status: corekitInstance.status , state: corekitInstance.state} };
    }
    if (action === CoreKitAction.deleteFactor) {
      const { factorPub, factorKey } = payload;
      await corekitInstance.deleteFactor(factorPub, factorKey);
      return { ruid, action, result: { status: corekitInstance.status , state: corekitInstance.state} };
    }
    if (action === CoreKitAction.enableMFA) {
      const { enableMFAParams, recoveryFactor } = payload;
      const result = await corekitInstance.enableMFA(enableMFAParams, recoveryFactor);
      return { ruid, action, result: { result,  status: corekitInstance.status , state: corekitInstance.state} };
    }
    if (action === CoreKitAction.commitChanges) {
      await corekitInstance.commitChanges();
      return { ruid, action, result: { status: corekitInstance.status , state: corekitInstance.state} };
    }
    if (action === CoreKitAction.logout) {
      await corekitInstance.logout();
      return { ruid, action, result: { status: corekitInstance.status , state: corekitInstance.state} };
    }

    if (action === CoreKitAction._UNSAFE_exportTssKey) {
      let result = await corekitInstance._UNSAFE_exportTssKey();
      return { ruid, action, result: { result, status: corekitInstance.status , state: corekitInstance.state} };
    }

    if (action === CoreKitAction._UNSAFE_exportTssEd25519Seed) {
      let result = await corekitInstance._UNSAFE_exportTssEd25519Seed();
      return { ruid, action, result: { result, status: corekitInstance.status , state: corekitInstance.state} };
    }

    if (action === CoreKitAction._UNSAFE_resetAccount) {
      await corekitInstance.tKey.storageLayer.setMetadata({
        privKey: new BN(corekitInstance.state.postBoxKey!, 'hex'),
        input: {message: 'KEY_NOT_FOUND'},
      });
      await corekitInstance.logout();

      return { ruid, action, result: { status: corekitInstance.status , state: corekitInstance.state} };
    }

    if (action === CoreKitAction.getDeviceFactor) {
      let result = await corekitInstance.getDeviceFactor();
      return { ruid, action, result: { result, status: corekitInstance.status , state: corekitInstance.state} };
    }
    if (action === CoreKitAction.setDeviceFactor) {
      const { factorKey, replace } = payload;
      await corekitInstance.setDeviceFactor( factorKey, replace );
      return { ruid, action, result: { status: corekitInstance.status , state: corekitInstance.state} };
    }

    if (action === CoreKitAction.setManualSync) {
      const {manualSync} = payload;
      let result = await corekitInstance.setManualSync(manualSync);
      return { ruid, action, result: { result, status: corekitInstance.status , state: corekitInstance.state} };
    }
    if (action === CoreKitAction.setTssWalletIndex) {
      const {accountIndex} = payload;
      corekitInstance.setTssWalletIndex(accountIndex);
      return { ruid, action, result: { status: corekitInstance.status , state: corekitInstance.state} };
    }
    if (action === CoreKitAction.getTssFactorPub) {
      const result = corekitInstance.getTssFactorPub();
      return { ruid, action, result: { result, status: corekitInstance.status , state: corekitInstance.state} };
    }
    if (action === CoreKitAction.getKeyDetails) {
      const result = corekitInstance.getKeyDetails();
      return { ruid, action, result: { result, status: corekitInstance.status , state: corekitInstance.state} };
    }

    if (action === CoreKitAction.getPubKeyPoint) {
      const result = corekitInstance.getPubKeyPoint();
      return { ruid, action, result: { result, status: corekitInstance.status , state: corekitInstance.state} };
    }

    if (action === CoreKitAction.getPubKeyEd25519) {
      const result = corekitInstance.getPubKeyEd25519();
      return { ruid, action, result: { result, status: corekitInstance.status , state: corekitInstance.state} };
    }

    throw new Error ('unknown action');
    // return { ruid, action, result: 'unknown action', error: 'unknown action' };
  }
