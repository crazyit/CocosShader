'use strict';

import type { IDisplayOptions, IInternalBuildPluginConfig } from '../../xr-common/@types/index';
import { defaultOptions } from '../../xr-common/options';

const optionConfig: IDisplayOptions = {};
Object.keys(defaultOptions).forEach((key) => {
    optionConfig[key] = {
        // @ts-ignore
        default: defaultOptions[key],
    };
});

const cfg: IInternalBuildPluginConfig = {
    platformName: 'i18n:xr-meta.title',
    doc: 'editor/publish/native-options.html',
    panel: './panel',
    hooks: './hooks',
    commonOptions: {
        polyfills: {
            hidden: true,
        },
    },
    options: Object.assign(optionConfig, {
        packageName: {
            default: defaultOptions.packageName,
            verifyRules: ['required'],
        },
        apiLevel: {
            default: defaultOptions.apiLevel,
            verifyRules: ['required'],
        },
    }),
    textureCompressConfig: {
        platformType: 'android',
        support: {
            rgb: ['etc2_rgb', 'etc1_rgb', 'astc_4x4', 'astc_5x5', 'astc_6x6', 'astc_8x8', 'astc_10x5', 'astc_10x10', 'astc_12x12'],
            rgba: ['etc2_rgba', 'etc1_rgb_a', 'astc_4x4', 'astc_5x5', 'astc_6x6', 'astc_8x8', 'astc_10x5', 'astc_10x10', 'astc_12x12'],
        },
    },
    assetBundleConfig: {
        supportedCompressionTypes: ['none', 'merge_dep', 'merge_all_json'],
    },
};

export const configs: Record<string, IInternalBuildPluginConfig> = {
    'xr-meta': cfg,
};
