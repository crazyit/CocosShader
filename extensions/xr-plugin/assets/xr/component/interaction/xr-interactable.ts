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

import { _decorator, Component, Node, Collider, DeviceType, math } from 'cc';
const { property } = _decorator;

/**
     * @en
     * Xr handle event.
     *
     * @zh
     * xr手柄事件。
     */
 export class XrEventHandle extends Event {
    /**
     * @en Event trigger
     * @zh 事件触发者（左右手柄等）
     */
    deviceType: DeviceType;
    /**
     * @en Collision detection point
     * @zh 碰撞检测点
     */
    hitPoint: math.Vec3;
    /**
     * @en Controller model
     * @zh Controller模型
     */
    model: Node | null;
    /**
     * @en Handle events
     * @zh 手柄事件
     */
    eventHandle: number;
    /**
     * @en Trigger Id
     * @zh 触发者Id
     */
    triggerNode: Node | null;
    /**
     * @en The attached node
     * @zh 被附着者节点
     */
    attachNode: Node | null;
    /**
     * @en Whether to force grab
     * @zh 是否强制抓取
     */
    forceGrab: boolean;
}

/**
 * @en The input event type
 * @zh 输入事件类型
 */
 export enum XrControlEventType {
    SELECT_ENTERED = "select-entered",
    SELECT_EXITED = "select-exited",
    SELECT_STAY = "select-stay",
    SELECT_CANCELED = "select-canceled",

    ACTIVATED = "OnActivited",
    DEACTIVITED = "Deactivited",
    ACTIVATE_STAY = "activite-stay",
    ACTIVATE_CANCELED = "activate-canceled",

    UIPRESS_ENTERED = "UI-press-entered",
    UIPRESS_EXITED = "UI-press-exited",
    UIPRESS_STAY = "UI-press-stay",
    UIPRESS_CANCELED = "UI-press-canceled",

    HOVER_ENTERED = "hover-entered",
    HOVER_EXITED = "hover-exited",
    HOVER_STAY = "hover-stay",
    HOVER_CANCELED = "hover-canceled"
}

export enum GrabState {
    Start = "grab_start",
    Stay = "grab_stay",
    End = "grab_end"
}

export enum GrabTriggerState {
    Select_Start = "select_start",
    Select_Stay = "select_stay",
    Select_End = "select_end",
    Activite_Start = "activite_start",
    Activite_Stay = "activite_stay",
    Activite_End = "activite_end"
}

export class IXrInteractable extends Component {
    protected _colliderCom: Collider | null = null;

    protected _triggerNode: Node | null = null;

    set triggerNode(val) {
        if (val === this._triggerNode) {
            return;
        }
        this._triggerNode = val;
    }
    get triggerNode() {
        return this._triggerNode;
    }
}

export class XrInteractable extends IXrInteractable {
    @property({ serializable: true })
    protected _rayReticle: Node | null = null;

    @property({
        type: Node,
        displayOrder: 5,
        tooltip: 'i18n:xr-plugin.xr_interactable.rayReticle'
    })
    set rayReticle (val) {
        if (val === this._rayReticle) {
            return;
        }
        this._rayReticle = val;
    }
    get rayReticle () {
        return this._rayReticle;
    }

    onLoad() {
        this._colliderCom = this.node.getComponent(Collider);
        
        if (!this._colliderCom) {
            return;
        }

        this._colliderCom.node.on(XrControlEventType.HOVER_ENTERED, this._setRayReticle, this);
        this._colliderCom.node.on(XrControlEventType.HOVER_STAY, this._setRayReticle, this);
        this._colliderCom.node.on(XrControlEventType.HOVER_EXITED, this._unsetRayReticle, this);
    }

    onDisable() {
        if (!this._colliderCom) {
            return;
        }
        
        this._colliderCom.node.off(XrControlEventType.HOVER_ENTERED, this._setRayReticle, this);
        this._colliderCom.node.off(XrControlEventType.HOVER_STAY, this._setRayReticle, this);
        this._colliderCom.node.off(XrControlEventType.HOVER_EXITED, this._unsetRayReticle, this);
    }

    protected _setRayReticle(event: XrEventHandle) {
        return;
    }

    protected _unsetRayReticle() {
        if (this._rayReticle) {
            this._rayReticle.active = false;
        }
    }
}