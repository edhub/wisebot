import type { ModelMessage } from "ai";
import { streamText, APICallError } from "ai";
import type { QandA } from "$lib/stores/ChatStore.svelte";
import { getModelConfig, getApiKey, createLanguageModel, SERVERS } from "./model_config";

// ─── 错误提取 ──────────────────────────────────────────────────────────────────

/**
 * 从各种 AI SDK 错误类型中提取可读的错误信息。
 * APICallError 的 message 可能为空，但 statusCode + responseBody 有实际内容。
 */
function extractErrorMessage(error: unknown): string {
  if (error == null) return "未知错误";

  if (APICallError.isInstance(error)) {
    const parts: string[] = [];
    if (error.statusCode) parts.push(`HTTP ${error.statusCode}`);
    if (error.message) parts.push(error.message);
    if (error.responseBody) {
      try {
        const body = JSON.parse(error.responseBody as string);
        const msg =
          body?.error?.message || body?.message || body?.error || null;
        if (msg) parts.push(String(msg));
        else if (!error.message) parts.push(error.responseBody as string);
      } catch {
        if (!error.message) parts.push(String(error.responseBody));
      }
    }
    return parts.join(" — ") || error.toString();
  }

  if (error instanceof Error) {
    return error.message || error.toString();
  }

  if (typeof error === "string") return error || "空错误";

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

// ─── 图片处理 ──────────────────────────────────────────────────────────────────

/**
 * 将 blob URL 转换为 base64 data URL，以便跨请求传递图片内容。
 */
async function resolveImageToDataUrl(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith("data:")) return imageUrl;
  if (imageUrl.startsWith("blob:")) {
    try {
      const res = await fetch(imageUrl);
      const blob = res.blob ? await res.blob() : null;
      if (!blob) throw new Error("blob() not available");
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("[query_api] resolveImageToDataUrl failed for blob URL:", e);
      return imageUrl;
    }
  }
  return imageUrl;
}

// ─── 消息构造 ──────────────────────────────────────────────────────────────────

async function prepareMessages(
  message: string,
  image?: string,
  lastQA?: QandA,
): Promise<ModelMessage[]> {
  const messages: ModelMessage[] = [];

  if (lastQA) {
    if (lastQA.imageUrl) {
      const resolvedImage = await resolveImageToDataUrl(lastQA.imageUrl);
      messages.push({
        role: "user",
        content: [
          { type: "text", text: lastQA.question },
          { type: "image", image: resolvedImage },
        ],
      });
    } else {
      messages.push({ role: "user", content: lastQA.question });
    }
    messages.push({ role: "assistant", content: lastQA.answer });
  }

  if (image) {
    const resolvedImage = await resolveImageToDataUrl(image);
    messages.push({
      role: "user",
      content: [
        { type: "text", text: message },
        { type: "image", image: resolvedImage },
      ],
    });
  } else {
    messages.push({ role: "user", content: message });
  }

  return messages;
}

// ─── API Key 校验 ──────────────────────────────────────────────────────────────

function validateApiKey(
  apiKey: string | null,
  serverType: string,
): string | null {
  if (!apiKey) {
    const server = SERVERS[serverType];
    const url = server?.signupUrl;
    return url
      ? `请设置 API key。\n请在 ${url} 购买 API 调用，然后设置 API key`
      : "请设置 API key。";
  }
  return null;
}

// ─── 主查询入口 ────────────────────────────────────────────────────────────────

export async function* query(
  model: string,
  message: string,
  lastQA?: QandA,
  temperature: number = 0.7,
  image?: string,
) {
  const modelConfig = getModelConfig(model);
  const serverConfig = SERVERS[modelConfig.serverType];

  if (!serverConfig) {
    const msg = `[配置错误] 找不到服务器配置: serverType="${modelConfig.serverType}"，model="${model}"`;
    console.error("[query_api]", msg);
    yield msg;
    return;
  }

  const apiKey = getApiKey(modelConfig.serverType);
  const keyError = validateApiKey(apiKey, modelConfig.serverType);
  if (keyError) {
    yield keyError;
    return;
  }

  const messages = await prepareMessages(message, image, lastQA);

  let languageModel;
  try {
    languageModel = createLanguageModel(model, modelConfig);
  } catch (e) {
    const msg = `[配置错误] createLanguageModel 失败: ${extractErrorMessage(e)}`;
    console.error("[query_api]", msg, e);
    yield msg;
    return;
  }

  let hasReasoningContent = false;
  let hasYieldedContent = false;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000);

  try {
    const result = streamText({
      model: languageModel,
      messages,
      temperature,
      abortSignal: controller.signal,
      onError({ error }) {
        console.error("[query_api] streamText onError:", extractErrorMessage(error), error);
      },
    });

    for await (const part of result.fullStream) {
      switch (part.type) {
        case "reasoning-delta": {
          if (!hasReasoningContent) {
            hasReasoningContent = true;
            yield "> 思考中...\n>\n> ";
          }
          hasYieldedContent = true;
          yield part.text.replace(/\n/g, "\n> ");
          break;
        }

        case "text-delta": {
          if (hasReasoningContent) {
            yield "\n\n";
            hasReasoningContent = false;
          }
          hasYieldedContent = true;
          yield part.text;
          break;
        }

        case "error": {
          const errMsg = extractErrorMessage(part.error);
          console.error("[query_api] fullStream error part:", errMsg, part.error);
          yield `\n\n[流式响应错误: ${errMsg}]`;
          hasYieldedContent = true;
          break;
        }

        case "finish-step": {
          if (
            !hasYieldedContent &&
            part.finishReason &&
            part.finishReason !== "stop" &&
            part.finishReason !== "tool-calls"
          ) {
            yield `[生成异常终止: ${part.rawFinishReason ?? part.finishReason}]`;
            hasYieldedContent = true;
          }
          break;
        }

        case "finish": {
          if (!hasYieldedContent) {
            const reason = part.finishReason ?? "unknown";
            // outputTokens=0 且 rawFinishReason 缺失，说明 API 静默拒绝了该模型名
            if (part.totalUsage.outputTokens === 0 && part.rawFinishReason == null) {
              yield `[模型不可用或名称有误: "${model}"，请在服务商控制台确认正确的模型 ID]`;
            } else if (reason === "stop") {
              yield "[模型返回了空响应]";
            } else if (reason === "content-filter") {
              yield "[内容被安全过滤拦截]";
            } else if (reason === "length") {
              yield "[响应因超出最大 token 限制而被截断]";
            } else {
              yield `[生成异常终止: ${part.rawFinishReason ?? reason}]`;
            }
            hasYieldedContent = true;
          }
          break;
        }

        default:
          break;
      }
    }
  } catch (e: unknown) {
    const isAbort =
      e instanceof Error &&
      (e.name === "AbortError" || e.message?.includes("aborted"));
    if (!isAbort) console.error("[query_api] catch:", e);
    yield isAbort
      ? "\n\n[请求超时: 120秒未响应，已中断]"
      : `出错啦: ${extractErrorMessage(e)}`;
  } finally {
    clearTimeout(timeoutId);
  }
}
