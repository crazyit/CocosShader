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

import { _decorator, Component, Node, XrKeyboardEventType, Button } from 'cc';
import { xrKeyboardEventInput } from './xr-keyboard-handle';
const { ccclass, help, menu, property } = _decorator;

@ccclass('cc.XRSwitch')
@help('i18n:cc.XRSwitch')
@menu('XR/XRUI/XRSwitch')
export class XRSwitch extends Component {
    @property({ serializable: true })
    private _switch_latin: Node | null = null;
    @property({ serializable: true })
    private _switch_symbol: Node | null = null;
    @property({ serializable: true })
    private _switch_math_symbol: Node | null = null;
    
    @property({
        type: Node,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.xr_switch.switch_latin'
    })
    set switch_latin(val) {
        if (val === this._switch_latin) {
            return;
        }
        this._switch_latin = val;
    }
    get switch_latin() {
        return this._switch_latin;
    }

    @property({
        type: Node,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.xr_switch.switch_symbol'
    })
    set switch_symbol(val) {
        if (val === this._switch_symbol) {
            return;
        }
        this._switch_symbol = val;
    }
    get switch_symbol() {
        return this._switch_symbol;
    }

    @property({
        type: Node,
        displayOrder: 3,
        tooltip: 'i18n:xr-plugin.xr_switch.switch_math_symbol'
    })
    set switch_math_symbol(val) {
        if (val === this._switch_math_symbol) {
            return;
        }
        this._switch_math_symbol = val;
    }
    get switch_math_symbol() {
        return this._switch_math_symbol;
    }

    private _type: string = ""; 

    onEnable() {
        xrKeyboardEventInput.on(XrKeyboardEventType.TO_LATIN, this._switchToTable, this);
        xrKeyboardEventInput.on(XrKeyboardEventType.TO_SYMBOL, this._switchToTable, this);
        xrKeyboardEventInput.on(XrKeyboardEventType.TO_MATH_SYMBOL, this._switchToTable, this);
    }

    onDisable() {
        xrKeyboardEventInput.off(XrKeyboardEventType.TO_LATIN, this._switchToTable, this);
        xrKeyboardEventInput.off(XrKeyboardEventType.TO_SYMBOL, this._switchToTable, this);
        xrKeyboardEventInput.off(XrKeyboardEventType.TO_MATH_SYMBOL, this._switchToTable, this);
    }

    private _switchToTable(type: XrKeyboardEventType) {
        this._type = type;
    }

    update() {
        if (this._type === "") {
            return;
        }
        if (this._type === XrKeyboardEventType.TO_LATIN) {
            if (this._switch_latin) {
                this._switch_latin.active = true;
            }
            if (this._switch_symbol) {
                this._switch_symbol.active = false;
            }
            if (this._switch_math_symbol) {
                this._switch_math_symbol.active = false;
            }
        } else if (this._type === XrKeyboardEventType.TO_SYMBOL) {
            if (this._switch_latin) {
                this._switch_latin.active = false;
            }
            if (this._switch_symbol) {
                this._switch_symbol.active = true;
            }
            if (this._switch_math_symbol) {
                this._switch_math_symbol.active = false;
            }
        } else if (this._type === XrKeyboardEventType.TO_MATH_SYMBOL) {
            if (this._switch_latin) {
                this._switch_latin.active = false;
            }
            if (this._switch_symbol) {
                this._switch_symbol.active = false;
            }
            if (this._switch_math_symbol) {
                this._switch_math_symbol.active = true;
            }
        }

        this._type = "";
    }
}