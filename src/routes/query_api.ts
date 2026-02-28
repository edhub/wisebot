import type { QandA } from "./ChatStore.svelte";
import { getModelConfig, getApiKey, createLanguageModel } from "./model_config";
import { streamText } from "ai";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

function prepareMessages(message: string, lastQA?: QandA): Message[] {
  return lastQA
    ? [
        { role: "user" as const, content: lastQA.question },
        { role: "assistant" as const, content: lastQA.answer },
        { role: "user" as const, content: message },
      ]
    : [{ role: "user" as const, content: message }];
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
) {
  const modelConfig = getModelConfig(model);
  const apiKey = getApiKey(modelConfig.serverType);

  const errorMessage = validateApiKey(apiKey, modelConfig.serverType);
  if (errorMessage) {
    yield errorMessage;
    return;
  }

  const messages = prepareMessages(message, lastQA);
  const languageModel = createLanguageModel(model, modelConfig);

  let hasReasoningContent = false;

  try {
    const result = streamText({
      model: languageModel,
      messages,
      temperature,
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
    yield `出错啦: ${e.message || "未知错误"}`;
  }
}
