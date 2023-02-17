'use strict';

Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: 'Module' } });

const fs = require('fs');
const path = require('path');

const _interopDefaultLegacy = e => e && typeof e === 'object' && 'default' in e ? e : { default: e };

const fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
const path__default = /*#__PURE__*/_interopDefaultLegacy(path);

const globalCache = {
  pluginPath: "",
  xrPlatforms: [],
  installInProject: false,
  installInGlobal: false
};
const methods = {
  "create-node"(...args) {
    Editor.Message.send("scene", "create-node", ...args);
  },
  async autoInstallXrBuild() {
    const folders = fs__default.default.readdirSync(path__default.default.join(globalCache.pluginPath, "./platforms"), { withFileTypes: true }).filter((v) => v.isDirectory()).map((v) => v.name);
    const xrPlaforms = folders.map((v) => path__default.default.resolve(globalCache.pluginPath, "./platforms", v));
    for (const folder of xrPlaforms) {
      await Editor.Package.register(folder);
      await Editor.Package.enable(folder);
    }
    globalCache.xrPlatforms = xrPlaforms;
  },
  async open() {
    Editor.Panel.open("xr-plugin");
  },
  async agree(v) {
    if (v) {
      methods.autoInstallXrBuild();
    } else {
      console.log("\u4E0D\u540C\u610F\uFF0C\u5173\u95ED xr-plugin");
      console.log(globalCache.pluginPath);
      await Editor.Package.disable(globalCache.pluginPath, true);
    }
  }
};
const load = async function() {
  globalCache.pluginPath = this.path;
  const isAgree = await Editor.Profile.getConfig("xr-plugin", "document.agree", "global");
  if (isAgree) {
    methods.autoInstallXrBuild();
  } else {
    methods.open();
  }
};
const unload = async function() {
  for (const v of globalCache.xrPlatforms) {
    await Editor.Package.disable(v, true);
    await Editor.Package.unregister(v);
  }
};

exports.load = load;
exports.methods = methods;
exports.unload = unload;
