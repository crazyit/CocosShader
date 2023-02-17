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
import { _decorator, ccenum, Node, Collider, ITriggerEvent, ICollisionEvent } from 'cc';
const { ccclass, help, menu, property } = _decorator;
import { XrInteractor } from './xr-interactor';
import { XrControlEventType, XrInteractable } from './xr-interactable';
import { InteractorEvents } from '../event/interactor-events';

enum SelectActionTrigger_Type {
    State = 0,
    State_Change = 1,
    Toggle = 2,
    Sticky = 3
}

ccenum(SelectActionTrigger_Type)

/**
 * @en
 * Interact with object directly by controller.
 * @zh
 * 直接交互器组件。
 */
@ccclass('cc.DirectInteractor')
@help('i18n:cc.DirectInteractor')
@menu('XR/Interaction/DirectInteractor')
export class DirectInteractor extends XrInteractor {
    @property({ serializable: true })
    protected _startingSelectedInteractable: Node | null = null;

    private _colliderCom: Collider | null = null;
    private _directHitCollider: Collider | null = null;

    onLoad() {
        this._event.forceGrab = true;
        this._colliderCom = this.node.getComponent(Collider);
        if (!this._colliderCom) {
            console.error("this node does not have");
        }
    }

    onEnable() {
        super.onEnable();
        if (!this._colliderCom) {
            return;
        }
        this._interactorEvents = this.getComponent(InteractorEvents);
        this._setAttachNode();
        if (this._colliderCom.isTrigger) {
            this._colliderCom.on('onTriggerEnter', this._onTriggerEnterCb, this);
            this._colliderCom.on('onTriggerStay', this._onTriggerEnterCb, this);
            this._colliderCom.on('onTriggerExit', this._onTriggerEnterCb, this);
        } else {
            this._colliderCom.on('onCollisionEnter', this._onCollisionEnterCb, this);
            this._colliderCom.on('onCollisionStay', this._onCollisionEnterCb, this);
            this._colliderCom.on('onCollisionExit', this._onCollisionEnterCb, this);
        }
    }

    onDisable() {
        super.onDisable();
        if (!this._colliderCom) {
            return;
        }
        if (this._colliderCom.isTrigger) {
            this._colliderCom.off('onTriggerEnter', this._onTriggerEnterCb, this);
            this._colliderCom.off('onTriggerStay', this._onTriggerEnterCb, this);
            this._colliderCom.off('onTriggerExit', this._onTriggerEnterCb, this);
        } else {
            this._colliderCom.off('onCollisionEnter', this._onCollisionEnterCb, this);
            this._colliderCom.off('onCollisionStay', this._onCollisionEnterCb, this);
            this._colliderCom.off('onCollisionExit', this._onCollisionEnterCb, this);
        }
    }

    protected _setAttachNode() {
        if (this._attachTransform) {
            this._event.attachNode = this._attachTransform;
        } else {
            this._event.attachNode = this.node;
        }
    }

    protected _judgeHit(type: XrControlEventType) {
        if (!this._directHitCollider) {
            return false;
        }
        // Check whether interacTable exists in the collision box
        var xrInteractable = this._directHitCollider?.getComponent(XrInteractable);
        if (xrInteractable) {
            if (type === XrControlEventType.SELECT_ENTERED) {
                this._collider = this._directHitCollider;
                this._activateCollider = null;
            } else if (type === XrControlEventType.ACTIVATED) {
                this._activateCollider = this._directHitCollider;
                this._collider = null;
            }
            this._beTriggerNode = xrInteractable;
            return true;
        }

        return false;
    }

    private _onTriggerEnterCb(event: ITriggerEvent) {
        switch (event.type) {
            case 'onTriggerEnter':
                this._interactorEvents?.hoverEntered(this._event);
                this._directHitCollider = event.otherCollider;
                break;
            case 'onTriggerStay':
                this._interactorEvents?.hoverStay(this._event);
                break;
            case 'onTriggerExit':
                this._interactorEvents?.hoverExited(this._event);
                this._directHitCollider = null;
                break;
            default:
                break;
        }
    }

    private _onCollisionEnterCb(event: ICollisionEvent) {
        switch (event.type) {
            case 'onCollisionEnter':
                this._interactorEvents?.hoverEntered(this._event);
                this._directHitCollider = event.otherCollider;
                break;
            case 'onCollisionStay':
                this._interactorEvents?.hoverStay(this._event);
                break;
            case 'onCollisionExit':
                this._interactorEvents?.hoverExited(this._event);
                this._directHitCollider = null;
                break;
            default:
                break;
        }
    }

    public uiPressEnter() {
        this._directHitCollider?.node.emit(XrControlEventType.UIPRESS_ENTERED, this._event);
    }

    public uiPressExit() {
        this._directHitCollider?.node.emit(XrControlEventType.UIPRESS_EXITED, this._event);
    }
}