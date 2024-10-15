import { EnableMFAParams, TssShareType, Web3AuthMPCCoreKit } from '@web3auth/mpc-core-kit';
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
      // const parsed = JSON.parse(createFactorParams);

      const result = await corekitInstance.createFactor({
        shareType: createFactorParams.shareType as TssShareType,
        factorKey: new BN(createFactorParams.factorKey, 'hex'),
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
      const params : EnableMFAParams = {
        factorKey: new BN(enableMFAParams.factorKey, 'hex'),
        shareDescription : enableMFAParams.shareDescription,
        additionalMetadata : enableMFAParams.additionalMetadata,
      };

      const result = await corekitInstance.enableMFA(params, recoveryFactor);
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

    if (action === CoreKitAction.getDeviceFactor) {
      let result = await corekitInstance.getDeviceFactor();
      return { ruid, action, result: { result, status: corekitInstance.status , state: corekitInstance.state} };
    }
    if (action === CoreKitAction.setDeviceFactor) {
      const {factorkey, replace} = payload;
      await corekitInstance.setDeviceFactor( new BN(factorkey, 'hex') , replace );
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
    return { ruid, action, result: 'unknown action' };
  }
