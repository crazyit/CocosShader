import fs from 'fs';
import path from 'path';

const globalCache: {
    'pluginPath': string, 
    'xrPlatforms': string[],
    'installInProject': boolean,
    'installInGlobal': boolean,
    } = {
        pluginPath: '', 
        xrPlatforms: [],
        installInProject: false,
        installInGlobal: false,
    };

export const methods = {
    'create-node'(...args: any) {
        Editor.Message.send('scene', 'create-node', ...args);
    },

    async autoInstallXrBuild() {
        // globalCache.installInProject = pluginPath.startsWith(Editor.Project.path); // 是否以项目地址开头
        // globalCache.installInGlobal = pluginPath.includes(path.normalize('.CocosCreator/extensions'));

        const folders = fs.readdirSync(path.join(globalCache.pluginPath, './platforms'), { withFileTypes: true })
            .filter(v => v.isDirectory())
            .map(v => v.name);

        const xrPlaforms = folders.map(v => path.resolve(globalCache.pluginPath, './platforms', v));

        for (const folder of xrPlaforms) {
            await Editor.Package.register(folder);
            await Editor.Package.enable(folder);
        }

        globalCache.xrPlatforms = xrPlaforms;
    },
    async open() {
        Editor.Panel.open('xr-plugin'); 
    },
    async agree(v) {
        if (v) {
            methods.autoInstallXrBuild();
        } else {
            console.log('不同意，关闭 xr-plugin');
            console.log(globalCache.pluginPath);
            await Editor.Package.disable(globalCache.pluginPath, true);
        }
    },
};

/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
export const load = async function() {
    // methods.install();
    // methods.autoInstallXrBuild(this.path);

    globalCache.pluginPath = this.path;

    const isAgree = await Editor.Profile.getConfig('xr-plugin', 'document.agree', 'global');
    if (isAgree) {
        methods.autoInstallXrBuild();
    } else {
        methods.open();
    }
   
};

/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 完成扩展卸载后触发的钩子
 */
export const unload = async function() {
    for (const v of globalCache.xrPlatforms) {
        await Editor.Package.disable(v, true);
        await Editor.Package.unregister(v);
    }
};