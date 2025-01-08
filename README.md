# @web3auth/react-native-mpc-core-kit

MPC core kit for react-native using webview
** only for react-native **

## Installation

```sh
npm install --save @web3auth/react-native-mpc-core-kit
```


add customTransformer file
```
// customTransformer.js
const { nodeModulesPolyfillPlugin } = require("esbuild-plugins-node-modules-polyfill");
const reactNativeReactBridgeTransformer = require("react-native-react-bridge/lib/plugin");
const esbuildOptions = {
  plugins: [
    nodeModulesPolyfillPlugin({
      globals: {
        Buffer: true,
        crypto: true,
      },
    }),
  ],
};
module.exports.transform = function ({ src, filename, options }) {
  const transform = reactNativeReactBridgeTransformer.createTransformer(esbuildOptions);
  return transform({ src, filename, options });
};
```


add metroTransformer file
```
// metro.config.js
require("ts-node/register");
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath = require.resolve('./customTransformer.js')
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,

  assert: require.resolve("empty-module"), // assert can be polyfilled here if needed
  http: require.resolve("empty-module"), // stream-http can be polyfilled here if needed
  https: require.resolve("empty-module"), // https-browserify can be polyfilled here if needed
  os: require.resolve("empty-module"), // os-browserify can be polyfilled here if needed
  url: require.resolve("empty-module"), // url can be polyfilled here if needed
  zlib: require.resolve("empty-module"), // browserify-zlib can be polyfilled here if needed
  path: require.resolve("empty-module"),
  crypto: require.resolve("empty-module"),
  buffer: require.resolve("@craftzdog/react-native-buffer"),
};

module.exports = config;
```

On the App.tsx
```js
import { Bridge, mpclib, TssDklsLib } from "@web3auth/react-native-mpc-core-kit";

class ReactStorage implements IAsyncStorage {
  async getItem(key: string): Promise<string | null> {
    return SecureStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    return SecureStorage.setItem(key, value);
  }
}
const coreKitInstancelocal = new mpclib.Web3AuthMPCCoreKitRN({
    web3AuthClientId: 'torus-key-test',
    web3AuthNetwork: WEB3AUTH_NETWORK.DEVNET,
    uxMode: 'react-native',
    asyncStorageKey: new ReactStorage(),
    tssLib: TssDklsLib,
});

const [bridgeReady, setBridgeReady] = useState<boolean>(false);

// ...
useEffect(() => {
  if (bridgeReady) {
    const init = async () => {
      try {
        // IMP START - SDK Initialization
        await coreKitInstance.init();
        // IMP END - SDK Initialization
      } catch (error: any) {
        uiConsole(error.message, "mounted caught");
      }
      setCoreKitStatus(coreKitInstance.status);
    };
    init();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [bridgeReady]);

<View>
  <Bridge
    logLevel={"DEBUG"}
    resolveReady={
      (ready)=> {
      setBridgeReady(ready);
    }}
  />
...
<View>
```


## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
