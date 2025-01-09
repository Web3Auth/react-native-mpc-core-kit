import { IAsyncStorage, IStorage } from "@web3auth/mpc-core-kit";
import log, { LogLevelDesc } from "loglevel";
import React, { useEffect } from "react";
// eslint-disable-next-line import/namespace
import { StyleSheet, View } from "react-native";
import { ReactNativeMessage, useWebViewMessage } from "react-native-react-bridge";
import WebView from "react-native-webview";

import { BrigeToRNMessageType, BrigeToWebViewMessageType, LibError, type MessageRequest, type MessageResponse, StorageAction } from "./common";
import webApp from "./WebApp";

// let promiseOn;
export let bridgeEmit: (message: ReactNativeMessage<any>) => void;

export const resolveMap = new Map<string, any>();
export const rejectMap = new Map<string, any>();

export const storageMap: Record<string, IAsyncStorage | IStorage> = {};

const styles = StyleSheet.create({
  container: {
    height: 0,
    display: "none",
  },
});

// resolve promise on response
const handleCoreKitResponse = (data: MessageResponse) => {
  const { ruid, action, result } = data;
  log.debug("mpcLib Result", ruid, action, result);
  const key = ruid + action;
  if (resolveMap.has(key)) {
    rejectMap.delete(key);
    resolveMap.get(key)(result);
    resolveMap.delete(key);
  } else {
    log.error("mpcLib", "no resolver", key);
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
  log.debug("storage handler", data);
  try {
    if (action === StorageAction.setItem) {
      const { key, value, instanceId } = payload;
      log.debug(key, value, instanceId);
      if (storageMap[instanceId] === undefined) {
        throw new Error("storage instance not found");
      }
      await storageMap[instanceId]?.setItem(key, value);
      bridgeEmit({
        type: BrigeToWebViewMessageType.StorageResponse,
        data: {
          ruid,
          action,
          result: "done",
        },
      });
    } else if (action === StorageAction.getItem) {
      const { key, instanceId } = payload;
      const result = await storageMap[instanceId]?.getItem(key);
      bridgeEmit({
        type: BrigeToWebViewMessageType.StorageResponse,
        data: {
          ruid,
          action,
          result,
        },
      });
    } else {
      throw new Error(`invalid action type ${action}`);
    }
  } catch (e) {
    bridgeEmit({
      type: BrigeToWebViewMessageType.StorageResponse,
      data: {
        ruid,
        action,
        error: e,
      },
    });
  }
};

export const Bridge = (params: { logLevel?: LogLevelDesc; resolveReady: (value: boolean) => void }) => {
  useEffect(() => {
    log.setLevel(params.logLevel || "info");
  }, [params.logLevel]);

  // useWebViewMessage hook create props for WebView and handle communication
  // The argument is callback to receive message from React
  const { ref, onMessage, emit } = useWebViewMessage(async (message) => {
    if (message.type === "debug") {
      log.debug("debug", message.data);
      // temporary indicate webview is ready
      params.resolveReady(true);
    }

    if (message.type === BrigeToRNMessageType.CoreKitResponse) {
      handleCoreKitResponse(message.data as MessageRequest);
    }

    if (message.type === BrigeToRNMessageType.StorageRequest) {
      log.debug("Storege request rn");
      await handleStorageRequest(message.data as MessageRequest);
    }

    if (message.type === "error") {
      const { payload, error } = message.data as LibError;
      if (payload.ruid && payload.action) {
        handleTssLibError( {...payload as MessageResponse});
      } else {
        log.error('error',  payload.error);
      }
    }
    if (message.type === "state") {
      log.debug("mpcLibInit", message.data);
    }
  });
  bridgeEmit = emit;

  return (
    <View style={styles.container}>
      <WebView
        // ref, source and onMessage must be passed to react-native-webview
        ref={ref}
        // Pass the source code of React app
        source={{ html: webApp, baseUrl: "https://localhost" }}
        onMessage={onMessage}
        onError={log.error}
      />
    </View>
  );
};
