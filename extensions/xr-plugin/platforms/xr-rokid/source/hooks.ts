'use strict';
import type { ITaskOption, BuilderAssetCache, InternalBuildResult } from '../../xr-common/@types/index';
import { afterInit, afterBuild, afterCompressSettings } from '../../xr-common/hooks';

export const throwError = true;

/**
 * 在开始构建之前构建出 native 项目
 * @param options
 * @param result
 */
export async function onAfterInit(options: ITaskOption, result: InternalBuildResult, cache: BuilderAssetCache) {
    const params = result.compileOptions;
    params.cMakeConfig.USE_XR = 'set(USE_XR ON)';
    params.cMakeConfig.XR_OEM_HUAWEI = 'set(XR_OEM_ROKID ON)';
    afterInit('xr-rokid', options, result, cache);
}

export async function onAfterBuild() {
    afterBuild();
}

export async function onAfterCompressSettings(options: ITaskOption, result: InternalBuildResult, cache: BuilderAssetCache) {
    afterCompressSettings('xr-rokid', options, result, cache);
}