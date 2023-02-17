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

import { _decorator, Node, Vec2, Input, input, EventHandle, EventGamepad, Vec3 } from 'cc';
const { ccclass, help, menu, property } = _decorator;
import { XrInputDeviceType } from '../device/xr-controller';
import { InputControl_Type, LocomotionBase } from './locomotion-base';

/**
 * @en Continuous movement driver
 * @zh 平移运动驱动
 */
@ccclass('cc.ContinuousMover')
@help('i18n:cc.ContinuousMover')
@menu('XR/Locomotion/ContinuousMover')
export class ContinuousMover extends LocomotionBase {
    @property({ serializable: true })
    protected _moveSpeed = 1;
    @property({ serializable: true })
    protected _forwardSource: Node | null = null;

    private _isMove: boolean = false;
    private _xrSessionNode: Node | null = null;
    private _move: Vec2 = new Vec2(0, 0);

    @property({
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.continuous_mover.moveSpeed'
    })
    set moveSpeed (val) {
        if (val === this._moveSpeed) {
            return;
        }
        this._moveSpeed = val;
    }
    get moveSpeed () {
        return this._moveSpeed;
    }

    @property({ 
        type: Node,
        displayOrder: 5,
        tooltip: 'i18n:xr-plugin.continuous_mover.forwardSource'
    })
    set forwardSource (val) {
        if (val === this._forwardSource) {
            return;
        }
        this._forwardSource = val;
    }
    get forwardSource () {
        return this._forwardSource;
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
            this._MoveOff();
        } else {
            this._MoveOn(value);
        }
    }

    private _MoveOn(event: Vec2) {
        const xrAgentNode = this._checker?.XR_Agent;
        if (xrAgentNode) {
            this._xrSessionNode = xrAgentNode;
        }
        this._move.set(event.x, event.y);
        this._isMove = true;
    }

    private _MoveOff() {
        this._isMove = false;
    }

    private _getDirection (x: number, y: number, z: number) {
        const result = new Vec3(x, y, z);
        if (this._forwardSource) {
            Vec3.transformQuat(result, result, this._forwardSource.getWorldRotation());
        } else {
            Vec3.transformQuat(result, result, this.node.getWorldRotation());
        }
        return result;
    }

    update(dt: number) {
        if (!this._xrSessionNode || !this._isMove) {
            return;
        }
        const position = this._xrSessionNode.getPosition();
        Vec3.scaleAndAdd(position, position, this._getDirection(this._move.x, 0, -this._move.y), this._moveSpeed * dt);
        this._xrSessionNode.setPosition(position);
    }
}