import type { QandA } from './ChatStore.svelte';
import { getModelConfig, getServerConfig, getApiKey } from './model_config';

interface Message {
  role: string;
  content: string;
}

function prepareMessages(message: string, lastQA?: QandA): Message[] {
  return lastQA ? [
    { role: "user", content: lastQA.question },
    { role: "assistant", content: lastQA.answer },
    { role: "user", content: message },
  ] : [
    { role: "user", content: message },
  ];
}

async function makeApiRequest(url: string, apiKey: string, body: string) {
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body,
  });
  return resp;
}

async function* handleStreamResponse(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const decoder = new TextDecoder();
  let tailing = "";
  let lastReasoningContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    let textDelta = tailing + decoder.decode(value);
    let splits = textDelta
      .split("\n")
      .flatMap((s) => s.split("data: "))
      .filter(Boolean);

    const badEnd = !(textDelta.endsWith("]}") || textDelta.endsWith("[DONE]"));
    tailing = badEnd ? splits.splice(splits.length - 1, 1)[0] : "";

    try {
      for (const s of splits) {
        if (s.endsWith("[DONE]")) {
          continue;
        }

        const jsonDelta = JSON.parse(s).choices[0]?.delta ?? {};

        if (jsonDelta.reasoning_content) {
          if (lastReasoningContent.length === 0) {
            yield '> 思考中...\n>\n> ';
          }
          yield jsonDelta.reasoning_content.replace(/\n/g, '\n> ');
          lastReasoningContent = jsonDelta.reasoning_content;
        }

        if (jsonDelta.content) {
          if (lastReasoningContent.length > 0) {
            yield '\n\n';
            lastReasoningContent = '';
          }
          yield jsonDelta.content;
        }
      }
    } catch (e) {
      console.error("Error parsing stream response:", e);
      console.log("Raw response:", textDelta);
    }
  }
}

async function* handleNonStreamResponse(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const decoder = new TextDecoder();
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value);
  }

  try {
    yield JSON.parse(text).choices[0].message.content;
  } catch (e) {
    console.error("Error parsing non-stream response:", e);
    console.log("Raw response:", text);
  }
}

function validateApiKey(apiKey: string | null, serverType: string): string | null {
  if (!apiKey) {
    if (serverType === 'deepseek') {
      return "请设置 API key。\n请在 https://platform.deepseek.com/ 购买 API 调用，然后设置 API key";
    }
    if (serverType === 'bianxie') {
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
  const serverConfig = getServerConfig(modelConfig.serverType);
  const apiKey = getApiKey(modelConfig.serverType);

  const errorMessage = validateApiKey(apiKey, modelConfig.serverType);
  if (errorMessage) {
    yield errorMessage;
    return;
  }

  const messages = prepareMessages(message, lastQA);
  const body = JSON.stringify({
    model: model,
    messages,
    temperature: temperature,
    stream: modelConfig.requiresStream,
  });

  let resp;
  try {
    resp = await makeApiRequest(serverConfig.baseUrl, apiKey!, body);
  } catch (e: any) {
    yield `出错啦: ${e.message}`;
    return;
  }

  const reader = resp.body?.getReader();
  if (!reader) {
    yield "No response from the server.";
    return;
  }

  if (modelConfig.requiresStream) {
    yield* handleStreamResponse(reader);
  } else {
    yield* handleNonStreamResponse(reader);
  }
}

