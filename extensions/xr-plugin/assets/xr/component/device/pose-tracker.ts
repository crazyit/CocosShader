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

import { CameraComponent, ccenum, Component, EventHandle, EventHMD, Input, input, Quat, renderer, Vec3, _decorator } from 'cc';
const { ccclass, help, menu, property, executeInEditMode } = _decorator;

enum TrackingSource_Type {
    VIEW_POSE_ACTIVE_LEFT = 0,
    VIEW_POSE_ACTIVE_RIGHT = 1,
    VIEW_POSE_ACTIVE_HMD = 2,
    HAND_POSE_ACTIVE_LEFT = 3,
    HAND_POSE_ACTIVE_RIGHT = 4,
}

enum TrackingType_Type {
    POSITION_AND_ROTATION = 1,
    POSITION = 2,
    ROTATION = 3
}

enum UpdateType_Type {
    UPDATE_AND_BEFORE_RENDER = 0,
    UPDATE_ONLY = 1,
    BEFORE_RENDER_ONLY = 2
}

ccenum(TrackingSource_Type);
ccenum(TrackingType_Type);
ccenum(UpdateType_Type);

/**
 * @en
 * Map devices from the real world to a virtual scene.
 * @zh
 * 位姿追踪组件。
 */
@ccclass('cc.PoseTracker')
@help('i18n:cc.PoseTracker')
@menu('XR/Device/PoseTracker')
@executeInEditMode
export class PoseTracker extends Component {
    @property({ serializable: true })
    protected _trackingSource: TrackingSource_Type = TrackingSource_Type.HAND_POSE_ACTIVE_LEFT;
    @property({ serializable: true })
    protected _trackingType: TrackingType_Type = TrackingType_Type.POSITION_AND_ROTATION;

    @property({
        type: TrackingSource_Type,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.pose_tracker.trackingSource'
    })
    set trackingSource(val) {
        if (val === this._trackingSource) {
            return;
        }
        this._trackingSource = val;
        if (this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_LEFT ||
            this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_RIGHT ||
            this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_HMD) {
            this.setCameraTrackingType(this.trackingType);
        } else {
            this.setCameraNoTracking();
        }
    }
    get trackingSource() {
        return this._trackingSource;
    }

    @property({
        type: TrackingType_Type,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.pose_tracker.trackingType'
    })
    set trackingType(val) {
        if (val === this._trackingType) {
            return;
        }
        this._trackingType = val;
        if (this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_LEFT ||
            this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_RIGHT ||
            this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_HMD) {
            this.setCameraTrackingType(this.trackingType);
        } else {
            this.setCameraNoTracking();
        }
    }
    get trackingType() {
        return this._trackingType;
    }

    private _quatPose: Quat = new Quat();
    private _positionPose: Vec3 = new Vec3();

    setCameraTrackingType(type: TrackingType_Type) {
        let cameraComponent = this.node?.getComponent(CameraComponent);
        if (cameraComponent) {
            switch (type) {
                case TrackingType_Type.POSITION_AND_ROTATION:
                    cameraComponent.trackingType = renderer.scene.TrackingType.POSITION_AND_ROTATION;
                    break;
                case TrackingType_Type.POSITION:
                    cameraComponent.trackingType = renderer.scene.TrackingType.POSITION;
                    break;
                case TrackingType_Type.ROTATION:
                    cameraComponent.trackingType = renderer.scene.TrackingType.ROTATION;
                    break;
            }
        }
    }

    setCameraNoTracking() {
        let cameraComponent = this.node?.getComponent(CameraComponent);
        if (cameraComponent) {
            cameraComponent.trackingType = renderer.scene.TrackingType.NO_TRACKING;
        }
    }

    onEnable() {
        if (this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_LEFT ||
            this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_RIGHT ||
            this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_HMD) {
            this.setCameraTrackingType(this.trackingType);
            input.on(Input.EventType.HMD_POSE_INPUT, this._dispatchEventHMDPose, this);
        } else if (this.trackingSource === TrackingSource_Type.HAND_POSE_ACTIVE_LEFT ||
            this.trackingSource === TrackingSource_Type.HAND_POSE_ACTIVE_RIGHT) {
            this.setCameraNoTracking();
            input.on(Input.EventType.HANDLE_POSE_INPUT, this._dispatchEventHandlePose, this);
        }
    }

    onDisable() {
        this.setCameraNoTracking();
        if (this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_LEFT ||
            this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_RIGHT ||
            this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_HMD) {
            input.off(Input.EventType.HMD_POSE_INPUT, this._dispatchEventHMDPose, this);
        } else if (this.trackingSource === TrackingSource_Type.HAND_POSE_ACTIVE_LEFT ||
            this.trackingSource === TrackingSource_Type.HAND_POSE_ACTIVE_RIGHT) {
            input.off(Input.EventType.HANDLE_POSE_INPUT, this._dispatchEventHandlePose, this);
        }
    }

    private _dispatchEventHMDPose(eventHMD: EventHMD) {
        const hmdInputDevice = eventHMD.hmdInputDevice;
        if (this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_LEFT) {
            if (this._trackingType === TrackingType_Type.POSITION_AND_ROTATION) {
                this._quatPose = hmdInputDevice.viewLeftOrientation.getValue();
                this._positionPose = hmdInputDevice.viewLeftPosition.getValue();
            } else if (this._trackingType === TrackingType_Type.ROTATION) {
                this._quatPose = hmdInputDevice.viewLeftOrientation.getValue();
                this._positionPose = Vec3.ZERO;
            } else {
                this._quatPose = Quat.IDENTITY;
                this._positionPose = hmdInputDevice.viewLeftPosition.getValue();
            }
        } else if (this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_RIGHT) {
            if (this._trackingType === TrackingType_Type.POSITION_AND_ROTATION) {
                this._quatPose = hmdInputDevice.viewRightOrientation.getValue();
                this._positionPose = hmdInputDevice.viewRightPosition.getValue();
            } else if (this._trackingType === TrackingType_Type.ROTATION) {
                this._quatPose = hmdInputDevice.viewRightOrientation.getValue();
                this._positionPose = Vec3.ZERO;
            } else {
                this._quatPose = Quat.IDENTITY;
                this._positionPose = hmdInputDevice.viewRightPosition.getValue();
            }
        } else if (this.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_HMD) {
            if (this._trackingType === TrackingType_Type.POSITION_AND_ROTATION) {
                this._quatPose = hmdInputDevice.headMiddleOrientation.getValue();
                this._positionPose = hmdInputDevice.headMiddlePosition.getValue();
            } else if (this._trackingType === TrackingType_Type.ROTATION) {
                this._quatPose = hmdInputDevice.headMiddleOrientation.getValue();
                this._positionPose = Vec3.ZERO;
            } else {
                this._quatPose = Quat.IDENTITY;
                this._positionPose = hmdInputDevice.headMiddlePosition.getValue();
            }
        }

        this.node.setRTS(this._quatPose, this._positionPose, Vec3.ONE);
    }

    private _dispatchEventHandlePose(eventHandle: EventHandle) {
        const handleInputDevice = eventHandle.handleInputDevice;
        if (this.trackingSource === TrackingSource_Type.HAND_POSE_ACTIVE_LEFT) {
            if (this._trackingType === TrackingType_Type.POSITION_AND_ROTATION) {
                this._quatPose = handleInputDevice.aimLeftOrientation.getValue();
                this._positionPose = handleInputDevice.aimLeftPosition.getValue();
            } else if (this._trackingType === TrackingType_Type.ROTATION) {
                this._quatPose = handleInputDevice.aimLeftOrientation.getValue();
                this._positionPose = Vec3.ZERO;
            } else {
                this._quatPose = Quat.IDENTITY;
                this._positionPose = handleInputDevice.aimLeftPosition.getValue();
            }
        } else if (this.trackingSource === TrackingSource_Type.HAND_POSE_ACTIVE_RIGHT) {
            if (this._trackingType === TrackingType_Type.POSITION_AND_ROTATION) {
                this._quatPose = handleInputDevice.aimRightOrientation.getValue();
                this._positionPose = handleInputDevice.aimRightPosition.getValue();
            } else if (this._trackingType === TrackingType_Type.ROTATION) {
                this._quatPose = handleInputDevice.aimRightOrientation.getValue();
                this._positionPose = Vec3.ZERO;
            } else {
                this._quatPose = Quat.IDENTITY;
                this._positionPose = handleInputDevice.aimRightPosition.getValue();
            }
        }

        this.node.setRTS(this._quatPose, this._positionPose, Vec3.ONE);
    }
}
