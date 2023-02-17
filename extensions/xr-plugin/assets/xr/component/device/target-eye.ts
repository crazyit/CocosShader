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
import { _decorator, Component, ccenum, CameraComponent, renderer } from 'cc';
const { ccclass, help, menu, property, executeInEditMode } = _decorator;


export enum TargetEye_Type {
    BOTH = 0,
    LEFT = 1,
    RIGHT = 2,
}
ccenum(TargetEye_Type);
 
/**
 * @en
 * Specifies the camera which accepts the render.
 * @zh
 * 指定接受渲染相机的组件。
 */
@ccclass('cc.TargetEye')
@help('i18n:cc.TargetEye')
@menu('XR/Device/TargetEye')
@executeInEditMode
export class TargetEye extends Component {
    @property({ serializable: true })
    protected _targetEye : TargetEye_Type = TargetEye_Type.BOTH;

    @property({
        type: TargetEye_Type,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.target_eye.targetEye'
    })
    set targetEye (val) {
        if (val === this._targetEye) {
            return;
        }
        this._targetEye = val;

        this.setCameraType();
    }
    get targetEye () {
        return this._targetEye;
    }

    setCameraType() {
        let cameraComponent = this.node?.getComponent(CameraComponent);
        if (cameraComponent) {
            switch(this._targetEye) {
                case TargetEye_Type.LEFT:
                    cameraComponent.cameraType = renderer.scene.CameraType.LEFT_EYE;
                    break;
                case TargetEye_Type.RIGHT:
                    cameraComponent.cameraType = renderer.scene.CameraType.RIGHT_EYE;
                    break;
                default:
                    cameraComponent.cameraType = renderer.scene.CameraType.MAIN;
                    break;
            }
        }
    }

    resetCameraType() {
        let cameraComponent = this.node?.getComponent(CameraComponent);
        if (cameraComponent) {
            cameraComponent.cameraType = renderer.scene.CameraType.MAIN;
        }
    }

    public onEnable() { 
        this.setCameraType();
    }

    public onDisable() {
        this.resetCameraType();
    }
}
