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

import { _decorator, Component, EventHandler as ComponentEventHandler, EventKeyboard, KeyCode, Input, CCBoolean } from 'cc';
import { xrKeyboardEventInput } from './xr-keyboard-handle';
const { ccclass, help, menu, property } = _decorator;

/**
 * @en Virtual Keyboard
 * @zh 虚拟键盘
 */

@ccclass('cc.XRKeyboard')
@help('i18n:cc.XRKeyboard')
@menu('XR/XRUI/XRKeyboard')
export class XRKeyboard extends Component {
    @property({ serializable: true })
    private _disableUIInteractionWhenTyping = true;
    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 3,
        tooltip: 'i18n:xr-plugin.xr_keyboard.onCommitText'
    })
    public onCommitText: ComponentEventHandler[] = [];
    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.xr_keyboard.onShowKeyboard'
    })
    public onShowKeyboard: ComponentEventHandler[] = [];
    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 3,
        tooltip: 'i18n:xr-plugin.xr_keyboard.onHideKeyboard'
    })
    public onHideKeyboard: ComponentEventHandler[] = [];

    @property({
        type: CCBoolean,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.xr_keyboard.disableUIInteractionWhenTyping'
    })
    set disableUIInteractionWhenTyping(val) {
        if (val === this._disableUIInteractionWhenTyping) {
            return;
        }
        this._disableUIInteractionWhenTyping = val;
    }
    get disableUIInteractionWhenTyping() {
        return this._disableUIInteractionWhenTyping;
    }

    private _occupy = false;
    
    set occupy(val) {
        this._occupy = val;
    }

    public getXRKeyboardNode() {
        if (this._occupy) {
            if (this._disableUIInteractionWhenTyping) {
                return null;
            } else {
                xrKeyboardEventInput.emit(Input.EventType.KEY_UP, KeyCode.ENTER);
            }
        }
        return this.node;
    }

    public commitText() {
        ComponentEventHandler.emitEvents(this.onCommitText, this);
    }

    public showKeyboard() {
        ComponentEventHandler.emitEvents(this.onShowKeyboard, this);
    }

    public hideKeyboard() {
        ComponentEventHandler.emitEvents(this.onHideKeyboard, this);
    }
}