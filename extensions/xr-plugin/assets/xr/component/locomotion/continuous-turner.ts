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

import { _decorator, Node, Vec2, Input, input, EventHandle, EventGamepad, Vec3, Quat, misc } from 'cc';
const { ccclass, help, menu, property } = _decorator;
import { InputControl_Type, LocomotionBase } from './locomotion-base';
import { XrInputDeviceType } from '../device/xr-controller';

enum TurnDir {
    OFF = 0,
    Left = 1,
    Right = 2
}

/**
 * @en Continuous turn Driver
 * @zh 连续转弯驱动
 */
@ccclass('cc.ContinuousTurner')
@help('i18n:cc.ContinuousTurner')
@menu('XR/Locomotion/ContinuousTurner')
export class ContinuousTurner extends LocomotionBase {
    @property({ serializable: true })
    protected _turnSpeed = 60;

    private _isTurn: TurnDir = TurnDir.OFF;
    private _xrSessionNode: Node | null = null;

    @property({
        displayOrder: 5,
        tooltip: 'i18n:xr-plugin.continuous_turner.turnSpeed'
    })
    set turnSpeed (val) {
        if (val === this._turnSpeed) {
            return;
        }
        this._turnSpeed = val;
    }
    get turnSpeed () {
        return this._turnSpeed;
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
        var value;
        if (this.inputDevice?.inputDevice === XrInputDeviceType.Left_Hand) {
            value = handleInputDevice.leftStick.getValue();
        } else {
            value = handleInputDevice.rightStick.getValue();
        }

        if (value.equals(Vec2.ZERO)) {
            this._turnOff();
        } else {
            this._turnOn(value);
        }
    }

    private _turnOn(event: Vec2) {
        const xrAgentNode = this._checker?.XR_Agent;
        if (xrAgentNode) {
            this._xrSessionNode = xrAgentNode;
        }
        if (event.x < 0) {
            this._isTurn = TurnDir.Left;
        } else if (event.x > 0) {
            this._isTurn = TurnDir.Right;
        } else {
            this._isTurn = TurnDir.OFF;
        }
    }

    private _turnOff() {
        this._isTurn = TurnDir.OFF;
    }

    update(dt: number) {
        if (!this._xrSessionNode || this._isTurn === TurnDir.OFF) {
            return;
        }

        const out = new Quat;
        switch (this._isTurn) {
            case TurnDir.Left:
                Quat.rotateAroundLocal(out, this._xrSessionNode.rotation, Vec3.UP, misc.degreesToRadians(this._turnSpeed * dt));
                break;
            case TurnDir.Right:
                Quat.rotateAroundLocal(out, this._xrSessionNode.rotation, Vec3.UP, misc.degreesToRadians(-this._turnSpeed * dt));
                break;
            default:
                break;
        }

        this._xrSessionNode.setRotation(out);
    }
}
