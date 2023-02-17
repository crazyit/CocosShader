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
import { _decorator, Component, EventHandler as ComponentEventHandler, AudioClip, CCBoolean } from 'cc';
import { XrEventHandle } from '../interaction/xr-interactable';
const { ccclass, help, menu, property } = _decorator;

@ccclass('cc.AudioEvents')
class AudioEvents {
    @property({ serializable: true })
    protected _onSelectEntered = false;
    @property({ serializable: true })
    protected _onSelectEnteredAudioClip: AudioClip | null = null;
    @property({ serializable: true })
    protected _onSelectStay = false;
    @property({ serializable: true })
    protected _onSelectStayAudioClip: AudioClip | null = null;
    @property({ serializable: true })
    protected _onSelectExited = false;
    @property({ serializable: true })
    protected _onSelectExitedAudioClip: AudioClip | null = null;

    @property({ serializable: true })
    protected _onHoverEntered = false;
    @property({ serializable: true })
    protected _onHoverEnteredAudioClip: AudioClip | null = null;
    @property({ serializable: true })
    protected _onHoverStay = false;
    @property({ serializable: true })
    protected _onHoverStayAudioClip: AudioClip | null = null;
    @property({ serializable: true })
    protected _onHoverExited = false;
    @property({ serializable: true })
    protected _onHoverExitedAudioClip: AudioClip | null = null;

    @property({
        type: CCBoolean,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onSelectEntered'
    })
    set onSelectEntered (val) {
        if (val === this._onSelectEntered) {
            return;
        }
        this._onSelectEntered = val;
    }
    get onSelectEntered () {
        return this._onSelectEntered;
    }

    @property({
        type: AudioClip,
        displayOrder: 2,
        visible: (function (this: AudioEvents) {
            return this._onSelectEntered;
        }),
        displayName: "AudioClip",
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onSelectEnteredAudioClip'
    })
    set onSelectEnteredAudioClip(val) {
        if (val === this._onSelectEnteredAudioClip) {
            return;
        }
        this._onSelectEnteredAudioClip = val;
    }
    get onSelectEnteredAudioClip() {
        return this._onSelectEnteredAudioClip;
    }

    @property({
        type: CCBoolean,
        displayOrder: 3,
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onSelectStay'
    })
    set onSelectStay (val) {
        if (val === this._onSelectStay) {
            return;
        }
        this._onSelectStay = val;
    }
    get onSelectStay () {
        return this._onSelectStay;
    }

    @property({
        type: AudioClip,
        displayOrder: 4,
        visible: (function (this: AudioEvents) {
            return this._onSelectStay;
        }),
        displayName: "AudioClip",
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onSelectStayAudioClip'
    })
    set onSelectStayAudioClip(val) {
        if (val === this._onSelectStayAudioClip) {
            return;
        }
        this._onSelectStayAudioClip = val;
    }
    get onSelectStayAudioClip() {
        return this._onSelectStayAudioClip;
    }

    @property({
        type: CCBoolean,
        displayOrder: 5,
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onSelectExited'
    })
    set onSelectExited (val) {
        if (val === this._onSelectExited) {
            return;
        }
        this._onSelectExited = val;
    }
    get onSelectExited () {
        return this._onSelectExited;
    }

    @property({
        type: AudioClip,
        displayOrder: 6,
        visible: (function (this: AudioEvents) {
            return this._onSelectExited;
        }),
        displayName: "AudioClip",
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onSelectExitedAudioClip'
    })
    set onSelectExitedAudioClip(val) {
        if (val === this._onSelectExitedAudioClip) {
            return;
        }
        this._onSelectExitedAudioClip = val;
    }
    get onSelectExitedAudioClip() {
        return this._onSelectExitedAudioClip;
    }

    @property({
        type: CCBoolean,
        displayOrder: 7,
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onHoverEntered'
    })
    set onHoverEntered (val) {
        if (val === this._onHoverEntered) {
            return;
        }
        this._onHoverEntered = val;
    }
    get onHoverEntered () {
        return this._onHoverEntered;
    }

    @property({
        type: AudioClip,
        displayOrder: 8,
        visible: (function (this: AudioEvents) {
            return this._onHoverEntered;
        }),
        displayName: "AudioClip",
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onHoverEnteredAudioClip'
    })
    set onHoverEnteredAudioClip(val) {
        if (val === this._onHoverEnteredAudioClip) {
            return;
        }
        this._onHoverEnteredAudioClip = val;
    }
    get onHoverEnteredAudioClip() {
        return this._onHoverEnteredAudioClip;
    }

    @property({
        type: CCBoolean,
        displayOrder: 9,
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onHoverStay'
    })
    set onHoverStay (val) {
        if (val === this._onHoverStay) {
            return;
        }
        this._onHoverStay = val;
    }
    get onHoverStay () {
        return this._onHoverStay;
    }

    @property({
        type: AudioClip,
        displayOrder: 10,
        visible: (function (this: AudioEvents) {
            return this._onHoverStay;
        }),
        displayName: "AudioClip",
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onHoverStayAudioClip'
    })
    set onHoverStayAudioClip(val) {
        if (val === this._onHoverStayAudioClip) {
            return;
        }
        this._onHoverStayAudioClip = val;
    }
    get onHoverStayAudioClip() {
        return this._onHoverStayAudioClip;
    }

    @property({
        type: CCBoolean,
        displayOrder: 11,
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onHoverExited'
    })
    set onHoverExited (val) {
        if (val === this._onHoverExited) {
            return;
        }
        this._onHoverExited = val;
    }
    get onHoverExited () {
        return this._onHoverExited;
    }

    @property({
        type: AudioClip,
        displayOrder: 12,
        visible: (function (this: AudioEvents) {
            return this._onHoverExited;
        }),
        displayName: "AudioClip",
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onHoverExitedAudioClip'
    })
    set onHoverExitedAudioClip(val) {
        if (val === this._onHoverExitedAudioClip) {
            return;
        }
        this._onHoverExitedAudioClip = val;
    }
    get onHoverExitedAudioClip() {
        return this._onHoverExitedAudioClip;
    }
}

@ccclass('cc.SubInteractorEvents')
class SubInteractorEvents {
    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.interactor_events.sub_interactor_events.hoverEnterEvents'
    })
    public hoverEnterEvents: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.interactor_events.sub_interactor_events.hoverStayEvents'
    })
    public hoverStayEvents: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 3,
        tooltip: 'i18n:xr-plugin.interactor_events.sub_interactor_events.hoverExitEvents'
    })
    public hoverExitEvents: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.interactor_events.sub_interactor_events.selectEnterEvents'
    })
    public selectEnterEvents: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 5,
        tooltip: 'i18n:xr-plugin.interactor_events.sub_interactor_events.selectStayEvents'
    })
    public selectStayEvents: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 6,
        tooltip: 'i18n:xr-plugin.interactor_events.sub_interactor_events.selectExitEvents'
    })
    public selectExitEvents: ComponentEventHandler[] = [];

    public selectEntered(event: XrEventHandle) {
        ComponentEventHandler.emitEvents(this.selectEnterEvents, event);
    }

    public selectStay(event: XrEventHandle) {
        ComponentEventHandler.emitEvents(this.selectStayEvents, event);
    }

    public selectExited(event: XrEventHandle) {
        ComponentEventHandler.emitEvents(this.selectExitEvents, event);
    }

    public hoverEntered(event: XrEventHandle) {
        ComponentEventHandler.emitEvents(this.hoverEnterEvents, event);
    }

    public hoverStay(event: XrEventHandle) {
        ComponentEventHandler.emitEvents(this.hoverStayEvents, event);
    }

    public hoverExited(event: XrEventHandle) {
        ComponentEventHandler.emitEvents(this.hoverExitEvents, event);
    }
}

/**
 * @en
 * Event of interactable.
 * @zh
 * 交互器事件组件。
 */
@ccclass('cc.InteractorEvents')
@help('i18n:cc.InteractorEvents')
@menu('XR/Event/InteractorEvents')
export class InteractorEvents extends Component {
    @property({
        serializable: true,
        type: AudioEvents,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.interactor_events.audioEvents'
    })
    public audioEvents: AudioEvents = new AudioEvents;

    @property({
        serializable: true,
        type: SubInteractorEvents,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.interactor_events.interactorEvents'
    })
    public interactorEvents: SubInteractorEvents = new SubInteractorEvents;

    public selectEntered(event: XrEventHandle) {
        this.interactorEvents.selectEntered(event);
        if (this.audioEvents.onSelectEntered) {
            this.audioEvents.onSelectEnteredAudioClip?.play();
        }
    }

    public selectStay(event: XrEventHandle) {
        this.interactorEvents.selectStay(event);
        if (this.audioEvents.onSelectStay) {
            this.audioEvents.onSelectStayAudioClip?.play();
        }
    }

    public selectExited(event: XrEventHandle) {
        this.interactorEvents.selectExited(event);
        if (this.audioEvents.onSelectExited) {
            this.audioEvents.onSelectExitedAudioClip?.play();
        }
    }

    public hoverEntered(event: XrEventHandle) {
        this.interactorEvents.hoverEntered(event);
        if (this.audioEvents.onHoverEntered) {
            this.audioEvents.onHoverEnteredAudioClip?.play();
        }
    }

    public hoverStay(event: XrEventHandle) {
        this.interactorEvents.hoverStay(event);
        if (this.audioEvents.onHoverStay) {
            this.audioEvents.onHoverStayAudioClip?.play();
        }
    }

    public hoverExited(event: XrEventHandle) {
        this.interactorEvents.hoverExited(event);
        if (this.audioEvents.onHoverExited) {
            this.audioEvents.onHoverExitedAudioClip?.play();
        }
    }
}