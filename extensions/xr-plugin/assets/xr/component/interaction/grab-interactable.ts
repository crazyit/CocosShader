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
import { _decorator, ccenum, Node, Vec3, Quat, Mat4, CurveRange, RigidBody, ERigidBodyType, sys, clamp, toRadian, CCBoolean, misc } from 'cc';
const { ccclass, help, menu, property } = _decorator;
import { GrabState, GrabTriggerState, XrEventHandle, XrInteractable } from './xr-interactable';

enum GrabTrigger_Type {
    OnSelectEntered = 0,
    OnActivited = 1
}

enum SelectMode_Type {
    Single = 0,
    Multiple = 1
}

enum ThrowSimulationMode_Type {
    InheritRigidbody = 0,
    CurveComputation = 1
}

ccenum(GrabTrigger_Type);
ccenum(SelectMode_Type);
ccenum(ThrowSimulationMode_Type);

/**
 * @en
 * Make objects available for grabbing.
 * @zh
 * 可抓取交互对象组件。
 */
@ccclass('cc.GrabInteractable')
@help('i18n:cc.GrabInteractable')
@menu('XR/Interaction/GrabInteractable')
export class GrabInteractable extends XrInteractable {
    @property({ serializable: true })
    protected _attachTransform: Node | null = null;
    @property({ serializable: true })
    protected _attachEaseInTime = 0.15;
    @property({ serializable: true })
    protected _grabTrigger: GrabTrigger_Type = GrabTrigger_Type.OnSelectEntered;
    @property({ serializable: true })
    protected _hideController = false;
    @property({ serializable: true })
    protected _throwOnDetach = true;
    @property({ serializable: true })
    protected _throwSimulationMode: ThrowSimulationMode_Type = ThrowSimulationMode_Type.InheritRigidbody;
    @property({ serializable: true })
    protected _throwSmoothingDuration = 0.25;
    @property({ serializable: true })
    protected _throwSmoothingCurve = new CurveRange();
    @property({ serializable: true })
    protected _throwVelocityScale = 1.5;
    @property({ serializable: true })
    protected _throwAngularVelocityScale = 1;

    private _model: Node | null = null;
    // Force fetch or not
    private _forceGrab = false;
    // Whether it is grab
    private _isGrab = false;
    // Whether it has grabbed
    private _hasGrabbed = false;
    // Attach the node
    private _attachNode: Node | null = null;
    // Capture the elapsed time of the process
    private _curGrabTime = 0;
    // Real-time node position
    private _curWorldPosition = new Vec3;
    // Real-time node Angle
    private _curWorldRotation = new Quat;
    // Frame number of curves used to weight throw velocity smoothing
    private _throwFrameCount = 20;
    private _throwCurrentFrame = 0;
    private _throwFrameTimes = new Array<number>(this._throwFrameCount).fill(0);
    private _throwVelocityFrames = new Array<Vec3>(this._throwFrameCount).fill(new Vec3);
    private _throwAngularVelocityFrames = new Array<Vec3>(this._throwFrameCount).fill(new Vec3);
    private _lastPosition = new Vec3;
    private _lastRotation = new Quat;

    @property({
        type: Node,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.grab_interactable.attachTransform'
    })
    set attachTransform(val) {
        if (val === this._attachTransform) {
            return;
        }
        this._attachTransform = val;
    }
    get attachTransform() {
        return this._attachTransform;
    }

    @property({
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.grab_interactable.attachEaseInTime'
    })
    set attachEaseInTime(val) {
        if (val === this._attachEaseInTime) {
            return;
        }
        this._attachEaseInTime = val;
    }
    get attachEaseInTime() {
        return this._attachEaseInTime;
    }

    @property({
        type: GrabTrigger_Type,
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.grab_interactable.grabTrigger'
    })
    set grabTrigger(val) {
        if (val === this._grabTrigger) {
            return;
        }
        this._grabTrigger = val;
    }
    get grabTrigger() {
        return this._grabTrigger;
    }

    @property({
        type: CCBoolean,
        displayOrder: 7,
        tooltip: 'i18n:xr-plugin.grab_interactable.hideController'
    })
    set hideController(val) {
        if (val === this._hideController) {
            return;
        }
        this._hideController = val;
    }
    get hideController() {
        return this._hideController;
    }

    @property({
        type: CCBoolean,
        displayOrder: 10,
        tooltip: 'i18n:xr-plugin.grab_interactable.throwOnDetach'
    })
    set throwOnDetach(val) {
        if (val === this._throwOnDetach) {
            return;
        }
        this._throwOnDetach = val;
    }
    get throwOnDetach() {
        return this._throwOnDetach;
    }

    @property({
        type: ThrowSimulationMode_Type,
        displayOrder: 11,
        visible: (function (this: GrabInteractable) {
            return this._throwOnDetach;
        }),
        tooltip: 'i18n:xr-plugin.grab_interactable.throwSimulationMode'
    })
    set throwSimulationMode(val) {
        if (val === this._throwSimulationMode) {
            return;
        }
        this._throwSimulationMode = val;
    }
    get throwSimulationMode() {
        return this._throwSimulationMode;
    }

    @property({
        displayOrder: 12,
        visible: (function (this: GrabInteractable) {
            return this._throwSimulationMode === ThrowSimulationMode_Type.CurveComputation;
        }),
        tooltip: 'i18n:xr-plugin.grab_interactable.throwSmoothingDuration'
    })
    set throwSmoothingDuration(val) {
        if (val === this._throwSmoothingDuration) {
            return;
        }
        this._throwSmoothingDuration = val;
    }
    get throwSmoothingDuration() {
        return this._throwSmoothingDuration;
    }

    @property({
        type: CurveRange,
        range: [0, 1],
        displayOrder: 13,
        visible: (function (this: GrabInteractable) {
            return this._throwSimulationMode === ThrowSimulationMode_Type.CurveComputation;
        }),
        tooltip: 'i18n:xr-plugin.grab_interactable.throwSmoothingCurve'
    })
    set throwSmoothingCurve(val) {
        if (val === this._throwSmoothingCurve) {
            return;
        }
        this._throwSmoothingCurve = val;
    }
    get throwSmoothingCurve() {
        this._throwSmoothingCurve.mode = CurveRange.Mode.Curve;
        return this._throwSmoothingCurve;
    }

    @property({
        displayOrder: 14,
        visible: (function (this: GrabInteractable) {
            return this._throwOnDetach;
        }),
        tooltip: 'i18n:xr-plugin.grab_interactable.throwVelocityScale'
    })
    set throwVelocityScale(val) {
        if (val === this._throwVelocityScale) {
            return;
        }
        this._throwVelocityScale = val;
    }
    get throwVelocityScale() {
        return this._throwVelocityScale;
    }

    @property({
        displayOrder: 15,
        visible: (function (this: GrabInteractable) {
            return this._throwOnDetach;
        }),
        tooltip: 'i18n:xr-plugin.grab_interactable.throwAngularVelocityScale'
    })
    set throwAngularVelocityScale(val) {
        if (val === this._throwAngularVelocityScale) {
            return;
        }
        this._throwAngularVelocityScale = val;
    }
    get throwAngularVelocityScale() {
        return this._throwAngularVelocityScale;
    }

    public onEnable() {
        if (!this._colliderCom) {
            return;
        }
        if (this._grabTrigger === GrabTrigger_Type.OnSelectEntered) {
            this._colliderCom.node.on(GrabTriggerState.Select_Start, this._grabEntered, this);
            this._colliderCom.node.on(GrabTriggerState.Select_End, this._grabEnd, this);
        } else if (this._grabTrigger === GrabTrigger_Type.OnActivited) {
            this._colliderCom.node.on(GrabTriggerState.Activite_Start, this._grabEntered, this);
            this._colliderCom.node.on(GrabTriggerState.Activite_End, this._grabEnd, this);
        }
    }

    public onDisable() {
        if (!this._colliderCom) {
            return;
        }
        if (this._grabTrigger === GrabTrigger_Type.OnSelectEntered) {
            this._colliderCom.node.off(GrabTriggerState.Select_Start, this._grabEntered, this);
            this._colliderCom.node.off(GrabTriggerState.Select_End, this._grabEnd, this);
        } else if (this._grabTrigger === GrabTrigger_Type.OnActivited) {
            this._colliderCom.node.off(GrabTriggerState.Activite_Start, this._grabEntered, this);
            this._colliderCom.node.off(GrabTriggerState.Activite_End, this._grabEnd, this);
        }
    }

    protected _setRayReticle(event: XrEventHandle) {
        if (this._rayReticle) {
            this._rayReticle.setWorldPosition(event.hitPoint);
            this._rayReticle.active = true;
        }
    }

    private convertToNodeSpace(nodePoint: Vec3, out?: Vec3) {
        const _worldMatrix = new Mat4();
        this.node.getWorldMatrix(_worldMatrix);
        Mat4.invert(_worldMatrix, _worldMatrix);
        if (!out) {
            out = new Vec3();
        }

        return Vec3.transformMat4(out, nodePoint, _worldMatrix);
    }

    private _getAttachWorldPosition() {
        if (!this._attachNode) {
            return null;
        }
        var out = new Vec3;
        if (this._attachTransform) {
            this.convertToNodeSpace(this._attachTransform.worldPosition, out);
            let scale: Vec3 = new Vec3;
            Vec3.divide(scale, this._attachTransform.worldScale, this._attachTransform.scale);
            Vec3.transformRTS(out, out.negative(), this._attachNode.worldRotation, this._attachNode.worldPosition, scale);
        } else {
            out = this._attachNode.getWorldPosition();
        }
        return out;
    }

    private _getAttachWorldRotation() {
        if (!this._attachNode) {
            return null;
        }
        var out = new Quat;
        if (this._attachTransform) {
            Quat.invert(out, this.node.getWorldRotation());
            Quat.multiply(out, out, this._attachTransform.getWorldRotation());
            Quat.invert(out, out);

            Quat.multiply(out, this._attachNode.getWorldRotation(), out);
        } else {
            out = this._attachNode.getWorldRotation();
        }
        return out;
    }

    update(dt: number) {
        if (!this._isGrab) {
            if (this._hasGrabbed) {
                this._hasGrabbed = false;
            }
            return;
        }

        if (!this._forceGrab) {
            if (this._attachNode) {
                this.node.setWorldPosition(this._attachNode.worldPosition);
                this.node.setWorldRotation(this._attachNode.worldRotation);
            }
        } else {
            const attachWorldPosition = this._getAttachWorldPosition();
            const attachWorldRotation = this._getAttachWorldRotation();
            if (!attachWorldPosition || !attachWorldRotation) {
                return;
            }

            if (this._attachEaseInTime > 0 && this._curGrabTime <= this._attachEaseInTime) {
                const easePercent = this._curGrabTime / this._attachEaseInTime;
                Vec3.lerp(this._curWorldPosition, this.node.worldPosition, attachWorldPosition, easePercent);
                Quat.slerp(this._curWorldRotation, this.node.worldRotation, attachWorldRotation, easePercent);
                this.node.setWorldPosition(this._curWorldPosition);
                this.node.setWorldRotation(this._curWorldRotation);
                this._curGrabTime += dt;
            } else {
                this.node.setWorldPosition(attachWorldPosition);
                this.node.setWorldRotation(attachWorldRotation);
            }
        }

        // If throwOnDetach and throwSimulationMode is enabled, store the speed of the pre-SmoothingFramecount frame for later weighted throw speed estimation
        if (this._throwOnDetach && this._throwSimulationMode) {
            var position = this.node.getWorldPosition();
            var rotation = this.node.getWorldRotation();
            // FrameTime
            this._throwFrameTimes[this._throwCurrentFrame] = sys.now() / 1000.0;
            // FramePosition
            var outVec3 = new Vec3;
            this._throwVelocityFrames[this._throwCurrentFrame] = Vec3.subtract(outVec3, position, this._lastPosition).divide3f(dt, dt, dt);
            // FrameRotation
            var outQuat = new Quat;
            Quat.invert(outQuat, this._lastRotation);
            Quat.multiply(outQuat, rotation, outQuat);
            Quat.toEuler(this._throwAngularVelocityFrames[this._throwCurrentFrame], outQuat);
            const angular = this._throwAngularVelocityFrames[this._throwCurrentFrame];
            angular.divide3f(dt, dt, dt);
            this._throwAngularVelocityFrames[this._throwCurrentFrame].set(toRadian(angular.x), toRadian(angular.y), toRadian(angular.z));
            
            this._throwCurrentFrame = (this._throwCurrentFrame + 1) % this._throwFrameCount;
            this._lastPosition.set(position);
            this._lastRotation.set(rotation);
        }

        if (this.node.worldPosition.equals(this._getAttachWorldPosition(), 0.01)) {
            this._hasGrabbed = true;
        }
    }

    private _grabEntered(event?: XrEventHandle) {
        if (!event || !this._colliderCom) {
            return;
        }
        this._unsetRayReticle();
        this._isGrab = true;
        // 如果原来有抓取物体，发送被别的物体抓走的信号
        if (this._triggerNode) {
            this._triggerNode.emit(GrabState.End);
        }
        this._triggerNode = event.triggerNode;
        this._triggerNode.emit(GrabState.Start);
        this._attachNode = event.attachNode;
        this._curGrabTime = 0;
        this._forceGrab = event.forceGrab;
        if (!this._forceGrab) {
            this._attachNode?.setWorldPosition(this.node.worldPosition);
        }
        this._lastPosition.set(this.node.worldPosition);
        this._lastRotation.set(this.node.worldRotation);
        // Hide the controller
        if (this._hideController && this._model) {
            this._model.active = true;
        }
        if (this._hideController && event.model) {
            this._model = event.model;
            this._model.active = false;
        }

        const rigidBody = this.node.getComponent(RigidBody);
        if (rigidBody) {
            rigidBody.type = ERigidBodyType.KINEMATIC;
            rigidBody.useGravity = false;
        }
    }

    private _grabEnd(event?: XrEventHandle) {
        if (this._triggerNode !== event?.triggerNode) {
            return;
        }

        this._isGrab = false;
        // Show the controller
        if (this._hideController && this._model) {
            this._model.active = true;
        }

        const rigidBody = this.node.getComponent(RigidBody);
        if (rigidBody) {
            if (this._curGrabTime < this._attachEaseInTime && !this._hasGrabbed) {
                rigidBody.setLinearVelocity(Vec3.ZERO);
                rigidBody.setAngularVelocity(Vec3.ZERO);
                rigidBody.type = ERigidBodyType.DYNAMIC;
                rigidBody.useGravity = true;
                if (this._triggerNode) {
                    this._triggerNode.emit(GrabState.End);
                }
                this._triggerNode = null;
                return;
            }
            if (this._throwOnDetach) {
                if (this._throwSimulationMode === ThrowSimulationMode_Type.CurveComputation) {
                    rigidBody.setLinearVelocity(this.GetSmoothedVelocityValue(this._throwVelocityFrames).multiplyScalar(this._throwVelocityScale));
                    rigidBody.setAngularVelocity(this.GetSmoothedVelocityValue(this._throwAngularVelocityFrames).multiplyScalar(this._throwAngularVelocityScale));
                } else {
                    var out = new Vec3;
                    rigidBody.getLinearVelocity(out);
                    rigidBody.setLinearVelocity(out.multiplyScalar(this._throwVelocityScale));
                    rigidBody.getAngularVelocity(out);
                    rigidBody.setAngularVelocity(out.multiplyScalar(this._throwAngularVelocityScale));
                }
            } else {
                rigidBody.setLinearVelocity(Vec3.ZERO);
                rigidBody.setAngularVelocity(Vec3.ZERO);
            }
            rigidBody.type = ERigidBodyType.DYNAMIC;
            rigidBody.useGravity = true;
        }
        if (this._triggerNode) {
            this._triggerNode.emit(GrabState.End);
        }
        this._triggerNode = null;
    }

    private GetSmoothedVelocityValue(velocityFrames: Vec3[]) {
        var calcVelocity = new Vec3;
        var totalWeights = 0;
        for (var frameCounter = 0; frameCounter < this._throwFrameCount; ++frameCounter) {
            var frameIdx = (((this._throwCurrentFrame - frameCounter - 1) % this._throwFrameCount) + this._throwFrameCount) % this._throwFrameCount;
            if (this._throwFrameTimes[frameIdx] === 0) {
                break;
            }

            var timeAlpha = (sys.now() / 1000.0 - this._throwFrameTimes[frameIdx]) / this._throwSmoothingDuration;
            var velocityWeight = this._throwSmoothingCurve.evaluate(clamp(1 - timeAlpha, 0, 1), 0);
            calcVelocity.add(velocityFrames[frameIdx].multiplyScalar(velocityWeight));
            totalWeights += velocityWeight;
            if (sys.now() / 1000.0 - this._throwFrameTimes[frameIdx] > this._throwSmoothingDuration) {
                break;
            }
        }
        if (totalWeights > 0) {
            return calcVelocity.divide3f(totalWeights, totalWeights, totalWeights);
        }
        calcVelocity.set(0,0,0);
        return calcVelocity;
    }
}

