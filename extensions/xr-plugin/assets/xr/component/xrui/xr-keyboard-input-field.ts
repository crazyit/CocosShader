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

import { _decorator, Node, Component, Input, XrKeyboardEventType } from 'cc';
const { ccclass, help, menu, property } = _decorator;
import { XRKeyboard } from './xr-keyboard';
import { xrKeyboardEventInput, XrKeyCode } from './xr-keyboard-handle';
import { XrKeyboardInput } from './xr-keyboard-input';

@ccclass('cc.XRKeyboardInputField')
@help('i18n:cc.XRKeyboardInputField')
@menu('XR/XRUI/XRKeyboardInputField')
export class XRKeyboardInputField extends Component {
    @property({ serializable: true })
    private _suspendTransform: Node | null = null;
    @property({ serializable: true })
    private _xrKeyboard: XRKeyboard | null = null;

    @property({
        type: Node,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.xr_keyboard_input_field.suspendTransform'
    })
    set suspendTransform(val) {
        if (val === this._suspendTransform) {
            return;
        }
        this._suspendTransform = val;
    }
    get suspendTransform() {
        return this._suspendTransform;
    }

    @property({
        type: XRKeyboard,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.xr_keyboard_input_field.xRKeyboard'
    })
    set xRKeyboard(val) {
        if (val === this._xrKeyboard) {
            return;
        }
        this._xrKeyboard = val;
    }
    get xRKeyboard() {
        return this._xrKeyboard;
    }

    private _keyboardNode: Node | null = null;
    private _xrKeyboardInput: XrKeyboardInput | null = null;
    private _hideFlag = false;

    onEnable() {
        if (this._xrKeyboard) {
            this._xrKeyboard.node.active = false;
        }
        this.node.on('xr-editing-did-began', this._show, this);
    }

    public onDisable () {
        this.node.off('xr-editing-did-began', this._show, this);
        this._hide();
    }

    private _show(len: number, str: string) {
        if (this._xrKeyboard && this._suspendTransform) {
            if (this._keyboardNode) {
                return;
            } else {
                this._keyboardNode = this._xrKeyboard.getXRKeyboardNode();
                if (this._keyboardNode) {
                    this._suspendTransform.addChild(this._keyboardNode);
                    this._xrKeyboard.occupy = true;
                    this._xrKeyboard.node.active = true;
                    const inputNode = this._xrKeyboard.node.getChildByName("input");
                    if (inputNode) {
                        this._xrKeyboardInput = inputNode.getComponentInChildren(XrKeyboardInput);
                        if (this._xrKeyboardInput) {
                            this._xrKeyboardInput.maxContextLength = len;
                            this._xrKeyboardInput.string = str;
                            this._xrKeyboardInput.node.on(XrKeyboardEventType.XR_KEYBOARD_INPUT, this._xrKeyBoardInput, this);
                        }
                    }
                    this._xrKeyboard.showKeyboard();
                } else {
                    return;
                }
            }
        }

        xrKeyboardEventInput.on(Input.EventType.KEY_UP, this._xrKeyBoardUp, this);
        xrKeyboardEventInput.emit(XrKeyboardEventType.XR_KEYBOARD_INIT);
    }

    protected _xrKeyBoardUp(key: XrKeyCode) {
        if (key === XrKeyCode.ENTER) {
            if (this._xrKeyboard) {
                this._xrKeyboard.commitText();
            }
            this._hideFlag = true;
        } else if (key === XrKeyCode.HIDE) {
            this._hideFlag = true;
        }
    }

    update() {
        if (this._hideFlag) {
            this._hide();
            this._hideFlag = false;
        }
    }

    private _hide() {
        if (this._xrKeyboard) {
            this._xrKeyboard.occupy = false;
            this._xrKeyboard.node.active = false;
            this._xrKeyboard.hideKeyboard();
            this._keyboardNode = null;
        }

        if (this._xrKeyboardInput) {
            this._xrKeyboardInput.node.off(XrKeyboardEventType.XR_KEYBOARD_INPUT, this._xrKeyBoardInput, this);
            this._xrKeyboardInput.clear();
        }

        xrKeyboardEventInput.off(Input.EventType.KEY_UP, this._xrKeyBoardUp, this);
    }

    private _xrKeyBoardInput(str: string) {
        this.node.emit(XrKeyboardEventType.XR_KEYBOARD_INPUT, str);
    }
}