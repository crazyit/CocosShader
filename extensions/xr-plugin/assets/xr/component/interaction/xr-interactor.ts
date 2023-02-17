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
const { property } = _decorator;
import { _decorator, Component, ccenum, Node, Collider } from 'cc';
import { GrabState, GrabTriggerState, IXrInteractable, XrControlEventType, XrEventHandle } from './xr-interactable';
import { InteractorEvents } from '../event/interactor-events';

export enum SelectActionTrigger_Type {
    State = 0,
    State_Change = 1,
    Toggle = 2,
    Sticky = 3
}

ccenum(SelectActionTrigger_Type)

export class XrInteractor extends Component {
    @property({ serializable: true })
    protected _attachTransform: Node | null = null;
    @property({ serializable: true })
    protected _selectActionTrigger: SelectActionTrigger_Type = SelectActionTrigger_Type.State;

    protected _grabState: GrabState = GrabState.End;
    protected _selectValue = 0;
    protected _activateValue = 0;

    protected _triggerState: boolean = false;
    protected _triggerToggleState: boolean = false;
    protected _triggerStickyState: boolean = false;
    protected _activateTriggerState: boolean = false;
    protected _activateTriggerToggleState: boolean = false;
    protected _activateTriggerStickyState: boolean = false;
    protected _selectState: boolean = false;
    protected _activateState: boolean = false;
    protected _interactorEvents: InteractorEvents | null = null;
    protected _event = new XrEventHandle("XrInteractor");
    protected _collider: Collider | null = null;
    protected _activateCollider: Collider | null = null;
    protected _uiPressCollider: Collider | null = null;
    protected _accupyLine: boolean = false;

    // The triggered object Interactable
    protected _beTriggerNode: IXrInteractable | null = null;

    @property({
        type: Node,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.xr_interactor.attachTransform'
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
        type: SelectActionTrigger_Type,
        displayOrder: 12,
        tooltip: 'i18n:xr-plugin.xr_interactor.selectActionTrigger'
    })
    set selectActionTrigger(val) {
        if (val === this._selectActionTrigger) {
            return;
        }
        this._selectActionTrigger = val;
    }
    get selectActionTrigger() {
        return this._selectActionTrigger;
    }

    set event(val) {
        if (val === this._event) {
            return;
        }
        this._event = val;
    }
    get event() {
        return this._event;
    }

    onEnable() {
        this.node.on(GrabState.Start, this._grabStart, this);
        this.node.on(GrabState.Stay, this._grabStay, this);
        this.node.on(GrabState.End, this._grabEnd, this);

        this._event.triggerNode = this.node;
    }

    onDisable() {
        this.node.off(GrabState.Start, this._grabStart, this);
        this.node.off(GrabState.Stay, this._grabStay, this);
        this.node.off(GrabState.End, this._grabEnd, this);
    }

    private _grabStart() {
        this._grabState = GrabState.Start;
    }

    private _grabStay() {
        this._grabState = GrabState.Stay;
    }

    private _grabEnd() {
        this._grabState = GrabState.End;
        this._selectState = false;
        this._activateState = false;
    }

    protected _judgeHit(type: XrControlEventType) {
        return false;
    }

    protected _judgeTrigger() {
        // Determine if the object is captured
        if (!this._beTriggerNode) {
            return false;
        }
        // Has captured the object, judge the captured object, its grasp is its own
        if (this._beTriggerNode.triggerNode === this.node) {
            return true;
        }
        return false;
    }

    protected _emitSelectEntered(type: XrControlEventType) {
        if (type === XrControlEventType.SELECT_ENTERED) {
            this._collider?.node.emit(GrabTriggerState.Select_Start, this._event);
        } else if (type === XrControlEventType.ACTIVATED) {
            this._activateCollider?.node.emit(GrabTriggerState.Activite_Start, this._event);
        }
    }

    private _emitSelectEnd(type: XrControlEventType) {
        if (type === XrControlEventType.SELECT_EXITED) {
            this._collider?.node.emit(GrabTriggerState.Select_End, this._event);
            this._collider = null;
        } else if (type === XrControlEventType.DEACTIVITED) {
            this._activateCollider?.node.emit(GrabTriggerState.Activite_End, this._event);
            this._activateCollider = null;
        }
    }

    private _interactorStart(event: XrEventHandle, state: boolean, typeEnter: XrControlEventType, typeEnd: XrControlEventType) {
        this._event.model = event.model;
        this._event.eventHandle = event.eventHandle;
        switch (this._selectActionTrigger) {
            case SelectActionTrigger_Type.State:
            case SelectActionTrigger_Type.State_Change:
                if (this._grabState === GrabState.End) {
                    if (this._judgeHit(typeEnter)) {
                        this._emitSelectEntered(typeEnter);
                    }
                }
                break;
            case SelectActionTrigger_Type.Toggle:
                if (this._grabState === GrabState.End) {
                    if (this._judgeHit(typeEnter)) {
                        this._emitSelectEntered(typeEnter);
                    }
                } else if (this._grabState === GrabState.Start && state) {
                    this._emitSelectEnd(typeEnd);
                    state = false;
                }
                break;
            case SelectActionTrigger_Type.Sticky:
                if (this._grabState === GrabState.End) {
                    if (this._judgeHit(typeEnter)) {
                        this._emitSelectEntered(typeEnter);
                    }
                }
                break;
            default:
                break;
        }

        return state;
    }

    private _interactorStay(event: XrEventHandle, typeEnter: XrControlEventType) {
        if (this._selectActionTrigger === SelectActionTrigger_Type.State) {
            this._event.model = event.model;
            this._event.eventHandle = event.eventHandle;
            if (this._grabState === GrabState.End) {
                if (this._judgeHit(typeEnter)) {
                    this._emitSelectEntered(typeEnter);
                }
            }
        }
    }

    private _interactorEnd(event: XrEventHandle, state: boolean, typeEnd: XrControlEventType) {
        this._event.model = event.model;
        this._event.eventHandle = event.eventHandle;
        switch (this._selectActionTrigger) {
            case SelectActionTrigger_Type.State:
            case SelectActionTrigger_Type.State_Change:
                if (this._grabState === GrabState.Start) {
                    this._emitSelectEnd(typeEnd);
                }
                break;
            case SelectActionTrigger_Type.Toggle:
                if (this._grabState === GrabState.Start) {
                    state = true;
                }
                break;
            case SelectActionTrigger_Type.Sticky:
                if (this._grabState === GrabState.Start) {
                    if (state) {
                        this._emitSelectEnd(typeEnd);
                        state = false;
                    } else {
                        state = true;
                    }
                }
                break;
            default:
                break;
        }

        return state;
    }

    public selectStart(event: XrEventHandle) {
        this._interactorEvents?.selectEntered(this._event);
        this._selectState = this._interactorStart(event, this._selectState, XrControlEventType.SELECT_ENTERED, XrControlEventType.SELECT_EXITED);
        this._collider?.node.emit(XrControlEventType.SELECT_ENTERED, this._event);
    }

    public selectStay(event: XrEventHandle) {
        this._interactorEvents?.selectStay(this._event);
        this._interactorStay(event, XrControlEventType.SELECT_ENTERED);
        this._collider?.node.emit(XrControlEventType.SELECT_STAY, this._event);
    }

    public selectEnd(event: XrEventHandle) {
        this._interactorEvents?.selectExited(this._event);
        this._collider?.node.emit(XrControlEventType.SELECT_EXITED, this._event);
        this._selectState = this._interactorEnd(event, this._selectState, XrControlEventType.SELECT_EXITED);
    }

    public activateStart(event: XrEventHandle) {
        this._activateState = this._interactorStart(event, this._activateState, XrControlEventType.ACTIVATED, XrControlEventType.DEACTIVITED);
        this._activateCollider?.node.emit(XrControlEventType.ACTIVATED, this._event);
    }

    public activateStay(event: XrEventHandle) {
        this._interactorStay(event, XrControlEventType.ACTIVATED);
        this._activateCollider?.node.emit(XrControlEventType.ACTIVATE_STAY, this._event);
    }

    public activateEnd(event: XrEventHandle) {
        this._activateCollider?.node.emit(XrControlEventType.DEACTIVITED, this._event);
        this._activateState = this._interactorEnd(event, this._activateState, XrControlEventType.DEACTIVITED);
    }

    public uiPressEnter(event: XrEventHandle) {
        this._event.deviceType = event.deviceType;
        this._uiPressCollider?.node.emit(XrControlEventType.UIPRESS_ENTERED, this._event);
    }

    public uiPressStay(event: XrEventHandle) {
        this._event.deviceType = event.deviceType;
        this._uiPressCollider?.node.emit(XrControlEventType.UIPRESS_STAY, this._event);
    }

    public uiPressExit(event: XrEventHandle) {
        this._event.deviceType = event.deviceType;
        this._uiPressCollider?.node.emit(XrControlEventType.UIPRESS_EXITED, this._event);
    }
}