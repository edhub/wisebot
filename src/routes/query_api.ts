import type { QandA } from "./ChatStore.svelte";
import { getModelConfig, getApiKey, createLanguageModel } from "./model_config";
import { streamText } from "ai";

function prepareMessages(message: string, image?: string, lastQA?: QandA) {
  const messages: any[] = [];

  if (lastQA) {
    // 历史消息：如果历史消息有图片，也需要以数组形式传递 content
    if (lastQA.image) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: lastQA.question },
          { type: "image", image: lastQA.image },
        ],
      });
    } else {
      messages.push({ role: "user", content: lastQA.question });
    }
    messages.push({ role: "assistant", content: lastQA.answer });
  }

  // 当前消息
  if (image) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: message },
        { type: "image", image: image },
      ],
    });
  } else {
    messages.push({ role: "user", content: message });
  }
  return messages;
}

function validateApiKey(
  apiKey: string | null,
  serverType: string,
): string | null {
  if (!apiKey) {
    if (serverType === "deepseek") {
      return "请设置 API key。\n请在 https://platform.deepseek.com/ 购买 API 调用，然后设置 API key";
    }
    if (serverType === "bianxie") {
      return "请设置 API key。\n请在 https://api.bianxie.ai 购买 API 调用，然后设置 API key";
    }
    return "请设置 API key。\n";
  }
  return null;
}

export async function* query(
  model: string,
  message: string,
  lastQA?: QandA,
  temperature: number = 0.7,
  image?: string,
) {
  const modelConfig = getModelConfig(model);
  const apiKey = getApiKey(modelConfig.serverType);

  const errorMessage = validateApiKey(apiKey, modelConfig.serverType);
  if (errorMessage) {
    yield errorMessage;
    return;
  }

  const messages = prepareMessages(message, image, lastQA);
  const languageModel = createLanguageModel(model, modelConfig);

  let hasReasoningContent = false;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 120000); // 120 seconds timeout

  try {
    const result = streamText({
      model: languageModel,
      messages: messages as any,
      temperature,
      abortSignal: controller.signal,
      onError({ error }) {
        console.error("[AI SDK streamText] Error:", error);
      },
    });

    for await (const part of result.fullStream) {
      switch (part.type) {
        case "reasoning-delta": {
          // Handle reasoning/thinking content (e.g. DeepSeek R1)
          if (!hasReasoningContent) {
            hasReasoningContent = true;
            yield "> 思考中...\n>\n> ";
          }
          yield part.text.replace(/\n/g, "\n> ");
          break;
        }

        case "text-delta": {
          if (hasReasoningContent) {
            // Transition from reasoning to final answer
            yield "\n\n";
            hasReasoningContent = false;
          }
          yield part.text;
          break;
        }

        case "error": {
          const errMsg =
            part.error instanceof Error
              ? part.error.message
              : String(part.error);
          yield `\n\n[流式响应错误: ${errMsg}]`;
          break;
        }

        // Ignore other part types (tool-call, finish, etc.)
        default:
          break;
      }
    }
  } catch (e: any) {
    console.error("[query] Error:", e);
    const isAbort = e.name === "AbortError" || e.message?.includes("aborted");
    yield isAbort
      ? "\n\n[请求超时: 120秒未响应，已中断]"
      : `出错啦: ${e.message || "未知错误"}`;
  } finally {
    clearTimeout(timeoutId);
  }
}
