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
import { _decorator, Collider, EventHandler as ComponentEventHandler } from 'cc';
const { ccclass, help, menu, property } = _decorator;
import { IXrInteractable, XrControlEventType, XrEventHandle } from '../interaction/xr-interactable';

/**
 * @en
 * Event of interactable.
 * @zh
 * 可交互对象事件组件。
 */
@ccclass('cc.InteractableEvents')
@help('i18n:cc.InteractableEvents')
@menu('XR/Event/InteractableEvents')
export class InteractableEvents extends IXrInteractable {
    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.interactable_events.hoverEnterEvents'
    })
    public hoverEnterEvents: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.interactable_events.hoverStayEvents'
    })
    public hoverStayEvents: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 3,
        tooltip: 'i18n:xr-plugin.interactable_events.hoverExitEvents'
    })
    public hoverExitEvents: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.interactable_events.selectEnterEvents'
    })
    public selectEnterEvents: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 5,
        tooltip: 'i18n:xr-plugin.interactable_events.selectStayEvents'
    })
    public selectStayEvents: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 6,
        tooltip: 'i18n:xr-plugin.interactable_events.selectExitEvents'
    })
    public selectExitEvents: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 7,
        tooltip: 'i18n:xr-plugin.interactable_events.activeEnterEvents'
    })
    public activeEnterEvents: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 8,
        tooltip: 'i18n:xr-plugin.interactable_events.activeStayEvents'
    })
    public activeStayEvents: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 9,
        tooltip: 'i18n:xr-plugin.interactable_events.activeExitEvents'
    })
    public activeExitEvents: ComponentEventHandler[] = [];

    onLoad () {
        this._colliderCom = this.node.getComponent(Collider);
        if (!this._colliderCom) {
            console.error("this node does not have");
        }
    }

    public onEnable() {
        this.node.on(XrControlEventType.HOVER_ENTERED, this._hoverEntered, this);
        this.node.on(XrControlEventType.HOVER_STAY, this._hoverStay, this);
        this.node.on(XrControlEventType.HOVER_EXITED, this._hoverExited, this);
        this.node.on(XrControlEventType.SELECT_ENTERED, this._selectEntered, this);
        this.node.on(XrControlEventType.SELECT_STAY, this._selectStay, this);
        this.node.on(XrControlEventType.SELECT_EXITED, this._selectExited, this);
        this.node.on(XrControlEventType.ACTIVATED, this._activeEntered, this);
        this.node.on(XrControlEventType.ACTIVATE_STAY, this._activeStay, this);
        this.node.on(XrControlEventType.DEACTIVITED, this._activeExited, this);
    }

    public onDisable() {
        this.node.off(XrControlEventType.HOVER_ENTERED, this._hoverEntered, this);
        this.node.off(XrControlEventType.HOVER_STAY, this._hoverEntered, this);
        this.node.off(XrControlEventType.HOVER_EXITED, this._hoverExited, this);
        this.node.off(XrControlEventType.SELECT_ENTERED, this._selectEntered, this);
        this.node.off(XrControlEventType.SELECT_STAY, this._selectEntered, this);
        this.node.off(XrControlEventType.SELECT_EXITED, this._selectExited, this);
        this.node.off(XrControlEventType.ACTIVATED, this._activeEntered, this);
        this.node.off(XrControlEventType.ACTIVATE_STAY, this._activeStay, this);
        this.node.off(XrControlEventType.DEACTIVITED, this._activeExited, this);
    }

    protected _hoverEntered(event?: XrEventHandle) {
        ComponentEventHandler.emitEvents(this.hoverEnterEvents, event);
    }

    protected _hoverStay(event?: XrEventHandle) {
        ComponentEventHandler.emitEvents(this.hoverStayEvents, event);
    }

    protected _hoverExited(event?: XrEventHandle) {
        ComponentEventHandler.emitEvents(this.hoverExitEvents, event);
    }

    protected _selectEntered(event?: XrEventHandle) {
        ComponentEventHandler.emitEvents(this.selectEnterEvents, event);
    }

    protected _selectStay(event?: XrEventHandle) {
        ComponentEventHandler.emitEvents(this.selectStayEvents, event);
    }

    protected _selectExited(event?: XrEventHandle) {
        ComponentEventHandler.emitEvents(this.selectExitEvents, event);
    }

    protected _activeEntered(event?: XrEventHandle) {
        ComponentEventHandler.emitEvents(this.activeEnterEvents, event);
    }

    protected _activeStay(event?: XrEventHandle) {
        ComponentEventHandler.emitEvents(this.activeStayEvents, event);
    }

    protected _activeExited(event?: XrEventHandle) {
        ComponentEventHandler.emitEvents(this.activeExitEvents, event);
    }
}