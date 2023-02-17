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
import { _decorator, Component, ccenum, Vec2, CameraComponent, CCBoolean, sys } from 'cc';
import { xrInterface } from '../interface/xr-interface';
const { ccclass, help, menu, property } = _decorator;
import { TargetEye, TargetEye_Type } from './target-eye';

enum StereoRendering_Type {
    SINGLE_PASS = 0,
    MUTLI_PASS = 1,
    OFF = 2
}

enum FoveationRendering_Type {
    None = 0,
    Low = 1,
    Med = 2,
    High = 3,
    Ext = 4
}

enum IPDOffset_Type {
    Auto = 0,
    Device = 1,
    Manual = 2
}

enum AspectRatio_Type {
    Auto = 0,
    Manual = 1
}

enum Camera_Type {
    BOTH = 0,
    LEFT = 1,
    RIGHT = 2
}

ccenum(StereoRendering_Type);
ccenum(FoveationRendering_Type);
ccenum(IPDOffset_Type);
ccenum(AspectRatio_Type);

/**
 * @en
 * The Controller component of HMD.
 * @zh
 * 头戴显示器控制组件。
 */
@ccclass('cc.HMDCtrl')
@help('i18n:cc.HMDCtrl')
@menu('XR/Device/HMDCtrl')
export class HMDCtrl extends Component {
    @property({ serializable: true })
    protected _perEyeCamera = false;
    @property({ serializable: true })
    protected _sync = false;
    @property({ serializable: true })
    protected _IPDOffset: IPDOffset_Type = IPDOffset_Type.Auto;
    @property({ serializable: true })
    protected _offsetValue = 0.064;

    private _mainCamera: CameraComponent | null = null;
    private _leftCamera: CameraComponent | null = null;
    private _rightCamera: CameraComponent | null = null;
    @property({ serializable: true })
    private _realIPDOffset = 0;

    @property({
        type: CCBoolean,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.hmd_ctrl.perEyeCamera'
    })
    set perEyeCamera(val) {
        if (val === this._perEyeCamera) {
            return;
        }
        this._perEyeCamera = val;
        this._getCameras();
        this._copyCameras(Camera_Type.BOTH);

        if (this._IPDOffset === IPDOffset_Type.Manual) {
            this._setMainOffset(this._offsetValue / 2);
        }
        if (this._perEyeCamera) {
            if (this._mainCamera) {
                this._mainCamera.enabled = false;
            }
            if (this._leftCamera) {
                this._leftCamera.node.active = true;
            }
            if (this._rightCamera) {
                this._rightCamera.node.active = true;
            }
        } else {
            if (this._mainCamera) {
                this._mainCamera.enabled = true;
            }
            if (this._leftCamera) {
                this._leftCamera.node.active = false;
            }
            if (this._rightCamera) {
                this._rightCamera.node.active = false;
            }
        }
    }
    get perEyeCamera() {
        return this._perEyeCamera;
    }

    @property({
        type: CCBoolean,
        displayOrder: 3,
        visible: (function (this: HMDCtrl) {
            return this._perEyeCamera;
        }),
        tooltip: 'i18n:xr-plugin.hmd_ctrl.syncWithMainCamera'
    })
    set sync_with_Main_Camera(val) {
        if (val === this._sync) {
            return;
        }
        this._sync = val;
        this._copyCameras(Camera_Type.BOTH);
    }
    get sync_with_Main_Camera() {
        return this._sync;
    }

    @property({
        type: IPDOffset_Type,
        displayOrder: 5,
        tooltip: 'i18n:xr-plugin.hmd_ctrl.IPDOffset'
    })
    set IPDOffset(val) {
        if (val === this._IPDOffset) {
            return;
        }
        // If it was Manual, change left and right back
        this._setIpdOffset(0);
        this._IPDOffset = val;
        // If it's Manual now
        this._setIpdOffset(this._offsetValue / 2);
    }
    get IPDOffset() {
        return this._IPDOffset;
    }

    @property({
        displayOrder: 6,
        visible: (function (this: HMDCtrl) {
            return this._IPDOffset === IPDOffset_Type.Manual;
        }),
        tooltip: 'i18n:xr-plugin.hmd_ctrl.offsetValue'
    })
    set offsetValue(val) {
        if (val === this._offsetValue) {
            return;
        }
        this._offsetValue = val;

        this._setIpdOffset(this._offsetValue / 2);
    }
    get offsetValue() {
        return this._offsetValue;
    }

    private _copyCameras(type: Camera_Type) {
        if (!this.perEyeCamera) {
            return;
        }

        this._getCameras();
        if (this._mainCamera && this._sync) {
            switch (type) {
                case Camera_Type.BOTH:
                    if (this._leftCamera) {
                        this._setCamera(this._leftCamera, this._mainCamera);
                    }
                    if (this._rightCamera) {
                        this._setCamera(this._rightCamera, this._mainCamera);
                    }
                    break;
                case Camera_Type.LEFT:
                    if (this._leftCamera) {
                        this._setCamera(this._leftCamera, this._mainCamera);
                    }
                    break;
                case Camera_Type.RIGHT:
                    if (this._rightCamera) {
                        this._setCamera(this._rightCamera, this._mainCamera);
                    }
                    break;
                default:
                    break;
            }

        }
    }

    private _setCamera(camera: CameraComponent | null, mainCamera: CameraComponent | null) {
        if (!(camera && mainCamera)) {
            return;
        }
        camera.priority = mainCamera.priority;
        camera.visibility = mainCamera.visibility;
        camera.clearFlags = mainCamera.clearFlags;
        camera.clearColor = mainCamera.clearColor;
        camera.clearDepth = mainCamera.clearDepth;
        camera.clearStencil = mainCamera.clearStencil;
        camera.projection = mainCamera.projection;
        camera.fovAxis = mainCamera.fovAxis
        camera.fov = mainCamera.fov;
        camera.orthoHeight = mainCamera.orthoHeight;
        camera.near = mainCamera.near;
        camera.far = mainCamera.far;
        camera.aperture = mainCamera.aperture;
        camera.shutter = mainCamera.shutter;
        camera.iso = mainCamera.iso;
        camera.rect = mainCamera.rect;
        camera.targetTexture = mainCamera.targetTexture;
    }

    private _setIpdOffset(value) {
        if (this._IPDOffset !== IPDOffset_Type.Manual) {
            return;
        }

        this._getCameras();
        if (this._mainCamera) {
            if (this._leftCamera) {
                this._leftCamera.node.setPosition(-value, this._leftCamera.node.getPosition().y, this._leftCamera.node.getPosition().z);
            }
            if (this._rightCamera) {
                this._rightCamera.node.setPosition(value, this._rightCamera.node.getPosition().y, this._rightCamera.node.getPosition().z);
            }

            this._setMainOffset(value);
        }
    }

    onEnable() {
        if (sys.isXR) {
            xrInterface.setIPDOffset(this._realIPDOffset);
        }
    }

    private _setMainOffset(value) {
        if (this._mainCamera) {
            // If perEyeCamera is turned off (that is, left and right are not enabled), offset is used for the MainCamera
            if (!this._perEyeCamera) {
                this._realIPDOffset = value * 2;
            } else {
                this._realIPDOffset = 0;
            }
        }
    }

    private _getCameras() {
        var targets = this.getComponentsInChildren(TargetEye);
        for (let i = 0; i < targets.length; ++i) {
            switch (targets[i].targetEye) {
                case TargetEye_Type.BOTH:
                    this._mainCamera = targets[i].getComponent(CameraComponent);
                    break;
                case TargetEye_Type.LEFT:
                    this._leftCamera = targets[i].getComponent(CameraComponent);
                    break;
                case TargetEye_Type.RIGHT:
                    this._rightCamera = targets[i].getComponent(CameraComponent);
                    break;
                default:
                    break;
            }
        }
    }

}
