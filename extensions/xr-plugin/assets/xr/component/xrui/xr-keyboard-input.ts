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

import { _decorator, Node, Component, Label, Graphics, Input, Vec3, XrKeyboardEventType } from 'cc';
import { xrKeyboardEventInput, XrKeyCode } from './xr-keyboard-handle';

const MAX_SIZE = 2048;

enum StringChangeType {
    INIT = 0,
    DELETE = 1,
    ADD = 2
}

export class XrKeyboardInput extends Component {
    private _string = "";
    private _label: Label | null = null;
    private _cursor: Graphics | null = null;
    private _cursorNode: Node = new Node;
    private _stringWidths: number[] = [];
    private _capsLock = false;
    private _maxContextLength = 0;
    private _pos = -1;

    set maxContextLength(val) {
        this._maxContextLength = val;
    }
    get maxContextLength() {
        return this._maxContextLength;
    }

    set string(val) {
        for (let i = 0; i < val.length; i++) {
            this.addString(val[i]);
        }
    }
    get string() {
        return this._string;
    }

    onEnable() {
        this._label = this.node.getComponentInChildren(Label);
        if (this._label) {
            this._label.node.addChild(this._cursorNode);
            this._cursor = this._cursorNode.addComponent(Graphics);
            this._cursor.lineWidth = 8;
            this._cursor.color.fromHEX('#ffffff');
            this._cursor.fillColor.fromHEX('#ffffff');
            this._cursor.strokeColor.fromHEX('#ffffff');
            if (this._label.node._uiProps.uiTransformComp) {
                this._cursorNode.setPosition(0, -this._label.node._uiProps.uiTransformComp.height / 2, 0);
            }
            this._cursor.moveTo(0, - this._label.fontSize / 2);
            this._cursor.lineTo(0, this._label.fontSize / 2);
            this._cursor.stroke();
            this._cursor.fill();

            this.updateStringWidth(this._label.string, StringChangeType.INIT);
        }

        xrKeyboardEventInput.on(Input.EventType.KEY_UP, this._keyUp, this);
        xrKeyboardEventInput.on(XrKeyboardEventType.XR_CAPS_LOCK, this._xrCapsLock, this);
        xrKeyboardEventInput.on(XrKeyboardEventType.XR_KEYBOARD_INIT, this._init, this);
    }

    onDisable() {
        xrKeyboardEventInput.off(Input.EventType.KEY_UP, this._keyUp, this);
        xrKeyboardEventInput.off(XrKeyboardEventType.XR_CAPS_LOCK, this._xrCapsLock, this);
        xrKeyboardEventInput.off(XrKeyboardEventType.XR_KEYBOARD_INIT, this._init, this);
    }

    protected _init() {
        this._capsLock = false;
    }

    protected _xrCapsLock() {
        this._capsLock = !this._capsLock;
    }

    public moveCursor(point: Vec3) {
        if (this._stringWidths.length <= 0 || !this._label) {
            return;
        }
        let pos = new Vec3;
        this._label.node.inverseTransformPoint(pos, point);
        var stringWidth = 0;
        var posx = pos.x;
        if (this._label.contentWidth >= MAX_SIZE) {
            posx = pos.x + this._label.contentWidth - MAX_SIZE;
        }

        for (var i = 0; i < this._stringWidths.length; i++) {
            if (this._stringWidths[i] > posx) {
                break;
            }
        }
        this._pos = i - 1;
        stringWidth = (this._pos === -1) ? 0 : this._stringWidths[this._pos];

        if (this._label.contentWidth >= MAX_SIZE) {
            stringWidth = stringWidth - (this._label.contentWidth - MAX_SIZE);
        }

        this._cursorNode.setPosition(stringWidth, this._cursorNode.position.y, this._cursorNode.position.z);
    }

    protected _keyUp(key: XrKeyCode) {
        if (key === XrKeyCode.ENTER) {
            this.node.emit(XrKeyboardEventType.XR_KEYBOARD_INPUT, this._string);
        } else if (key === XrKeyCode.BACKSPACE) {
            if (this._pos >= 0) {
                this._string = this._string.substring(0, this._pos) + this._string.substring(this._pos + 1, this._string.length);
                this._pos--;
                this.updateStringWidth(this._string, StringChangeType.DELETE);
            }
        } else if (key === XrKeyCode.CAPS_LOCK || key === XrKeyCode.HIDE) {

        } else {
            if (this._string.length < this._maxContextLength) {
                let code;
                if (!this._capsLock && key > 64 && key < 91) {
                    code = String.fromCharCode(key + 32);
                } else if (key === XrKeyCode.SHIFT_LEFT || key === XrKeyCode.SHIFT_RIGHT) {
                    return;
                } else if (key === XrKeyCode.COMMA) {
                    code = String.fromCharCode(44);
                } else {
                    code = String.fromCharCode(key);
                }
                this.addString(code);
            }
        }
    }

    private addString(code) {
        this._string = this._string.substring(0, this._pos + 1) + code + this._string.substring(this._pos + 1, this._string.length);
        this._pos++;
        this.updateStringWidth(this._string, StringChangeType.ADD);
    }

    public updateStringWidth(str: string, type: StringChangeType) {
        if (!this._label) {
            return;
        }
        this._label.string = str;
        this._label.updateRenderData(true);
        if (type === StringChangeType.DELETE) {
            this._stringDeleteWidth();
        } else {
            if (type === StringChangeType.ADD) {
                this._stringAddWidth();
            } else {
                this._stringInitWidth();
            }
        }

        let stringWidth = (this._pos === -1) ? 0 : this._stringWidths[this._pos];
        stringWidth = this._label.contentWidth > MAX_SIZE ? stringWidth - (this._label.contentWidth - MAX_SIZE) : stringWidth;

        this._cursorNode.setPosition(stringWidth, this._cursorNode.position.y, this._cursorNode.position.z);
    }

    private _stringDeleteWidth() {
        let d = 0;
        if (this._pos === -1) {
            d = this._stringWidths[this._pos + 1];
        } else {
            d = this._stringWidths[this._pos + 1] - this._stringWidths[this._pos];
        }
        for (let i = this._pos + 1; i < this._stringWidths.length - 1; ++i) {
            this._stringWidths[i] = this._stringWidths[i + 1] - d;
        }
        this._stringWidths.pop();
    }

    private _stringAddWidth() {
        if (!this._label) {
            return;
        }
        if (this._stringWidths.length > 0) {
            const d = this._label.contentWidth - this._stringWidths[this._stringWidths.length - 1];
            for (let i = this._stringWidths.length - 1; i > this._pos - 1; --i) {
                if (i === 0) {
                    this._stringWidths[i] = d;
                } else {
                    this._stringWidths[i] = this._stringWidths[i - 1] + d;
                }
            }
        }
        this._stringWidths.push(this._label.contentWidth);
    }

    private _stringInitWidth() {
        this._pos = this._stringWidths.length - 1;
    }

    public clear() {
        let len = this._string.length;
        this._pos = len - 1;
        // const eventKeyboard = new EventKeyboard(XrKeyCode.BACKSPACE, Input.EventType.KEY_UP);
        for (let i = 0; i < len; i++) {
            this._keyUp(XrKeyCode.BACKSPACE);
        }
    }
}