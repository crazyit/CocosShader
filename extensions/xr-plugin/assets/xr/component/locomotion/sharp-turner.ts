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

import { _decorator, ccenum, Node, input, Input, EventHandle, EventGamepad, Vec2, Quat, Vec3, misc } from 'cc';
const { ccclass, help, menu, property } = _decorator;
import { InputControl_Type, LocomotionBase } from './locomotion-base';
import { XrInputDeviceType } from '../device/xr-controller';

enum EnableTurnAround_Type {
    ON = 0,
    OFF = 1
}

enum Trigger_Type {
    THUMBSTICK_MOVE = 0,
}

ccenum(EnableTurnAround_Type);
ccenum(Trigger_Type);

/**
 * @en
 * Sharp turn control
 * @zh
 * 瞬间转向驱动
 */
@ccclass('cc.SharpTurner')
@help('i18n:cc.SharpTurner')
@menu('XR/Locomotion/SharpTurner')
export class SharpTurner extends LocomotionBase {
    @property({ serializable: true })
    protected _turnAngle: number = 45;
    @property({ serializable: true })
    protected _enableTurnAround: EnableTurnAround_Type = EnableTurnAround_Type.ON;
    @property({ serializable: true })
    protected _activationTimeout: number = 0.5;

    private _waitEnd: boolean = true;
    private _xrSessionNode: Node | null = null;
    private _stickClickState = 0;

    @property({
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.sharp_turner.turnAngle'
    })
    set turnAngle (val) {
        if (val === this._turnAngle) {
            return;
        }
        this._turnAngle = val;
    }
    get turnAngle () {
        return this._turnAngle;
    }

    @property({
        type: EnableTurnAround_Type,
        displayOrder: 5,
        tooltip: 'i18n:xr-plugin.sharp_turner.enableTurnAround'
    })
    set enableTurnAround (val) {
        if (val === this._enableTurnAround) {
            return;
        }
        this._enableTurnAround = val;
    }
    get enableTurnAround () {
        return this._enableTurnAround;
    }

    @property({
        displayOrder: 6,
        tooltip: 'i18n:xr-plugin.sharp_turner.activationTimeout'
    })
    set activationTimeout (val) {
        if (val === this._activationTimeout) {
            return;
        }
        this._activationTimeout = val;
    }
    get activationTimeout () {
        return this._activationTimeout;
    }

    onEnable() {
        this._findChecker();
        input.on(Input.EventType.HANDLE_INPUT, this._dispatchEventHandleInput, this);
        input.on(Input.EventType.GAMEPAD_INPUT, this._dispatchEventHandleInput, this);
    }

    onDisable() {
        input.off(Input.EventType.HANDLE_INPUT, this._dispatchEventHandleInput, this);
        input.off(Input.EventType.GAMEPAD_INPUT, this._dispatchEventHandleInput, this);
    }

    private _dispatchEventHandleInput(event: EventHandle | EventGamepad) {
        let handleInputDevice;
        if (event instanceof EventGamepad) {
            handleInputDevice = event.gamepad;
        } else if (event instanceof EventHandle) {
            handleInputDevice = event.handleInputDevice;
        }
        var stickValue;
        var stickClick;
        if (this.inputDevice?.inputDevice == XrInputDeviceType.Left_Hand) {
            stickValue = handleInputDevice.leftStick.getValue();
            if (this._enableTurnAround === EnableTurnAround_Type.ON) {
                stickClick = handleInputDevice.buttonLeftStick.getValue();
            }
        } else {
            stickValue = handleInputDevice.rightStick.getValue();
            if (this._enableTurnAround === EnableTurnAround_Type.ON) {
                stickClick = handleInputDevice.buttonRightStick.getValue();
            }
        }

        this._turnMove(stickValue);
        if (!this._stickClickState && stickClick) {
            this._turnAround();
        }
        this._stickClickState = stickClick;
    }

    private _turnMove(event: Vec2) {
        if (event.x === 0) {
            return;
        }
        const xrAgentNode = this._checker?.XR_Agent;
        if (xrAgentNode) {
            this._xrSessionNode = xrAgentNode;
        }
        if (!this._xrSessionNode || !this._waitEnd) {
            return;
        }
        const out = new Quat;
        if (event.x < 0) {
            Quat.rotateAround(out, this._xrSessionNode.rotation, Vec3.UP, misc.degreesToRadians(this._turnAngle));
        } else if (event.x > 0) {
            Quat.rotateAround(out, this._xrSessionNode.rotation, Vec3.UP, misc.degreesToRadians(-this._turnAngle));
        }
        this._xrSessionNode.setRotation(out);
        // 延时
        this._waitEnd = false;
        this.scheduleOnce(() => {
            this._waitTimeout()
        }, this._activationTimeout);
    }

    private _turnAround() {
        const xrAgentNode = this._checker?.XR_Agent;
        if (xrAgentNode) {
            this._xrSessionNode = xrAgentNode;
        }
        if (!this._xrSessionNode) {
            return;
        }
        const out = new Quat;
        Quat.rotateAround(out, this._xrSessionNode.rotation, Vec3.UP, misc.degreesToRadians(180));
        this._xrSessionNode.setRotation(out);
    }

    private _waitTimeout() {
        this._waitEnd = true;
    }
}