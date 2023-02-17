'use strict';

Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: 'Module' } });

require('fs');
require('path');

const defaultOptions = {
  packageName: "",
  orientation: {
    portrait: false,
    upsideDown: false,
    landscapeRight: true,
    landscapeLeft: true
  },
  apiLevel: 26,
  appABIs: ["arm64-v8a"],
  useDebugKeystore: true,
  keystorePath: "",
  keystorePassword: "",
  keystoreAlias: "",
  keystoreAliasPassword: "",
  appBundle: false,
  androidInstant: false,
  remoteUrl: "",
  sdkPath: "",
  ndkPath: "",
  swappy: false,
  renderBackEnd: {
    vulkan: false,
    gles3: true,
    gles2: false
  },
  renderingScale: 1,
  msaa: 1
};

const optionConfig = {};
Object.keys(defaultOptions).forEach((key) => {
  optionConfig[key] = {
    default: defaultOptions[key]
  };
});
const cfg = {
  platformName: "i18n:xr-monado.title",
  doc: "editor/publish/native-options.html",
  panel: "./panel",
  hooks: "./hooks",
  commonOptions: {
    polyfills: {
      hidden: true
    }
  },
  options: Object.assign(optionConfig, {
    packageName: {
      default: defaultOptions.packageName,
      verifyRules: ["required"]
    },
    apiLevel: {
      default: defaultOptions.apiLevel,
      verifyRules: ["required"]
    }
  }),
  textureCompressConfig: {
    platformType: "android",
    support: {
      rgb: ["etc2_rgb", "etc1_rgb", "astc_4x4", "astc_5x5", "astc_6x6", "astc_8x8", "astc_10x5", "astc_10x10", "astc_12x12"],
      rgba: ["etc2_rgba", "etc1_rgb_a", "astc_4x4", "astc_5x5", "astc_6x6", "astc_8x8", "astc_10x5", "astc_10x10", "astc_12x12"]
    }
  },
  assetBundleConfig: {
    supportedCompressionTypes: ["none", "merge_dep", "merge_all_json"]
  }
};
const configs = {
  "xr-monado": cfg
};

exports.configs = configs;
