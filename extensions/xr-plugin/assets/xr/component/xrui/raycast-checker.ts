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

import { _decorator, Component, Collider, XrUIPressEvent, BoxCollider, UITransform, XrUIPressEventType } from 'cc';
import { XrControlEventType, XrEventHandle } from '../interaction/xr-interactable';
const { ccclass, help, menu, property, executeInEditMode } = _decorator;

/**
 * @en Check XR UI collide with raycast
 * @zh XRUI射线碰撞检测
 */
@ccclass('cc.RaycastChecker')
@help('i18n:cc.RaycastChecker')
@menu('XR/XRUI/RaycastChecker')
@executeInEditMode
export class RaycastChecker extends Component {
    private _collider: Collider | null = null;
    private _event: XrUIPressEvent = new XrUIPressEvent("XrUIPressEvent");
    private _hoverState: string = "";
    private _pressState: string = "";

    onLoad() {
        if (this.node.getComponent(Collider)) {
            return;
        }
        const collider = this.node.addComponent(BoxCollider);
        const uiTransform = this.node.getComponent(UITransform);
        if (uiTransform) {
            collider.center.set(0, 0, 0);
            collider.size.set(uiTransform.width, uiTransform.height, 0.01);
        }  
    }

    onEnable() {
        this._collider = this.node.getComponent(Collider);
        if (this._collider) {
            this._collider.node.on(XrControlEventType.HOVER_ENTERED, this._hoverEnter, this);
            this._collider.node.on(XrControlEventType.HOVER_EXITED, this._hoverExit, this);
            this._collider.node.on(XrControlEventType.HOVER_STAY, this._hoverStay, this);
            this._collider.node.on(XrControlEventType.UIPRESS_ENTERED, this._uiPressEnter, this);
            this._collider.node.on(XrControlEventType.UIPRESS_EXITED, this._uiPressExit, this);
        }
    }

    onDisable() {
        if (this._collider) {
            this._collider.node.off(XrControlEventType.HOVER_ENTERED, this._hoverEnter, this);
            this._collider.node.off(XrControlEventType.HOVER_EXITED, this._hoverExit, this);
            this._collider.node.off(XrControlEventType.HOVER_STAY, this._hoverStay, this);
            this._collider.node.off(XrControlEventType.UIPRESS_ENTERED, this._uiPressEnter, this);
            this._collider.node.off(XrControlEventType.UIPRESS_EXITED, this._uiPressExit, this);
        }
    }
    
    private _hoverEnter(event: XrEventHandle) {
        this._event.deviceType = event.deviceType;
        this._event.hitPoint.set(event.hitPoint);
        this._hoverState = XrControlEventType.HOVER_ENTERED;
    }

    private _hoverExit() {
        this._hoverState = XrControlEventType.HOVER_EXITED;
    }

    private _hoverStay(event: XrEventHandle) {
        this._event.deviceType = event.deviceType;
        this._event.hitPoint.set(event.hitPoint);
        this._hoverState = XrControlEventType.HOVER_STAY;
    }

    private _uiPressEnter(event: XrEventHandle) {
        this._event.deviceType = event.deviceType;
        this._event.hitPoint.set(event.hitPoint);
        this._pressState = XrControlEventType.UIPRESS_ENTERED;
    }

    private _uiPressExit(event: XrEventHandle) {
        this._event.deviceType = event.deviceType;
        this._event.hitPoint.set(event.hitPoint);
        this._pressState = XrControlEventType.UIPRESS_EXITED;
    }

    update() {
        if (this._hoverState === XrControlEventType.HOVER_ENTERED) {
            this.node.emit(XrUIPressEventType.XRUI_HOVER_ENTERED, this._event);
        } else if (this._hoverState === XrControlEventType.HOVER_EXITED) {
            this.node.emit(XrUIPressEventType.XRUI_HOVER_EXITED, this);
        } else if (this._hoverState === XrControlEventType.HOVER_STAY) {
            this.node.emit(XrUIPressEventType.XRUI_HOVER_STAY, this._event);
        }
        this._hoverState = "";

        if (this._pressState === XrControlEventType.UIPRESS_ENTERED) {
            this.node.emit(XrUIPressEventType.XRUI_CLICK, this._event);
        } else if (this._pressState === XrControlEventType.UIPRESS_EXITED) {
            this.node.emit(XrUIPressEventType.XRUI_UNCLICK, this._event.hitPoint);
        }
        this._pressState = "";
    }
}