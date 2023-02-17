/*
 Copyright (c) 2022 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
  worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You
 shall not use Cocos Creator software for developing other software or tools
 that's used for developing games. You are not granted to publish, distribute,
  sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to
 you.

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

import {_decorator, Camera, ccenum, clamp, Component, DeviceType, EventKeyboard, EventTouch, find, input, Input, KeyCode, Node, Quat, Rect, sys, Toggle, Vec2, Vec3 } from 'cc';
import { XrEventHandle } from '../interaction/xr-interactable';
import { XrInteractor } from '../interaction/xr-interactor';
import { HMDCtrl } from './hmd-ctrl';
import { TargetEye, TargetEye_Type } from './target-eye';
import { XRController, XrInputDeviceType } from './xr-controller';

const {ccclass, property, menu} = _decorator;

export enum InteractiveSimulateType {
  HMD = 0,
  LEFT_CONTROLLER = 1,
  RIGHT_CONTROLLER = 2
}
ccenum(InteractiveSimulateType);

@ccclass('cc.XRInteractiveSimulator')
@menu('XR/Device/XRInteractiveSimulator')
export class XRInteractiveSimulator extends Component {
  @property({type: Node, displayName: 'XR Agent', tooltip: 'i18n:xr-plugin.xr_interactive_simulator.xrAgent'})
  protected xrAgent: Node|null = null;

  private leftEyeCamera: Camera|null = null;
  private rightEyeCamera: Camera|null = null;
  private mainCamera: Camera|null = null;
  private leftControllerNode: Node|null = null;
  private rightControllerNode: Node|null = null;

  private targetControlledNode: Node|null = null;

  private rotationYawDeg: number = 0;
  private rotationPitchDeg: number = 0;

  private keyPressingCount: number = 0;
  private moveSpeedFactor: number = 1.0;
  private isTriggerMoveEvent: boolean = false;
  private nodeTargetPostion: Vec3 = new Vec3();

  private nodeMovingPostion: Vec3 = new Vec3();
  private nodeTargetRotation: Quat = new Quat();
  private touchDeltaXY: Vec2 = new Vec2();

  private nodeTempYawRotation: Quat = new Quat();
  private nodeTempPitchRotation: Quat = new Quat();

  private curInteractiveSimulateType: InteractiveSimulateType =
      InteractiveSimulateType.HMD;

  private _xrEventHandle: XrEventHandle = new XrEventHandle('xrEventHandle');

  private guideContentNode: Node|null = null;
  private guideContentLastShowTime: number = 0;
  private topToggleHmd: Toggle|null = null;
  private topToggleLeftCtrl: Toggle|null = null;
  private topToggleRightCtrl: Toggle|null = null;

  // -780~15
  private guideContentPositionX:number = 0;
  private guideMaskContentNode: Node|null = null;
  private guideStayShownTime:number = 0;

  private CONFIG_GUIDE_SHOWTIME: number = 1;

  private leftControllerInitPosition:Vec3 = new Vec3();
  private rightControllerInitPosition: Vec3 = new Vec3();
  start() {
    if (sys.isBrowser) {
      if (!this.xrAgent) {
        this.xrAgent = find('XR Agent');
      }
      this.targetControlledNode = this.xrAgent;
      let targetEyeComps = this.xrAgent.getComponentsInChildren(TargetEye);
      for (let targetEye of targetEyeComps) {
        if (targetEye.targetEye === TargetEye_Type.BOTH) {
          this.mainCamera = targetEye.node.getComponent(Camera);
        } else if (targetEye.targetEye === TargetEye_Type.LEFT) {
          this.leftEyeCamera = targetEye.node.getComponent(Camera);
        } else if (targetEye.targetEye === TargetEye_Type.RIGHT) {
          this.rightEyeCamera = targetEye.node.getComponent(Camera);
        }
      }

      this.leftEyeCamera.rect = new Rect(0, 0, 0.5, 1.0);
      this.rightEyeCamera.rect = new Rect(0.5, 0, 0.5, 1.0);
      this.leftEyeCamera.enabled = true;
      this.rightEyeCamera.enabled = true;
      this.mainCamera.enabled = false;

      let hmdCtrl: HMDCtrl = this.mainCamera.getComponent(HMDCtrl);
      if (hmdCtrl) {
        hmdCtrl.perEyeCamera = true;
      }

      let xrControllerComps =
          this.xrAgent.getComponentsInChildren(XRController);
      for (let xrController of xrControllerComps) {
        if (xrController.inputDevice === XrInputDeviceType.Left_Hand) {
          this.leftControllerNode = xrController.node;
        } else if (xrController.inputDevice === XrInputDeviceType.Right_Hand) {
          this.rightControllerNode = xrController.node;
        }
      }
      this.leftControllerInitPosition = this.leftControllerNode.position.clone();
      this.rightControllerInitPosition = this.rightControllerNode.position.clone();

      this.node.getChildByName('Canvas').active = true;
      this.guideContentNode = this.node.getChildByPath('Canvas/GuideContent');
      this.guideMaskContentNode = this.node.getChildByPath('Canvas/GuideContent/Mask/Content');
      this.guideContentNode.active = true;
      this.guideContentLastShowTime = this.CONFIG_GUIDE_SHOWTIME;

      this.topToggleHmd =
          this.node.getChildByPath('Canvas/ToggleHmd').getComponent(Toggle);
      this.topToggleLeftCtrl = this.node.getChildByPath('Canvas/ToggleLeftCtrl')
                                   .getComponent(Toggle);
      this.topToggleRightCtrl =
          this.node.getChildByPath('Canvas/ToggleRightCtrl')
              .getComponent(Toggle);

      console.log('XRInteractiveSimulator is supported!');
    } else {
      this.node.active = false;
      console.log('XRInteractiveSimulator is not supported!');
    }
  }

  update(deltaTime: number) {
    if (sys.isBrowser) {
      if (this.isTriggerMoveEvent) {
        Vec3.lerp(
            this.nodeMovingPostion, this.targetControlledNode.position,
            this.nodeTargetPostion, deltaTime);
        this.targetControlledNode.setPosition(this.nodeMovingPostion);
      }

      if (this.guideContentNode.active) {
        this.guideStayShownTime += deltaTime;
        if(this.guideStayShownTime > 1) {
          if (this.guideContentLastShowTime > 0) {
            if (this.guideMaskContentNode.position.x <= -410) {
              this.guideContentLastShowTime -= deltaTime;
            } else {
              this.guideMaskContentNode.position =
                  this.guideMaskContentNode.position.subtract3f(2, 0, 0);
            }
          } else if (this.guideContentLastShowTime < 0) {
            this.guideContentNode.active = false;
            this.guideContentLastShowTime = 0;
          }
        }
      }
    }
  }

  moveNode(event: EventKeyboard) {
    let moveDistance: number = 2.618 * this.moveSpeedFactor;
    let deltaPosition: Vec3 = new Vec3();
    let dirRight = this.targetControlledNode.right;
    let dirFoward = this.targetControlledNode.forward;
    let dirUp = this.targetControlledNode.up;
    if(this.curInteractiveSimulateType !== InteractiveSimulateType.HMD) {
      // controller 
      dirFoward = Vec3.FORWARD.clone();
      dirRight = Vec3.RIGHT.clone();
      dirUp = Vec3.UP.clone();
    }
    switch (event.keyCode) {
      case KeyCode.KEY_W: {
        deltaPosition = dirFoward.multiplyScalar(moveDistance);
        break;
      }
      case KeyCode.KEY_A: {
        deltaPosition = dirRight.multiplyScalar((-1) * moveDistance);
        break;
      }
      case KeyCode.KEY_S: {
        deltaPosition = dirFoward.multiplyScalar((-1) * moveDistance);
        break;
      }
      case KeyCode.KEY_D: {
        deltaPosition = dirRight.multiplyScalar(moveDistance);
        break;
      }
      case KeyCode.KEY_Q: {
        deltaPosition = dirUp.multiplyScalar((-1) * moveDistance);
        break;
      }
      case KeyCode.KEY_E: {
        deltaPosition = dirUp.multiplyScalar(moveDistance);
        break;
      }
    }

    this.isTriggerMoveEvent = true;
    this.nodeTargetPostion.x = this.targetControlledNode.position.x;
    this.nodeTargetPostion.y = this.targetControlledNode.position.y;
    this.nodeTargetPostion.z = this.targetControlledNode.position.z;
    this.nodeTargetPostion.add(deltaPosition);
  }

  onEnable() {
    if (sys.isBrowser) {
      input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
      input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
      input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
      input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
      input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
      input.on(Input.EventType.KEY_PRESSING, this.onKeyPressing, this);
    }
  }

  onDisable() {
    if (sys.isBrowser) {
      input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
      input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
      input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
      input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
      input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
      input.off(Input.EventType.KEY_PRESSING, this.onKeyPressing, this);
    }
  }

  isMoveKey(event: EventKeyboard): boolean {
    return event.keyCode === KeyCode.KEY_W || event.keyCode === KeyCode.KEY_A ||
        event.keyCode === KeyCode.KEY_S || event.keyCode === KeyCode.KEY_D ||
        event.keyCode === KeyCode.KEY_Q || event.keyCode === KeyCode.KEY_E;
  }

  onKeyDown(event: EventKeyboard) {
    if (this.isMoveKey(event)) {
      this.moveNode(event);
    }

    if (event.keyCode === KeyCode.NUM_1 || event.keyCode == KeyCode.DIGIT_1) {
      this.refreshInteractiveSimulateTypeStatus(
          InteractiveSimulateType.HMD, true);
    } else if (
        event.keyCode === KeyCode.NUM_2 || event.keyCode == KeyCode.DIGIT_2) {
      this.refreshInteractiveSimulateTypeStatus(
          InteractiveSimulateType.LEFT_CONTROLLER, true);
    } else if (
        event.keyCode === KeyCode.NUM_3 || event.keyCode == KeyCode.DIGIT_3) {
      this.refreshInteractiveSimulateTypeStatus(
          InteractiveSimulateType.RIGHT_CONTROLLER, true);
    } else if (
        event.keyCode === KeyCode.SPACE || event.keyCode === KeyCode.ENTER) {
      this.simulateUIPressEvent(true);
    }
  }

  onKeyPressing(event: EventKeyboard) {
    if (this.isMoveKey(event)) {
      this.moveNode(event);
      this.keyPressingCount++;
      if (this.keyPressingCount % 5 == 0) {
        this.moveSpeedFactor = Math.ceil(this.keyPressingCount / 5) * 0.2 + 1.0;
      }
    }

    if(event.keyCode === KeyCode.KEY_B) {
      this.resetControllerPosition();
    }
  }

  onKeyUp(event: EventKeyboard) {
    if (this.isMoveKey(event)) {
      this.moveNode(event);
      this.keyPressingCount = 0;
      this.moveSpeedFactor = 1.0;
      this.isTriggerMoveEvent = false;
    }

    if (event.keyCode === KeyCode.SPACE || event.keyCode === KeyCode.ENTER) {
      this.simulateUIPressEvent(false);
    }
  }

  onTouchStart(event: EventTouch) {
    this.rotationYawDeg = this.targetControlledNode.eulerAngles.y;
    this.rotationPitchDeg = this.targetControlledNode.eulerAngles.x;
  }

  onTouchMove(event: EventTouch) {
    event.getDelta(this.touchDeltaXY);

    this.rotationYawDeg += this.touchDeltaXY.x * (-1) * 0.1;
    this.rotationPitchDeg += this.touchDeltaXY.y * 0.1;
    this.rotationPitchDeg = clamp(this.rotationPitchDeg, -89, 89);

    Quat.rotateAround(
        this.nodeTempYawRotation, Quat.IDENTITY, Vec3.UP,
        this.rotationYawDeg * Math.PI / 180);
    Quat.rotateAround(
        this.nodeTempPitchRotation, Quat.IDENTITY, Vec3.RIGHT,
        this.rotationPitchDeg * Math.PI / 180);
    Quat.multiply(
        this.nodeTargetRotation, this.nodeTempYawRotation,
        this.nodeTempPitchRotation);
    this.targetControlledNode.setRotation(this.nodeTargetRotation);
  }

  onTouchEnd(event: EventTouch) {

  }

  refreshInteractiveSimulateTypeStatus(
      type: InteractiveSimulateType, changeCheckStatus: boolean) {
    this.curInteractiveSimulateType = type;
    switch (this.curInteractiveSimulateType) {
      case InteractiveSimulateType.HMD: {
        if (changeCheckStatus) {
          this.topToggleHmd.isChecked = true;
        }
        this.topToggleLeftCtrl.isChecked = false;
        this.topToggleRightCtrl.isChecked = false;
        this.targetControlledNode = this.xrAgent;
        break;
      }
      case InteractiveSimulateType.LEFT_CONTROLLER: {
        this.topToggleHmd.isChecked = false;
        if (changeCheckStatus) {
          this.topToggleLeftCtrl.isChecked = true;
        }
        this.topToggleRightCtrl.isChecked = false;
        this.targetControlledNode = this.leftControllerNode;
        break;
      }
      case InteractiveSimulateType.RIGHT_CONTROLLER: {
        this.topToggleHmd.isChecked = false;
        this.topToggleLeftCtrl.isChecked = false;
        if (changeCheckStatus) {
          this.topToggleRightCtrl.isChecked = true;
        }
        this.targetControlledNode = this.rightControllerNode;
        break;
      }
    }
  }

  simulateUIPressEvent(isKeyDown: boolean) {
    switch (this.curInteractiveSimulateType) {
      case InteractiveSimulateType.LEFT_CONTROLLER: {
        this._xrEventHandle.deviceType = DeviceType.Left;
        if (isKeyDown) {
          this.leftControllerNode.getComponent(XrInteractor)
              .uiPressEnter(this._xrEventHandle);
        } else {
          this.leftControllerNode.getComponent(XrInteractor)
              .uiPressExit(this._xrEventHandle);
        }
        break;
      }
      case InteractiveSimulateType.RIGHT_CONTROLLER: {
        this._xrEventHandle.deviceType = DeviceType.Right;
        if (isKeyDown) {
          this.rightControllerNode.getComponent(XrInteractor)
              .uiPressEnter(this._xrEventHandle);
        } else {
          this.rightControllerNode.getComponent(XrInteractor)
              .uiPressExit(this._xrEventHandle);
        }
        break;
      }
    }
  }

  showGuideUI(event: Event, customEventData: string) {
    this.guideContentNode.active = !this.guideContentNode.active;
    if (this.guideContentNode.active) {
      this.guideContentLastShowTime = this.CONFIG_GUIDE_SHOWTIME;
      this.guideMaskContentNode.position = new Vec3(15, 0, 0);
      this.guideStayShownTime = 0;
    } else {
      this.guideContentLastShowTime = 0;
    }
  }

  onToggleChanged(event: Event) {
    let node = event.target as unknown as Node;
    if (node.name === 'ToggleHmd') {
      this.refreshInteractiveSimulateTypeStatus(
          InteractiveSimulateType.HMD, false);
    } else if (node.name === 'ToggleLeftCtrl') {
      this.refreshInteractiveSimulateTypeStatus(
          InteractiveSimulateType.LEFT_CONTROLLER, false);
    } else if (node.name === 'ToggleRightCtrl') {
      this.refreshInteractiveSimulateTypeStatus(
          InteractiveSimulateType.RIGHT_CONTROLLER, false);
    }
  }

  resetControllerPosition() : void {
    this.leftControllerNode.position = this.leftControllerInitPosition.clone();
    this.rightControllerNode.position = this.rightControllerInitPosition.clone();
  }
}
