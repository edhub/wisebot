import { getCurrentModel, MODELS, KEY_CURRENT_MODEL } from "./model_config";

/**
 * 响应式当前模型状态，跨组件共享。
 * 用 $state 而非每次从 localStorage 读取，保证所有订阅方实时同步。
 */
export const modelState = $state({
    currentModel: getCurrentModel(),
});

/**
 * 更新当前模型：同时写 localStorage + 更新响应式状态。
 * 替代 model_config 中的同名函数，是唯一的写入入口。
 */
export function setCurrentModel(modelName: string) {
    if (MODELS[modelName]) {
        localStorage.setItem(KEY_CURRENT_MODEL, modelName);
        modelState.currentModel = modelName;
    }
}
