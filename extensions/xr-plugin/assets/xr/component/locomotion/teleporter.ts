/*
 Copyright (c) 2022 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
  worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
  not use Cocos Creator software for developing other software or tools that's
  used for developing games. You are not granted to publish, distribute,
  sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

/**
 * @packageDocumentation
 * @module component/xr
 */

import { _decorator, Component, director } from 'cc';
const { ccclass, help, menu, property, executeInEditMode } = _decorator;
import { LocomotionChecker } from './locomotion-checker';

/**
 * @en
 * Drive XR Agent to teleport.
 * @zh
 * 传送驱动组件。
 */
@ccclass('cc.Teleporter')
@help('i18n:cc.Teleporter')
@menu('XR/Locomotion/Teleporter')
@executeInEditMode
export class Teleporter extends Component {
    @property({ serializable: true })
    protected _checker: LocomotionChecker | null = null;
   
    @property({
        type: LocomotionChecker,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.teleporter.checker'
    })
    set checker (val) {
        if (val === this._checker) {
            return;
        }
        this._checker = val;
    }
    get checker () {
        return this._checker;
    }

    public onEnable() {
        if (!this._checker) {
            const scene = director.getScene() as any;
            if (scene) {
                const checker = scene.getComponentInChildren(LocomotionChecker);
                if (checker) {
                    this._checker = checker;
                }
            } 
        }
    }
}