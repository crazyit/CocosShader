'use strict';

function hasCameraComponent(node) {
  return node && node.components?.some((comp) => comp.type === "cc.Camera");
}
async function isNormalCameraNode(node) {
  let result = false;
  if (node.parent) {
    result = hasCameraComponent(node);
  }
  return result;
}
exports.onNodeMenu = async function(node) {
  const canTransformXR = await isNormalCameraNode(node);
  return canTransformXR ? [
    {
      label: "i18n:xr-plugin.node.convert_main_camera_to_xr_hmd",
      async click() {
        const { parent } = node;
        const parentChildrens = (await Editor.Message.request("scene", "query-node-tree", parent)).children;
        const orginIndex = parentChildrens.findIndex((child) => child.uuid === node.uuid);
        await Editor.Message.request("scene", "set-property", {
          uuid: node.uuid,
          path: "name",
          dump: {
            type: "string",
            value: "XR HMD"
          }
        });
        const xrUuid = await Editor.Message.request("scene", "create-node", {
          parent,
          assetUuid: "f3b49a5d-f32a-4694-a64b-9aa142e2adc3",
          unlinkPrefab: true
        });
        const nodeInfo = await Editor.Message.request("scene", "query-node", node.uuid);
        for (const path of ["position", "scale", "rotation"]) {
          await Editor.Message.request("scene", "set-property", {
            uuid: xrUuid,
            path,
            dump: nodeInfo[path]
          });
        }
        const nodeTree = await Editor.Message.request("scene", "query-node-tree", xrUuid);
        const TrackingSpace = nodeTree.children.find((node2) => node2.name === "TrackingSpace");
        const defaultXrMainCamera = TrackingSpace.children.find((node2) => node2.name === "XR HMD");
        if (defaultXrMainCamera) {
          const xrCameraInfo = await Editor.Message.request("scene", "query-node", defaultXrMainCamera.uuid);
          for (const path of ["position", "scale", "rotation"]) {
            await Editor.Message.request("scene", "set-property", {
              uuid: node.uuid,
              path,
              dump: xrCameraInfo[path]
            });
          }
          const oldComponents = xrCameraInfo.__comps__;
          for (const dump of oldComponents) {
            if (dump.type !== "cc.Camera") {
              await Editor.Message.request("scene", "create-component", {
                uuid: node.uuid,
                component: dump.cid
              });
              const nodeDump = await Editor.Message.request("scene", "query-node", node.uuid);
              const length = nodeDump.__comps__ && nodeDump.__comps__.length;
              if (length) {
                const lastIndex = length - 1;
                await Editor.Message.request("scene", "set-property", {
                  uuid: node.uuid,
                  path: `__comps__.${lastIndex}`,
                  dump
                });
              }
            }
          }
          await Editor.Message.request("scene", "set-parent", {
            parent: node.uuid,
            uuids: defaultXrMainCamera.children.map((eye) => eye.uuid),
            keepWorldTransform: false
          });
          await Editor.Message.request("scene", "remove-node", {
            uuid: defaultXrMainCamera.uuid
          });
        }
        await Editor.Message.request("scene", "set-parent", {
          parent: TrackingSpace.uuid,
          uuids: node.uuid,
          keepWorldTransform: false
        });
        Editor.Message.send("scene", "move-array-element", {
          uuid: TrackingSpace.uuid,
          path: "children",
          target: TrackingSpace.children.length - 1,
          offset: (TrackingSpace.children.length - 1) * -1
        });
        nodeTree.children.forEach((child) => {
          if (child.name.includes("XR Controller")) {
            Editor.Message.send("scene", "remove-node", {
              uuid: child.uuid
            });
          }
        });
        const targetIndex = parentChildrens.length - 1;
        Editor.Message.send("scene", "move-array-element", {
          uuid: parent,
          path: "children",
          target: targetIndex,
          offset: orginIndex - targetIndex
        });
        Editor.Metrics._trackEventWithTimer({
          category: "xr",
          id: "A100001",
          value: 1
        });
      }
    }
  ] : [
    {
      label: "\u6253\u5370\u8282\u70B9\u4FE1\u606F",
      click() {
        console.log(node);
      }
    }
  ];
};
