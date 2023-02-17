
import type { IPlateforms, IPanelThis, ITaskOption } from '../../xr-common/@types/index';
import { createApp } from 'vue';
import View from '../../xr-common/view.vue';
import { orientations } from '../../xr-common/config';
import {join} from 'path';
import {readFileSync} from 'fs';
const weakMap = new WeakMap();

interface ICustomPanelThis extends IPanelThis {
    vm: any;
    options: ITaskOption;
    errorMap: any;
    pkgName: IPlateforms;
    $: {
        root: HTMLElement;
    };
    dispatch: (name: string, ...args: any[]) => void;
}

let panel: ICustomPanelThis;

export const template = '<div id="app"></div>';
export const style = readFileSync(join(__dirname, './panel.css'), 'utf8');

export const $ = {
    root: '#app',
};

export async function update(options: ITaskOption, key: string) {
    // @ts-ignore
    panel = this as ICustomPanelThis;
    if (key === 'packages.native.JobSystem') {
        // @ts-ignore
        panel.options.packages.native.JobSystem = options.packages.native.JobSystem;
        // 需要完整调用数据更新：更新本插件内的校验结果与构建处的校验结果
        panel.vm.onUpdateOptions('apiLevel', options.packages[panel.pkgName].apiLevel);
        return;
    }
    if (key && !key.startsWith(`packages.${panel.pkgName}`)) {
        return;
    }
    panel.options = options;
    panel.vm.init();
}

export function ready(options: ITaskOption, type: string, pkgName: IPlateforms, errorMap: any) {
    // @ts-ignore
    panel = this as ICustomPanelThis;

    panel.options = options;
    panel.pkgName = pkgName;
    panel.errorMap = errorMap;
    const app = createApp(View, {
        type,
        pkgName,
        panel,
        orientations: orientations.filter(v => ['landscapeLeft', 'landscapeRight'].includes(v.value)),
    });
    app.mount(panel.$.root);
    weakMap.set(this, app);
}

export function close() {
    const app = weakMap.get(this);
    app?.unmount?.();
}
