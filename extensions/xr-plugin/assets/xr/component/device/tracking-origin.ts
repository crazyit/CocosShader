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

import { ccenum, Component, _decorator, Node, sys } from 'cc';
import { xrInterface } from '../interface/xr-interface';
const { ccclass, help, menu, property } = _decorator;

 enum TrackingOriginMode_Type {
    Unbond = 0,
    Device = 1, 
    Floor = 2
}

ccenum(TrackingOriginMode_Type);
 
/**
 * @en
 * The agent of tracking origin.
 * @zh
 * 追踪原点代理组件。
 */
@ccclass('cc.TrackingOrigin')
@help('i18n:cc.TrackingOrigin')
@menu('XR/Device/TrackingOrigin')
export class TrackingOrigin extends Component {
    @property({ serializable: true })
    protected _offsetObject: Node | null = null; 
    @property({ serializable: true })
    protected _trackingOriginMode : TrackingOriginMode_Type = TrackingOriginMode_Type.Unbond;
    @property({ serializable: true })
    protected _yOffsetValue = 1.36144;

    @property({
        type: Node,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.tracking_origin.offsetObject'
    })
    set offsetObject(val) {
        if (val === this._offsetObject) {
            return;
        }
        this._setYOffset(0);
        this._offsetObject = val;
        this._setYOffset(this._yOffsetValue);
    }
    get offsetObject() {
        return this._offsetObject;
    }

    @property({
        type: TrackingOriginMode_Type,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.tracking_origin.trackingOriginMode'
    })
    set trackingOriginMode (val) {
        if (val === this._trackingOriginMode) {
            return;
        }
        this._trackingOriginMode = val;
            if (this._trackingOriginMode === TrackingOriginMode_Type.Floor) {
                this._setYOffset(0);
            } else {
                this._setYOffset(this._yOffsetValue);
            }
    }
    get trackingOriginMode () {
        return this._trackingOriginMode;
    }

    @property({
        displayOrder: 3,
        visible: (function (this: TrackingOrigin) {
            return this._trackingOriginMode !== TrackingOriginMode_Type.Floor;
        }),
        tooltip: 'i18n:xr-plugin.tracking_origin.trackingOriginMode'
    })
    set yOffsetValue (val) {
        if (val === this._yOffsetValue) {
            return;
        }
        this._yOffsetValue = val;
        this._setYOffset(this._yOffsetValue);
    }
    get yOffsetValue () {
        return this._yOffsetValue;
    }

    private _setYOffset(value) {
        if (this._offsetObject) {
            this._offsetObject.position.set(this._offsetObject.position.x, value, this._offsetObject.position.z);
        }
    }

    onEnable () {
        if (sys.isXR) {
            xrInterface.setBaseSpaceType(this.trackingOriginMode);
        }
    }
}
