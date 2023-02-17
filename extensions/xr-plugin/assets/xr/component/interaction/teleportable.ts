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
import { _decorator, ccenum, Node } from 'cc';
const { ccclass, help, menu, property, executeInEditMode } = _decorator;
import { XrControlEventType, XrEventHandle, XrInteractable } from './xr-interactable';
import { Teleporter } from '../locomotion/teleporter';

enum Teleportable_Type {
    Area = 0,
    Anchor = 1
}

enum TeleportTrigger_Type {
    OnSelectExited = 0,
    OnSelectEntered = 1,
    OnActivated = 2,
    OnDeactivited = 3
}

ccenum(Teleportable_Type);
ccenum(TeleportTrigger_Type);

/**
 * @en
 * Make objects available to be a teleportable area/anchor.
 * @zh
 * 可传送对象组件
 */
@ccclass('cc.Teleportable')
@help('i18n:cc.Teleportable')
@menu('XR/Interaction/Teleportable')
export class Teleportable extends XrInteractable {
    @property({ serializable: true })
    protected _teleportableType: Teleportable_Type = Teleportable_Type.Area;
    @property({ serializable: true })
    protected _teleportAnchorNode: Node | null = null;
    @property({ serializable: true })
    protected _teleportTrigger: TeleportTrigger_Type = TeleportTrigger_Type.OnSelectExited;
    @property({ serializable: true })
    protected _teleporter: Teleporter | null = null;
    
    @property({
        type: Teleportable_Type,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.teleportable.teleportableType'
    })
    set teleportableType (val) {
        if (val === this._teleportableType) {
            return;
        }
        this._teleportableType = val;
    }
    get teleportableType () {
        return this._teleportableType;
    }

    @property({
        type: Node,
        displayOrder: 2,
        visible: (function (this: Teleportable) {
            return this._teleportableType === Teleportable_Type.Anchor;
        }),
        tooltip: 'i18n:xr-plugin.teleportable.teleportAnchorNode'
    })
    set teleportAnchorNode (val) {
        if (val === this._teleportAnchorNode) {
            return;
        }
        this._teleportAnchorNode = val;
    }
    get teleportAnchorNode () {
        return this._teleportAnchorNode;
    }

    @property({
        type: TeleportTrigger_Type,
        displayOrder: 5,
        tooltip: 'i18n:xr-plugin.teleportable.teleportTrigger'
    })
    set teleportTrigger (val) {
        if (val === this._teleportTrigger) {
            return;
        }
        this._teleportTrigger = val;
    }
    get teleportTrigger () {
        return this._teleportTrigger;
    }

    @property({
        type: Teleporter,
        displayOrder: 6,
        tooltip: 'i18n:xr-plugin.teleportable.teleporter'
    })
    set teleporter (val) {
        if (val === this._teleporter) {
            return;
        }
        this._teleporter = val;
    }
    get teleporter () {
        return this._teleporter;
    }

    public onEnable() {
        if (!this._colliderCom) {
            return;
        }
        switch (this._teleportTrigger) {
            case TeleportTrigger_Type.OnSelectExited:
            case TeleportTrigger_Type.OnSelectEntered:
                this._colliderCom.node.on(XrControlEventType.SELECT_ENTERED, this._selectEntered, this);
                this._colliderCom.node.on(XrControlEventType.SELECT_EXITED, this._selectExited, this);
                break;
            case TeleportTrigger_Type.OnActivated:
            case TeleportTrigger_Type.OnDeactivited:
                this._colliderCom.node.on(XrControlEventType.ACTIVATED, this._teleportAction, this);
                this._colliderCom.node.on(XrControlEventType.DEACTIVITED, this._teleportAction, this);
                break;
            default:
                break;
        }
        
        if (this.teleportableType === Teleportable_Type.Area) {
            this._colliderCom.node.on(XrControlEventType.HOVER_STAY, this._setRayReticle, this);
        }
    }

    public onDisable() {
        if (!this._colliderCom) {
            return;
        }
        switch (this._teleportTrigger) {
            case TeleportTrigger_Type.OnSelectExited:
            case TeleportTrigger_Type.OnSelectEntered:
                this._colliderCom.node.off(XrControlEventType.SELECT_ENTERED, this._selectEntered, this);
                this._colliderCom.node.off(XrControlEventType.SELECT_EXITED, this._selectExited, this);
                break;
            case TeleportTrigger_Type.OnActivated:
            case TeleportTrigger_Type.OnDeactivited:
                this._colliderCom.node.off(XrControlEventType.ACTIVATED, this._teleportAction, this);
                this._colliderCom.node.off(XrControlEventType.DEACTIVITED, this._teleportAction, this);
                break;
            default:
                break;
        }
        
        if (this.teleportableType === Teleportable_Type.Area) {
            this._colliderCom.node.off(XrControlEventType.HOVER_STAY, this._setRayReticle, this);
        }
    }

    protected _selectEntered(event: XrEventHandle) {
        this._triggerNode = event.triggerNode;
        if (this._teleportTrigger === TeleportTrigger_Type.OnSelectEntered) {
            this._teleportAction(event);
        }
    }

    protected _selectExited(event: XrEventHandle) {
        this._triggerNode = null;
        if (this._teleportTrigger === TeleportTrigger_Type.OnSelectExited) {
            this._teleportAction(event);
        }
    }

    protected _activited(event: XrEventHandle) {
        this._triggerNode = event.triggerNode;
        if (this._teleportTrigger === TeleportTrigger_Type.OnActivated) {
            this._teleportAction(event);
        }
    }

    protected _deactivited(event: XrEventHandle) {
        this._triggerNode = null;
        if (this._teleportTrigger === TeleportTrigger_Type.OnDeactivited) {
            this._teleportAction(event);
        }
    }

    protected _setRayReticle(event: XrEventHandle) {
        if (!this._rayReticle) {
            return;
        }
        
        if (this._teleportableType === Teleportable_Type.Anchor) {
                if (this._teleportAnchorNode) {
                    this._rayReticle.setWorldPosition(this._teleportAnchorNode.getWorldPosition());
                } else if (event.attachNode) {
                    this._rayReticle.setWorldPosition(this.node.getWorldPosition());
                }
        } else {
            if (event.hitPoint) {
                this._rayReticle.setWorldPosition(event.hitPoint);
            }
        }       
        this._rayReticle.active = true;
    }

    private _teleportToModel(event: XrEventHandle) {
        if (this._rayReticle) {
            this._rayReticle.active = false;
        }

        if (this._teleportableType === Teleportable_Type.Anchor) {
            if (this._teleporter?.checker?.XR_Agent) {
                if (this._teleportAnchorNode) {
                    this._teleporter.checker.XR_Agent.setWorldPosition(this._teleportAnchorNode.getWorldPosition());
                } else if (event.attachNode) {
                    this._teleporter.checker.XR_Agent.setWorldPosition(this.node.getWorldPosition());
                }
            }
        } else {
            if (this._teleporter?.checker?.XR_Agent && event.hitPoint) {
                this._teleporter.checker.XR_Agent.setWorldPosition(event.hitPoint);
            }
        }        
    }

    protected _teleportAction(event: XrEventHandle) {
        if (!event || !this._colliderCom || !event.hitPoint) {
            return;
        }

        this._teleportToModel(event);
    }
}