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
import { _decorator, ccenum, Node, Collider, Line, Color, Vec3, Quat, Mat4, PhysicsSystem, PhysicsRayResult, geometry, CCBoolean } from 'cc';
const { ccclass, help, menu, property } = _decorator;
import { InteractorEvents } from '../event/interactor-events';
import { XrInteractor, SelectActionTrigger_Type } from './xr-interactor';
import { IXrInteractable, XrControlEventType, XrInteractable } from './xr-interactable';
import { RaycastChecker } from '../xrui/raycast-checker';

enum Line_Type {
    Straight_Line = 0,
    Projectile_Line = 1,
    Bezier_Line = 2
}

enum Layer_Type {
    EVERYTHING = 0,
    NOTHING = 1,
    IGNORE_RAYCAST = 2,
    GIZMOS = 3,
    EDITOR = 4,
    UI_3D = 5,
    SCENE_GIZMO = 6,
    UI_2D = 7,
    PROFILER = 8,
    DEFAULT = 9
}

enum RaycastTrigger_Type {
    COLLIDE = 0,
    IGNORE = 1,
    USE_GLOBAL = 2
}

enum HitDirection_Type {
    RAY_CAST = 0,
    SPHERE_CAST = 1,
}

ccenum(Line_Type);
ccenum(Layer_Type);
ccenum(RaycastTrigger_Type);
ccenum(HitDirection_Type);
ccenum(SelectActionTrigger_Type);

/**
 * @en
 * Interact with object distantly by ray which originate from controller.
 * @zh
 * 射线交互器组件
 */
@ccclass('cc.RayInteractor')
@help('i18n:cc.RayInteractor')
@menu('XR/Interaction/RayInteractor')
export class RayInteractor extends XrInteractor {
    @property({ serializable: true })
    protected _forceGrab: boolean = true;
    @property({ serializable: true })
    protected _rayOriginTransform: Node | null = null;
    @property({ serializable: true })
    protected _maxRayDistance = 30;
    @property({ serializable: true })
    protected _reticle: Node | null = null;

    private _rayHitCollider: Collider | null = null;
    private _line: Line | null = null;
    private _linePositions: any = [];
    private _lineOriColor: Color | undefined = undefined;

    private _oriPoint: Vec3 = new Vec3;
    private _oriRotation: Quat = new Quat;

    protected _pressState: boolean = false;

    @property({
        type: CCBoolean,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.ray_interactor.forceGrab'
    })
    set forceGrab(val) {
        if (val === this._forceGrab) {
            return;
        }
        this._forceGrab = val;
    }
    get forceGrab() {
        return this._forceGrab;
    }

    @property({
        type: Node,
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.ray_interactor.rayOriginTransform'
    })
    set rayOriginTransform(val) {
        if (val === this._rayOriginTransform) {
            return;
        }
        this._rayOriginTransform = val;
    }
    get rayOriginTransform() {
        return this._rayOriginTransform;
    }

    @property({
        displayOrder: 6,
        tooltip: 'i18n:xr-plugin.ray_interactor.maxRayDistance'
    })
    set maxRayDistance(val) {
        if (val === this._maxRayDistance) {
            return;
        }
        this._maxRayDistance = val;
    }
    get maxRayDistance() {
        return this._maxRayDistance;
    }

    @property({
        type: Node,
        displayOrder: 7,
        tooltip: 'i18n:xr-plugin.ray_interactor.reticle'
    })
    set reticle(val) {
        if (val === this._reticle) {
            return;
        }
        this._reticle = val;
    }
    get reticle() {
        return this._reticle;
    }

    private _orginalScale: Vec3 = new Vec3;

    onEnable() {
        super.onEnable();
        if (this.reticle) {
            this._orginalScale.set(this.reticle.worldScale);
        }

        this._setAttachNode();
        this._line = this.getComponent(Line);
        if (this._rayOriginTransform && this._line) {
            var line = this._rayOriginTransform.addComponent(Line);
            this._copyLine(line, this._line);
            this._line.destroy();
            this._line = line;
        }
        this._lineOriColor = this._line?.color.color;
        this._linePositions = this._line?.positions;
        this._interactorEvents = this.getComponent(InteractorEvents);
        this._event.forceGrab = this._forceGrab;
    }

    onDisable() {
        super.onDisable();
        this._setLinehover(false);
        this._setLinePosition(false);
    }

    protected _setAttachNode() {
        if (!this.forceGrab) {
            var attachNode = new Node;
            attachNode.parent = this.node;
            this._event.attachNode = attachNode;
        } else {
            if (this._attachTransform) {
                this._event.attachNode = this._attachTransform;
            } else {
                this._event.attachNode = this.node;
            }
        }
    }

    private _copyLine(outLine: Line, inLine: Line) {
        outLine.texture = inLine.texture;
        outLine.worldSpace = inLine.worldSpace;
        outLine.width = inLine.width;
        outLine.tile = inLine.tile;
        outLine.offset = inLine.offset;
        outLine.color = inLine.color;

        var pos: any = [];
        pos.push(Vec3.ZERO);
        pos.push(new Vec3(0, 0, -100));
        outLine.positions = pos;
    }

    public convertToWorldSpace(rayNode: Node, nodePoint: Vec3, out?: Vec3) {
        const _worldMatrix = new Mat4();
        rayNode.getWorldMatrix(_worldMatrix);
        if (!out) {
            out = new Vec3();
        }

        return Vec3.transformMat4(out, nodePoint, _worldMatrix);
    }

    private _getRay() {
        const ray: geometry.Ray = new geometry.Ray();
        const dir = this._getRayDir();
        let start;
        if (this._rayOriginTransform) {
            start = this.convertToWorldSpace(this._rayOriginTransform, new Vec3(this._linePositions[0].x, this._linePositions[0].y, this._linePositions[0].z));
        } else {
            start = this.convertToWorldSpace(this.node, new Vec3(this._linePositions[0].x, this._linePositions[0].y, this._linePositions[0].z));
        }
        geometry.Ray.set(ray, start.x, start.y, start.z, dir.x, dir.y, dir.z);
        return ray;
    }

    protected _judgeHit(type: XrControlEventType) {
        if (!this._line || !this._line.node.active) {
            return false;
        }
        const ray = this._getRay();
        const hit = PhysicsSystem.instance.raycastClosest(ray, 0xffffffff, this.maxRayDistance, true);
        if (hit) {
            // Get collision box
            const closestResult = PhysicsSystem.instance.raycastClosestResult;
            // Check whether the collision box has an InteracTable
            const xrInteractable = closestResult.collider?.getComponent(XrInteractable);
            if (xrInteractable) {
                this._beTriggerNode = xrInteractable;
                // this._collider = closestResult.collider;
                this._event.hitPoint = closestResult.hitPoint;
                if (type === XrControlEventType.SELECT_ENTERED) {
                    this._collider = closestResult.collider;
                } else if (type === XrControlEventType.ACTIVATED) {
                    this._activateCollider = closestResult.collider;
                }
                return true;
            }
        }

        return false;
    }

    protected _judgeUIHit() {
        if (!this._line || !this._line.node.active) {
            return false;
        }

        const ray = this._getRay();
        const hit = PhysicsSystem.instance.raycastClosest(ray, 0xffffffff, this.maxRayDistance, true);
        if (hit) {
            // Get collision box
            const closestResult = PhysicsSystem.instance.raycastClosestResult;
            // Check whether the collision box has an UI3DBase
            const ui3DBase = closestResult.collider?.getComponent(RaycastChecker);
            if (ui3DBase) {
                this._uiPressCollider = closestResult.collider;
                return true;
            }
        }

        return false;
    }

    private _getRayDir() {
        let dir = new Vec3();
        if (this._line && this._linePositions.length === 2) {
            let vec3Like = new Vec3(this._linePositions[1].x - this._linePositions[0].x, this._linePositions[1].y - this._linePositions[0].y, this._linePositions[1].z - this._linePositions[0].z);
            Vec3.transformQuat(dir, vec3Like, this._line.node.getWorldRotation());
        }
        return dir;
    }

    private _handleHoverEnter(closestResult: PhysicsRayResult) {
        this._setLinehover(true);
        // Determine if there was a hit last time
        if (this._rayHitCollider) {
            if (this._rayHitCollider !== closestResult.collider) {
                // Inconsistent, and an object was hit last time, HOVER_EXITED is fired
                this._interactorEvents?.hoverExited(this._event);
                this._rayHitCollider.node.emit(XrControlEventType.HOVER_EXITED, this._event);
                // Replace hit object, triggering HOVER_ENTERED
                this._rayHitCollider = closestResult.collider;
                this._interactorEvents?.hoverEntered(this._event);
                this._rayHitCollider.node.emit(XrControlEventType.HOVER_ENTERED, this._event);
            } else {
                this._interactorEvents?.hoverStay(this._event);
            }
        } else {
            // Replace hit object, triggering HOVER_ENTERED
            this._rayHitCollider = closestResult.collider;
            this._interactorEvents?.hoverEntered(this._event);
            this._rayHitCollider.node.emit(XrControlEventType.HOVER_ENTERED, this._event);
        }

        // Send stay, intermediate state, send position point
        this._rayHitCollider.node.emit(XrControlEventType.HOVER_STAY, this._event);
    }

    private _handleHoverExit() {
        this._setLinehover(false);
        // Set ray coordinates
        this._setLinePosition(false);
        // Determine if there was a hit last time
        if (this._rayHitCollider) {
            // HOVER_EXITED is triggered if an object is hit
            this._interactorEvents?.hoverExited(this._event);
            this._rayHitCollider.node.emit(XrControlEventType.HOVER_EXITED, this._event);
            this._rayHitCollider = null;
        }
    }

    private _interactionHit(closestResult: PhysicsRayResult, xrInteractable: IXrInteractable) {
        this._handleHoverEnter(closestResult);
    }

    private _ui3dHit(closestResult: PhysicsRayResult) {
        this._handleHoverEnter(closestResult);
    }

    update() {
        if (!this._line || !this._line.node.active) {
            return;
        }

        const ray = this._getRay();
        const hit = PhysicsSystem.instance.raycastClosest(ray, 0xffffffff, this.maxRayDistance, true);
        if (hit) {
            // Get the coordinates of the collision point
            const closestResult = PhysicsSystem.instance.raycastClosestResult;
            this._event.hitPoint = closestResult.hitPoint;
            // Set ray coordinates
            this._setLinePosition(true);
            const xrInteractable = closestResult.collider?.getComponent(IXrInteractable);
            if (xrInteractable) {
                this._interactionHit(closestResult, xrInteractable);
            } else {
                const ui3DBase = closestResult.collider?.getComponent(RaycastChecker);
                if (ui3DBase) {
                    this._ui3dHit(closestResult);
                } else {
                    this._event.hitPoint = null;
                    this._handleHoverExit();
                }
            }
        } else {
            this._event.hitPoint = null;
            this._handleHoverExit();
        }
    }

    private _setLinehover(isHover: boolean) {
        if (!this._line) {
            return;
        }

        // Ray color change
        if (isHover) {
            this._line.color.color = Color.GREEN.clone();
        } else {
            if (this._lineOriColor) {
                this._line.color.color = this._lineOriColor;
            }
        }
    }

    private _setLinePosition(isWorld: boolean) {
        if (!this._line) {
            return;
        }
        if (isWorld) {
            var pos: any = [];
            this._line.worldSpace = true;
            if (this._rayOriginTransform) {
                pos.push(this.convertToWorldSpace(this._rayOriginTransform, this._linePositions[0]));
            } else {
                pos.push(this.convertToWorldSpace(this.node, this._linePositions[0]));
            }
            pos.push(this._event.hitPoint);
            this._line.positions = pos;

            this.reticle?.setWorldPosition(this._line.positions[1]);
        } else {
            if (this._line.positions !== this._linePositions) {
                this._line.worldSpace = false;
                this._line.positions = this._linePositions;
            }

            if (this._rayOriginTransform) {
                this.reticle?.setWorldPosition(this.convertToWorldSpace(this._rayOriginTransform, this._line.positions[1]));
            } else {
                this.reticle?.setWorldPosition(this.convertToWorldSpace(this.node, this._line.positions[1]));
            }
        }

        this.reticle?.setWorldScale(new Vec3(this._orginalScale).multiplyScalar(Vec3.distance(this._line.positions[0], this._line.positions[1])));
    }

    public uiPressEnter() {
        if(this._judgeUIHit()) {
            this._uiPressCollider?.node.emit(XrControlEventType.UIPRESS_ENTERED, this._event);
            this._pressState = true;
        }
    }

    public uiPressExit() {
        if (this._pressState) {
            this._uiPressCollider?.node.emit(XrControlEventType.UIPRESS_EXITED, this._event);
            this._uiPressCollider = null;
            this._pressState = false;
        }
    }
}
