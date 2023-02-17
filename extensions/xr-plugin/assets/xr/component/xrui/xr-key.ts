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

import { _decorator, ccenum, Component, XrUIPressEventType, Vec3, Button, Input, Node, XrKeyboardEventType } from 'cc';
import { xrKeyboardEventInput, XrKeyCode } from './xr-keyboard-handle';
const { ccclass, help, menu, property } = _decorator;
import { XrKeyboardInput } from './xr-keyboard-input';

ccenum(XrKeyCode);

@ccclass('cc.XRKey')
@help('i18n:cc.XRKey')
@menu('XR/XRUI/XRKey')
export class XRKey extends Component {
    @property({ serializable: true })
    private _key: XrKeyCode = XrKeyCode.NONE;

    private _lowerNode: Node | null = null;
    private _capitalNode: Node | null = null;

    @property({
        type: XrKeyCode,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.xr_key.key'
    })
    set key(val) {
        if (val === this._key) {
            return;
        }
        this._key = val;
    }
    get key() {
        return this._key;
    }

    private _button: Button | null = null;
    private _capsLock = false;
    // only input use
    private _xrKeyboardInput: XrKeyboardInput | null = null;

    onLoad() {
        this._button = this.node.getComponent(Button);
        if (this._key === XrKeyCode.NONE) {
            if (!this._xrKeyboardInput) {
                this._xrKeyboardInput = this.node.addComponent(XrKeyboardInput);
            }
        }
    }

    onEnable() {
        this._lowerNode = this.node.getChildByName("lower");
        this._capitalNode = this.node.getChildByName("capital");
        this.node.on(XrUIPressEventType.XRUI_CLICK, this._xrUIClick, this);
        this.node.on(XrUIPressEventType.XRUI_UNCLICK, this._xrUIUnClick, this);
        xrKeyboardEventInput.on(XrKeyboardEventType.XR_KEYBOARD_INIT, this._init, this);
        xrKeyboardEventInput.on(XrKeyboardEventType.XR_CAPS_LOCK, this._xrCapsLock, this);
    }

    onDisable() {
        this.node.off(XrUIPressEventType.XRUI_CLICK, this._xrUIClick, this);
        this.node.off(XrUIPressEventType.XRUI_UNCLICK, this._xrUIUnClick, this);
        xrKeyboardEventInput.off(XrKeyboardEventType.XR_KEYBOARD_INIT, this._init, this);
        xrKeyboardEventInput.off(XrKeyboardEventType.XR_CAPS_LOCK, this._xrCapsLock, this);
    }

    protected _xrUIClick() {
        if (this._key !== XrKeyCode.NONE) {
            xrKeyboardEventInput.emit(Input.EventType.KEY_DOWN, this._key);
        }
    }

    protected _xrUIUnClick(point: Vec3) {
        if (this._key === XrKeyCode.NONE) {
            this._xrKeyboardInput?.moveCursor(point);
        } else if (this._key === XrKeyCode.F1) {
            xrKeyboardEventInput.emit(XrKeyboardEventType.TO_SYMBOL, XrKeyboardEventType.TO_SYMBOL);
        } else if (this._key === XrKeyCode.F2) {
            xrKeyboardEventInput.emit(XrKeyboardEventType.TO_LATIN, XrKeyboardEventType.TO_LATIN);
        } else {
            xrKeyboardEventInput.emit(Input.EventType.KEY_UP, this._key);
            if (this._key === XrKeyCode.CAPS_LOCK) {
                xrKeyboardEventInput.emit(XrKeyboardEventType.XR_CAPS_LOCK, this._key);
            }
        }
    }

    protected _init() {
        this._capsLock = false;
        if (!this._button) {
            return;
        }
    }

    protected _xrCapsLock() {
        if (!this._button) {
            return;
        }

        if (this._key === XrKeyCode.CAPS_LOCK) {
            const sprite = this._button.normalSprite;
            this._button.normalSprite = this._button.pressedSprite;
            this._button.pressedSprite = sprite;
        } else if (this._key > 64 && this._key < 91) {
            if (this._capsLock) {
                if (this._lowerNode) {
                    this._lowerNode.active = true;
                }
                if (this._capitalNode) {
                    this._capitalNode.active = false;
                }
            } else {
                if (this._lowerNode) {
                    this._lowerNode.active = false;
                }
                if (this._capitalNode) {
                    this._capitalNode.active = true;
                }
            }
        }
        
        this._capsLock = !this._capsLock;
    }
}