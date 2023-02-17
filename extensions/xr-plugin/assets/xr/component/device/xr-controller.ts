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
import { _decorator, Component, ccenum, Node, input, Input, EventGamepad, EventHandle, DeviceType, CCFloat, sys } from 'cc';
import { XrEventHandle } from '../interaction/xr-interactable';
const { ccclass, help, menu, property, executeInEditMode } = _decorator;
import { XrInteractor } from '../interaction/xr-interactor';

export enum XrEventTypeLeft {
    BUTTON_X = 0,
    BUTTON_Y = 2,
    TRIGGER_LEFT = 4,
    GRIP_LEFT = 6,
    THUMBSTICK_LEFT = 8,
    TRIGGER_BTN_LEFT = 10
};

export enum XrEventTypeRight {
    BUTTON_A = 1,
    BUTTON_B = 3,
    TRIGGER_RIGHT = 5,
    GRIP_RIGHT = 7,
    THUMBSTICK_RIGHT = 9,
    TRIGGER_BTN_RIGHT = 11
};

export enum XrInputDeviceType {
    Left_Hand,
    Right_Hand
};

enum InteractorType {
    Start = 0,
    Stay = 1,
    End = 2
};

ccenum(XrEventTypeLeft);
ccenum(XrEventTypeRight);
ccenum(XrInputDeviceType);

export enum InteractorEventType {
    Select = 0,
    Activate = 1,
    UIPress = 2
};

/**
 * @en
 * Accept input from VR device control and map to interactive action.
 * @zh
 * 控制器抽象组件
 */
@ccclass('cc.XRController')
@help('i18n:cc.XRController')
@menu('XR/Device/XRController')
@executeInEditMode
export class XRController extends Component {
    @property({ serializable: true })
    protected _inputDevice: XrInputDeviceType = XrInputDeviceType.Left_Hand;

    @property({ serializable: true })
    protected _selectActionLeft: XrEventTypeLeft = XrEventTypeLeft.GRIP_LEFT;
    @property({ serializable: true })
    protected _selectActionRight: XrEventTypeRight = XrEventTypeRight.GRIP_RIGHT;

    @property({ serializable: true })
    protected _activateActionLeft: XrEventTypeLeft = XrEventTypeLeft.TRIGGER_LEFT;
    @property({ serializable: true })
    protected _activateActionRight: XrEventTypeRight = XrEventTypeRight.TRIGGER_RIGHT;

    @property({ serializable: true })
    protected _UIPressActionLeft: XrEventTypeLeft = XrEventTypeLeft.TRIGGER_LEFT;
    @property({ serializable: true })
    protected _UIPressActionRight: XrEventTypeRight = XrEventTypeRight.TRIGGER_RIGHT;

    @property({ serializable: true })
    protected _axisToPressThreshold = 0.1;

    @property({ serializable: true })
    protected _model: Node | null = null;

    private _xrEventHandle: XrEventHandle = new XrEventHandle("xrEventHandle");
    private _xrInteractor: XrInteractor | null = null;
    private _selectState: InteractorType = InteractorType.End;
    private _activateState: InteractorType = InteractorType.End;
    private _uiPressState: InteractorType = InteractorType.End;
    private _selectTime = 0;

    @property({
        type: XrInputDeviceType,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.xr_controller.inputDevice'
    })
    set inputDevice(val) {
        if (val === this._inputDevice) {
            return;
        }
        this._inputDevice = val;
    }
    get inputDevice() {
        return this._inputDevice;
    }

    @property({
        type: XrEventTypeLeft,
        displayName: "SelectAction",
        visible: (function (this: XRController) {
            return this._inputDevice === XrInputDeviceType.Left_Hand;
        }),
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.xr_controller.selectActionLeft'
    })
    set selectActionLeft(val) {
        if (val === this._selectActionLeft) {
            return;
        }
        this._selectActionLeft = val;
    }
    get selectActionLeft() {
        return this._selectActionLeft;
    }

    @property({
        type: XrEventTypeLeft,
        displayName: "ActivateAction",
        visible: (function (this: XRController) {
            return this._inputDevice === XrInputDeviceType.Left_Hand;
        }),
        displayOrder: 3,
        tooltip: 'i18n:xr-plugin.xr_controller.activateActionLeft'
    })
    set activateActionLeft(val) {
        if (val === this._activateActionLeft) {
            return;
        }
        this._activateActionLeft = val;
    }
    get activateActionLeft() {
        return this._activateActionLeft;
    }

    @property({
        type: XrEventTypeLeft,
        displayName: "UIPressAction",
        visible: (function (this: XRController) {
            return this._inputDevice === XrInputDeviceType.Left_Hand;
        }),
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.xr_controller.UIPressActionLeft'
    })
    set UIPressActionLeft(val) {
        if (val === this._UIPressActionLeft) {
            return;
        }
        this._UIPressActionLeft = val;
    }
    get UIPressActionLeft() {
        return this._UIPressActionLeft;
    }

    @property({
        type: XrEventTypeRight,
        displayName: "SelectAction",
        visible: (function (this: XRController) {
            return this._inputDevice === XrInputDeviceType.Right_Hand;
        }),
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.xr_controller.selectActionRight'
    })
    set selectActionRight(val) {
        if (val === this._selectActionRight) {
            return;
        }
        this._selectActionRight = val;
    }
    get selectActionRight() {
        return this._selectActionRight;
    }

    @property({
        type: XrEventTypeRight,
        displayName: "ActivateAction",
        visible: (function (this: XRController) {
            return this._inputDevice === XrInputDeviceType.Right_Hand;
        }),
        displayOrder: 3,
        tooltip: 'i18n:xr-plugin.xr_controller.activateActionRight'
    })
    set activateActionRight(val) {
        if (val === this._activateActionRight) {
            return;
        }
        this._activateActionRight = val;
    }
    get activateActionRight() {
        return this._activateActionRight;
    }

    @property({
        type: XrEventTypeRight,
        displayName: "UIPressAction",
        visible: (function (this: XRController) {
            return this._inputDevice === XrInputDeviceType.Right_Hand;
        }),
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.xr_controller.UIPressActionRight'
    })
    set UIPressActionRight(val) {
        if (val === this._UIPressActionRight) {
            return;
        }
        this._UIPressActionRight = val;
    }
    get UIPressActionRight() {
        return this._UIPressActionRight;
    }

    @property({
        type: CCFloat,
        displayOrder: 5,
        tooltip: 'i18n:xr-plugin.xr_controller.axisToPressThreshold'
    })
    set axisToPressThreshold(val) {
        if (val === this._axisToPressThreshold) {
            return;
        }
        this._axisToPressThreshold = val;
    }
    get axisToPressThreshold() {
        return this._axisToPressThreshold;
    }

    @property({
        type: Node,
        displayOrder: 6,
        tooltip: 'i18n:xr-plugin.xr_controller.model'
    })
    set model(val) {
        if (val === this._model) {
            return;
        }
        this._model = val;
    }
    get model() {
        return this._model;
    }

    onLoad() {
        if (this.model) {
            const position = this.model.position;
            const rotation = this.model.rotation;
            const scale = this.model.scale;
            this.node.addChild(this.model);
            this.model.setPosition(position);
            this.model.setRotation(rotation);
            this.model.setScale(scale);
            this._xrEventHandle.model = this.model;
        }
    }

    public onEnable() {
        input.on(Input.EventType.HANDLE_INPUT, this._dispatchEventHandleInput, this);
        input.on(Input.EventType.GAMEPAD_INPUT, this._dispatchEventHandleInput, this);

        this._xrInteractor = this.getComponent(XrInteractor);
        if (this._inputDevice == XrInputDeviceType.Left_Hand) {
            if (this._xrInteractor) {
                this._xrInteractor.event.deviceType = DeviceType.Left;
            }
        } else if (this._inputDevice == XrInputDeviceType.Right_Hand) {
            if (this._xrInteractor) {
                this._xrInteractor.event.deviceType = DeviceType.Right;
            }
        }
    }

    public onDisable() {
        input.off(Input.EventType.HANDLE_INPUT, this._dispatchEventHandleInput, this);
        input.off(Input.EventType.GAMEPAD_INPUT, this._dispatchEventHandleInput, this);
    }

    private _dispatchEventHandleInput(event: EventHandle | EventGamepad) {
        let handleInputDevice;
        if (event instanceof EventGamepad) {
            handleInputDevice = event.gamepad;
            if (this._inputDevice == XrInputDeviceType.Left_Hand) {
                this._handleEventGamepad(InteractorEventType.Select, this.selectActionLeft, handleInputDevice);
                this._handleEventGamepad(InteractorEventType.Activate, this.activateActionLeft, handleInputDevice);
                this._handleEventGamepad(InteractorEventType.UIPress, this.UIPressActionLeft, handleInputDevice);
            } else if (this._inputDevice == XrInputDeviceType.Right_Hand) {
                this._handleEventGamepad(InteractorEventType.Select, this.selectActionRight, handleInputDevice);
                this._handleEventGamepad(InteractorEventType.Activate, this.activateActionRight, handleInputDevice);
                this._handleEventGamepad(InteractorEventType.UIPress, this.UIPressActionRight, handleInputDevice);
            }
        } else if (event instanceof EventHandle) {
            handleInputDevice = event.handleInputDevice;
            if (this._inputDevice == XrInputDeviceType.Left_Hand) {
                this._handleEventHandle(InteractorEventType.Select, this.selectActionLeft, handleInputDevice);
                this._handleEventHandle(InteractorEventType.Activate, this.activateActionLeft, handleInputDevice);
                this._handleEventHandle(InteractorEventType.UIPress, this.UIPressActionLeft, handleInputDevice);
            } else if (this._inputDevice == XrInputDeviceType.Right_Hand) {
                this._handleEventHandle(InteractorEventType.Select, this.selectActionRight, handleInputDevice);
                this._handleEventHandle(InteractorEventType.Activate, this.activateActionRight, handleInputDevice);
                this._handleEventHandle(InteractorEventType.UIPress, this.UIPressActionRight, handleInputDevice);
            }
        }
    }

    private _handleEventHandle(type: InteractorEventType, eventType: XrEventTypeLeft | XrEventTypeRight, handleInputDevice: any) {
        var value = 0;
        switch (eventType) {
            case XrEventTypeRight.BUTTON_A:
                value = handleInputDevice.buttonSouth.getValue();
                break;
            case XrEventTypeRight.BUTTON_B:
                value = handleInputDevice.buttonEast.getValue();
                break;
            case XrEventTypeLeft.BUTTON_X:
                value = handleInputDevice.buttonWest.getValue();
                break;
            case XrEventTypeLeft.BUTTON_Y:
                value = handleInputDevice.buttonNorth.getValue();
                break;
            case XrEventTypeLeft.TRIGGER_LEFT:
                value = handleInputDevice.triggerLeft.getValue();
                break;
            case XrEventTypeRight.TRIGGER_RIGHT:
                value = handleInputDevice.triggerRight.getValue();
                break;
            case XrEventTypeLeft.GRIP_LEFT:
                value = handleInputDevice.gripLeft.getValue();
                break;
            case XrEventTypeRight.GRIP_RIGHT:
                value = handleInputDevice.gripRight.getValue();
                break;
            case XrEventTypeLeft.THUMBSTICK_LEFT:
                value = handleInputDevice.buttonLeftStick.getValue();
                break;
            case XrEventTypeRight.THUMBSTICK_RIGHT:
                value = handleInputDevice.buttonRightStick.getValue();
                break;
            case XrEventTypeLeft.TRIGGER_BTN_LEFT:
                value = handleInputDevice.buttonTriggerLeft.getValue();
                break;
            case XrEventTypeRight.TRIGGER_BTN_RIGHT:
                value = handleInputDevice.buttonTriggerRight.getValue();
                break;
            default:
                break;
        }
        this._handleEvent(type, value);
    }

    private _handleEventGamepad(type: InteractorEventType, eventType: XrEventTypeLeft | XrEventTypeRight, gamepad: any) {
        var value = 0;
        switch (eventType) {
            case XrEventTypeRight.BUTTON_A:
                value = gamepad.buttonSouth.getValue();
                break;
            case XrEventTypeRight.BUTTON_B:
                value = gamepad.buttonEast.getValue();
                break;
            case XrEventTypeLeft.BUTTON_X:
                value = gamepad.buttonWest.getValue();
                break;
            case XrEventTypeLeft.BUTTON_Y:
                value = gamepad.buttonNorth.getValue();
                break;
            case XrEventTypeLeft.TRIGGER_LEFT:
                value = gamepad.buttonL2.getValue();
                break;
            case XrEventTypeRight.TRIGGER_RIGHT:
                value = gamepad.buttonR2.getValue();
                break;
            case XrEventTypeLeft.THUMBSTICK_LEFT:
                value = gamepad.buttonLeftStick.getValue();
                break;
            case XrEventTypeRight.THUMBSTICK_RIGHT:
                value = gamepad.buttonRightStick.getValue();
                break;
            default:
                break;
        }
        this._handleEvent(type, value);
    }

    private _handleEvent(type: InteractorEventType, value: number) {
        switch (type) {
            case InteractorEventType.Select:
                this._selectState = this._handleState(type, this._selectState, value);
                break;
            case InteractorEventType.Activate:
                this._activateState = this._handleState(type, this._activateState, value);
                break;
            case InteractorEventType.UIPress:
                this._uiPressState = this._handleState(type, this._uiPressState, value);
                break;
            default:
                break;
        }
    }

    private _handleState(type: InteractorEventType, state, value: number) {
        this._xrEventHandle.eventHandle = value;
        if (value > 0.1) {
            if (state === InteractorType.End) {
                switch (type) {
                    case InteractorEventType.Select:
                            this._xrInteractor?.selectStart(this._xrEventHandle);
                            break;
                    case InteractorEventType.Activate:
                            this._xrInteractor?.activateStart(this._xrEventHandle);
                            break;
                    case InteractorEventType.UIPress:
                            this._xrInteractor?.uiPressEnter(this._xrEventHandle);
                            break;
                    default:
                        break;
                }
                state = InteractorType.Start;
            } else {
                switch (type) {
                    case InteractorEventType.Select:
                            this._xrInteractor?.selectStay(this._xrEventHandle);
                            break;
                    case InteractorEventType.Activate:
                            this._xrInteractor?.activateStay(this._xrEventHandle);
                            break;
                    case InteractorEventType.UIPress:
                            this._xrInteractor?.uiPressStay(this._xrEventHandle);
                            break;
                    default:
                        break;
                }
                state = InteractorType.Stay;
            }
        } else {
            if (state !== InteractorType.End) {
                switch (type) {
                    case InteractorEventType.Select:
                        this._xrInteractor?.selectEnd(this._xrEventHandle);
                        break;
                    case InteractorEventType.Activate:
                        this._xrInteractor?.activateEnd(this._xrEventHandle);
                        break;
                    case InteractorEventType.UIPress:
                        this._xrInteractor?.uiPressExit(this._xrEventHandle);
                        break;
                    default:
                        break;
                }
                state = InteractorType.End;
            }
        }
        return state;
    }
}
