import React, { useEffect } from 'react';
import WebView from 'react-native-webview';
import { useWebViewMessage } from 'react-native-react-bridge';
import type { ReactNativeMessage } from 'react-native-react-bridge';
import webApp from './WebApp';
import { View, StyleSheet } from 'react-native';
import {
  type MessageResponse,
  type MessageRequest,
  TssLibMessageType as MessageType,
  LibError,
  StorageAction,
  CoreKitRequestType,
} from './common';
import log, {LogLevelDesc} from 'loglevel';
import { IAsyncStorage, IStorage } from '@web3auth/mpc-core-kit';

// let promiseOn;
export let bridgeEmit: (message: ReactNativeMessage<any>) => void;

export const resolveMap = new Map<string, any>();
export const rejectMap = new Map<string, any>();

export const storageMap: Record<string, IAsyncStorage | IStorage> = {};

// resolve promise on response
const handleTssLibResponse = (data: MessageResponse) => {
  const { ruid, action, result } = data;
  console.log('tssLib Result', ruid, action, result);
  const key = ruid + action;
  if (resolveMap.has(key)) {
    rejectMap.delete(key);
    resolveMap.get(key)(result);
    resolveMap.delete(key);
  } else {
    console.log('tssLib', 'no resolver', key);
  }
};

const handleTssLibError = (data: MessageResponse) => {
  const { ruid, action, error } = data;
  const key = ruid + action;
  if (rejectMap.has(key)) {
    resolveMap.delete(key);
    rejectMap.get(key)(error);
    rejectMap.delete(key);
  }
};

const handleStorageRequest = async (data: MessageRequest) => {
  const { ruid, action, payload } = data;
  if (action === StorageAction.setItem) {
    const { key, value, instanceId } = payload;
    try {
      if (storageMap[instanceId] === undefined) { throw new Error('storage instance not found'); }
      await storageMap[instanceId]?.setItem(key, value);
      bridgeEmit({
        type: MessageType.TssLibResponse,
        data: {
          ruid,
          action,
          result: 'done',
        },
      });
    } catch (e) {
      bridgeEmit({
        type: MessageType.TssLibResponse,
        data: {
          ruid,
          action,
          error: e,
        },
      });
    }
  }

  if (action === StorageAction.getItem) {
    const { key, instanceId } = payload;
    const result = await storageMap[instanceId]?.getItem(key);
    bridgeEmit({
      type: MessageType.TssLibResponse,
      data: {
        ruid,
        action,
        result,
      },
    });
  }
};


export const Bridge = ( params: {logLevel?: LogLevelDesc , resolveReady: (value: boolean ) => void } ) => {
  useEffect(() => {
    log.setLevel(params.logLevel || 'info');
    log.debug('Bridge init happend here!!!!');
  },[params.logLevel]);

  // useWebViewMessage hook create props for WebView and handle communication
  // The argument is callback to receive message from React
  const { ref, onMessage, emit } = useWebViewMessage(async (message) => {
    if (message.type === 'debug') {
      log.debug('debug', message.data);
      // temporary indicate webview is ready
      params.resolveReady(true);
    }

    if (message.type === CoreKitRequestType.CoreKitRequest) {
      handleTssLibResponse(message.data as MessageRequest);
    }

    if (message.type === CoreKitRequestType.StorageRequest) {
      await handleStorageRequest(message.data as MessageRequest);
    }

    if (message.type === 'error') {
      const { payload, error } = message.data as LibError;
      if (payload.ruid && payload.action) {
        handleTssLibError( {...payload as MessageResponse, error});
      } else {
        log.error('error', error);
      }
    }
    if (message.type === 'state') {
      log.debug('tsslibInit', message.data);
    }
  });
  bridgeEmit = emit;

  return (
    <View style={styles.container}>
      <WebView
        // ref, source and onMessage must be passed to react-native-webview
        ref={ref}
        // Pass the source code of React app
        source={{ html: webApp, baseUrl: 'https://localhost' }}
        onMessage={onMessage}
        onError={log.error}

      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 0,
    display: 'none',
  },
});
