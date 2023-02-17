interface Node {
    type: string,
    parent?: string,
    components: [],
    uuid: string

}

interface CameraNode extends Node {
    parent: string
}

/**
 * 检查节点是否有 "cc.Camera"
 * @param node 节点
 */
function hasCameraComponent(node: Node) {
    return node && node.components?.some((comp: any) => comp.type === 'cc.Camera');
}

/**
 * 判断当前节点是否为一个普通的摄像机节点
 * @param node 
 * @returns 
 */
async function isNormalCameraNode(node: Node) {
    let result = false;
    if (node.parent) {
        //const parent = await Editor.Message.request('scene', 'query-node', node.parent);
        //result = parent.isScene && hasCameraComponent(node);
        result = hasCameraComponent(node);
    }
    return result;
}

exports.onNodeMenu = async function(node: Node) {
    const canTransformXR = await isNormalCameraNode(node);
    return canTransformXR
        ? [
            {
                label: 'i18n:xr-plugin.node.convert_main_camera_to_xr_hmd',
                async click() {

                    const { parent } = node as CameraNode;

                    const parentChildrens = (await Editor.Message.request('scene', 'query-node-tree', parent)).children;
                    const orginIndex = parentChildrens.findIndex((child: any) => child.uuid === node.uuid);

                    // 重命名
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: node.uuid,
                        path: 'name',
                        dump: {
                            type: 'string',
                            value: 'XR HMD',
                        },
                    });

                    // 创建 xr 节点
                    const xrUuid = await Editor.Message.request('scene', 'create-node', {
                        parent: parent,
                        assetUuid: 'f3b49a5d-f32a-4694-a64b-9aa142e2adc3', // xr session prefab 的 uuid
                        unlinkPrefab: true,
                    });

                    const nodeInfo = await Editor.Message.request('scene', 'query-node', node.uuid);

                    // 复制原 camera 的 position 等信息到 session 节点去
                    for (const path of ['position', 'scale', 'rotation']) {
                        await Editor.Message.request('scene', 'set-property', {
                            uuid: xrUuid,
                            path: path,
                            dump: nodeInfo[path],
                        });
                    }

                    const nodeTree = await Editor.Message.request('scene', 'query-node-tree', xrUuid);
                    const TrackingSpace = nodeTree.children.find((node: any) => node.name === 'TrackingSpace');

                    const defaultXrMainCamera = TrackingSpace.children.find((node: any) => node.name === 'XR HMD');
                    if (defaultXrMainCamera) {
                        // 重置一下被转换的 camera 位置等信息
                        const xrCameraInfo = await Editor.Message.request('scene', 'query-node', defaultXrMainCamera.uuid);
                        for (const path of ['position', 'scale', 'rotation']) {
                            await Editor.Message.request('scene', 'set-property', {
                                uuid: node.uuid,
                                path: path,
                                dump: xrCameraInfo[path],
                            });
                        }

                        // 复制hmd prefab的camera的组件信息到被转换的 camera
                        const oldComponents = xrCameraInfo.__comps__;

                        for (const dump of oldComponents) {
                            if (dump.type !== 'cc.Camera') {
                                // 先创建一个相同的组件
                                await Editor.Message.request('scene', 'create-component', {
                                    uuid: node.uuid,
                                    component: dump.cid,
                                });

                                const nodeDump = await Editor.Message.request('scene', 'query-node', node.uuid);
                                const length = nodeDump.__comps__ && nodeDump.__comps__.length;
                                if (length) {
                                    const lastIndex = length - 1;
                                    await Editor.Message.request('scene', 'set-property', {
                                        uuid: node.uuid,
                                        path: `__comps__.${lastIndex}`,
                                        dump: dump,
                                    });
                                }
                            }
                        }

                        // 左右 eye 挪到 camera 下面
                        await Editor.Message.request('scene', 'set-parent', {
                            parent: node.uuid,
                            uuids: defaultXrMainCamera.children.map((eye: any) => eye.uuid),
                            keepWorldTransform: false,
                        });

                        // 删除 prefab 内置的 camera
                        await Editor.Message.request('scene', 'remove-node', {
                            uuid: defaultXrMainCamera.uuid,
                        });
                    }

                    // 将 camera 节点塞到 TrackingSpace 节点下面
                    await Editor.Message.request('scene', 'set-parent', {
                        parent: TrackingSpace.uuid,
                        uuids: node.uuid,
                        keepWorldTransform: false,
                    });

                    // 上一步是追加，需要挪到第一位
                    Editor.Message.send('scene', 'move-array-element', {
                        uuid: TrackingSpace.uuid,
                        path: 'children',
                        target: TrackingSpace.children.length - 1,
                        offset: (TrackingSpace.children.length - 1) * -1,
                    });

                    // 转换的时候需要把控制手柄删除
                    nodeTree.children.forEach((child: any) => {
                        if (child.name.includes('XR Controller')) {
                            Editor.Message.send('scene', 'remove-node', {
                                uuid: child.uuid,
                            });
                        }
                    });

                    // 保持原camera节点的顺序
                    const targetIndex = parentChildrens.length - 1;
                    Editor.Message.send('scene', 'move-array-element', {
                        uuid: parent,
                        path: 'children',
                        target: targetIndex,
                        offset: orginIndex - targetIndex,
                    });

                    // @ts-ignore
                    Editor.Metrics._trackEventWithTimer({
                        category: 'xr',
                        id: 'A100001',
                        value: 1,
                    });
                },
            }
        ]
        : [
            {
                label: '打印节点信息',
                click() {
                    console.log(node);
                },
            }
        ];
};
