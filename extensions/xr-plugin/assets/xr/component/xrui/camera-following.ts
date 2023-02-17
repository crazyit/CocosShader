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

import { _decorator, Component, CameraComponent } from 'cc';
const { ccclass, help, menu, property } = _decorator;


/**
 * @en Make XR UI follow Camera
 * @zh XRUI跟随摄像头组件
 */
@ccclass('cc.CameraFollowing')
@help('i18n:cc.CameraFollowing')
@menu('XR/XRUI/CameraFollowing')
export class CameraFollowing extends Component {
    @property({ serializable: true })
    private _camera: CameraComponent | null = null;

    @property({
        type: CameraComponent,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.camera_following.camera'
    })
    set camera(val) {
        if (val === this._camera) {
            return;
        }
        this._camera = val;
    }
    get camera() {
        return this._camera;
    }

    update() {
        if (this._camera) {
            this.node.setWorldPosition(this._camera.node.worldPosition);
            this.node.setWorldRotation(this._camera.node.worldRotation);
        }
    }
}