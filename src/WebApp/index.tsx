import React, { useEffect } from 'react';
import {
  emit,
  useNativeMessage,
  webViewCreateRoot,
} from 'react-native-react-bridge/lib/web';
import TssLibv4 from '@toruslabs/tss-dkls-lib';
import TssFrost from '@toruslabs/tss-frost-lib';

import {
  type MessageResponse,
  type MessageRequest,
  BrigeToWebViewMessageType,
  LibError,
  CoreKitAction,
  BrigeToRNMessageType,
  StorageAction,
} from '../common';
import { IAsyncStorage, Web3AuthMPCCoreKit, Web3AuthOptions } from '@web3auth/mpc-core-kit';
import { handleMPCCoreKitRequest } from './mpc';
import { generatePrivate } from '@toruslabs/eccrypto';

const style = {
  width: '100vw',
  height: '0vh',
  margin: 'auto',
  backgroundColor: 'lightblue',
};

let bridgeEmit: any;
bridgeEmit = emit;

export const debug = (data: any) => {
  bridgeEmit({
    type: 'debug',
    data,
  });
};
const error = (data: LibError) => {
  bridgeEmit({
    type: 'error',
    data,
  });
};

let resolverMap = new Map<string, any>();
let rejectMap = new Map<string, any>();

// const rec : Record<string, string> = {};
const createStorageInstance = ( tag: string ) =>{

  const memoryStorage : IAsyncStorage = {

    getItem: async(key: string) => {
      // const value = rec[key];
      // if (value === undefined) { return null; }
      debug('getting async storage data');

      let ruid = generatePrivate().toString('hex');
      let action = StorageAction.getItem;
      let payload = { key , instanceId: tag };
      emit({ type: BrigeToRNMessageType.StorageRequest , data: { ruid, action, payload } });

      // todo add timeout to fail
      const getItemPromise : Promise<string|null> = new Promise( (resolve, reject) => {
        resolverMap.set(ruid, resolve);
        rejectMap.set(ruid, reject);
      });

      return getItemPromise;
    },
    setItem: async(key: string, value: string) => {
      // rec[key] = value;
      // const value = rec[key];

      let ruid = generatePrivate().toString('hex');
      let action = StorageAction.setItem;
      let payload = { key , value, instanceId: tag  };
      emit({ type: BrigeToRNMessageType.StorageRequest , data: { ruid, action, payload } });

      // todo add timeout to fail
      await new Promise( (resolve, reject) => {
        resolverMap.set(ruid, resolve);
        rejectMap.set(ruid, reject);
      });
    },
  };

  return memoryStorage;
};

async function handleResponse(
  data: MessageResponse,
): Promise<MessageResponse> {
  const { action, result, ruid , error : msgerror} = data;
  if (msgerror) {
    throw new Error(msgerror);
  }

  if (action === StorageAction.getItem) {
    resolverMap.get(ruid)(result);
    resolverMap.delete(ruid);
    return { ruid, action, result: 'done' };
  }
  if (action === StorageAction.setItem) {
    resolverMap.get(ruid)(result);
    resolverMap.delete(ruid);
    return { ruid, action, result: 'done' };
  }

  throw { ruid, action, result: 'done' };
}

const corekitInstanceMap = new Map<string, Web3AuthMPCCoreKit>();


function createMPCCoreKitInstance(options: Web3AuthOptions, ruid: string) {
  debug(options);

  const modOptions : Web3AuthOptions = {
    ...options,
    tssLib: options.tssLib.keyType === TssFrost.keyType ? TssFrost : TssLibv4,
    storage: createStorageInstance(ruid),
  };
  const corekitInstance = new Web3AuthMPCCoreKit(modOptions);
  return corekitInstance;
}

const Root = () => {
  useEffect(() => {
      const init = async () => {
        debug('initialized 1111111');
      };

      // handle error
      init().catch((e) => {
        error(e.message);
      });
  }, []);

  useNativeMessage(async (message: { type: string; data: any }) => {

    if (message.type === BrigeToWebViewMessageType.StorageResponse) {
      try {
        await handleResponse(message.data);
      } catch (e) {
        debug({ type: 'handleTssLibResponse error', e });
        error({
          msg: `${message.type} error`,
          payload: message.data,
          error: (e as Error).message,
        });
      }
    }

    if (message.type === BrigeToWebViewMessageType.CoreKitRequest) {
      debug({ type: 'corekit request', message });
      try {
        const { action, payload, ruid } = message.data as MessageRequest;

        let coreKitInstance = corekitInstanceMap.get(payload.instanceId);

        if ( action === CoreKitAction.createInstance && coreKitInstance === undefined) {
          coreKitInstance = createMPCCoreKitInstance(payload.options, ruid);
          corekitInstanceMap.set(ruid, coreKitInstance)
          debug({msg: 'created mpc instance ', ruid});
          emit({ type: BrigeToRNMessageType.CoreKitResponse, data: { ruid, action, result: ruid } });
          return;
        }
        if (coreKitInstance === undefined) {
          throw new Error('coreKitInstance not found');
        }

        const result = await handleMPCCoreKitRequest(message.data, coreKitInstance);
        if (message.data.payload.action === CoreKitAction.logout) {
          if (message.data.payload.instanceId) {
            corekitInstanceMap.delete(message.data.payload.instanceId);
          }
        }
        emit({ type: BrigeToRNMessageType.CoreKitResponse, data: result });
      } catch (e) {
        error({
          msg: `${message.type} error`,
          payload: message.data,
          error: (e as Error).message,
        });
      }
    }
  });
  return <div style={style} />;
};

export default webViewCreateRoot(<Root />);
