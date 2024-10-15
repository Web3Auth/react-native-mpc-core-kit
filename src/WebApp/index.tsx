import React, { useEffect, useRef} from 'react';
import {
  emit,
  useNativeMessage,
  webViewCreateRoot,
} from 'react-native-react-bridge/lib/web';
import TssLibv4 from '@toruslabs/tss-dkls-lib';

import {
  TssLibAction,
  type MessageResponse,
  type MessageRequest,
  TssLibMessageType,
  LibError,
  CoreKitRequestType,
  CoreKitAction,
  // CoreKitRequestType,
  // CoreKitAction,
} from '../common';
import { IAsyncStorage, Web3AuthMPCCoreKit, Web3AuthOptions } from '@web3auth/mpc-core-kit';
import { handleMPCCoreKitRequest } from './mpc';

const style = {
  width: '100vw',
  height: '0vh',
  margin: 'auto',
  backgroundColor: 'lightblue',
};

let bridgeEmit: any;
bridgeEmit = emit;

const debug = (data: any) => {
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

let resolverMap = new Map();
const rec : Record<string, string> = {};
const memoryStorage : IAsyncStorage= {
  getItem: async(key: string) => {
    const value = rec[key];
    if (value === undefined) { return null }
    return value
  },
  setItem: async(key: string, value: string) => {
    rec[key] = value;
  },
};


async function handleResponse(
  data: MessageResponse,
): Promise<MessageResponse> {
  const { action, result, ruid } = data;
  if (action === TssLibAction.JsSendMsg) {
    resolverMap.get(ruid + '-js_send_msg')(result);
    resolverMap.delete(ruid + '-js_send_msg');
    console.log('js_send_msg resolved', result);
    return { ruid, action, result: 'done' };
  }
  if (action === TssLibAction.JsReadMsg) {
    resolverMap.get(ruid + '-js_read_msg')(result);
    resolverMap.delete(ruid + '-js_read_msg');
    return { ruid, action, result: 'done' };
  }
  throw { ruid, action, result: 'done' };
}

function createMPCCoreKitInstance(options: Web3AuthOptions) {
  debug(options);
  const modOptions : Web3AuthOptions = {
    ...options,
    tssLib: TssLibv4,
    storage: memoryStorage,
  };

  debug(modOptions);
  debug( memoryStorage);
  const corekitInstance = new Web3AuthMPCCoreKit(modOptions);
  return corekitInstance;
}

let corekitInstanceGLobal: Web3AuthMPCCoreKit;

const Root = () => {
  const coreKitRef = useRef<Web3AuthMPCCoreKit>(corekitInstanceGLobal);
  useEffect(() => {
      const init = async () => {
        debug('initializing113456789012a3');
        debug('initialized');
      };

      // handle error
      init().catch((e) => {
        error(e.message);
      });
  }, []);

  useNativeMessage(async (message: { type: string; data: any }) => {

    if (message.type === TssLibMessageType.TssLibResponse) {
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

    if (message.type === CoreKitRequestType.CoreKitRequest) {
      debug({ type: 'corekit request', message });
        // debug(corekitInstance);
      const corekitInstance = coreKitRef.current;
      try {
        const { action, payload, ruid } = message.data as MessageRequest;
        debug(payload);
        if ( action === CoreKitAction.createInstance) {
          debug('creating mpc instance 1235678');
          coreKitRef.current = createMPCCoreKitInstance(payload.options);
          debug({msg: 'created mpc instance ', ruid});
          emit({ type: CoreKitRequestType.CoreKitRequest, data: { ruid, action, result: ruid } });
          return;
        }

        const result = await handleMPCCoreKitRequest(message.data, corekitInstance);
        emit({ type: CoreKitRequestType.CoreKitRequest, data: result });
      } catch (e) {
        debug({ type: 'mpcCoreKit request error', e });
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
