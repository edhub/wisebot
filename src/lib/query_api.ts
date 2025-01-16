import { getModelConfig, getServerConfig, getApiKey } from './model_config';

export async function* query(
  model: string,
  prompt: string = "Hi",
  temperature: number = 0.7,
) {
  const modelConfig = getModelConfig(model);
  const serverConfig = getServerConfig(modelConfig.serverType);
  const apiKey = getApiKey(modelConfig.serverType);

  if (!apiKey) {
    yield "请设置 API key。\n";
    if (modelConfig.serverType === 'deepseek') {
      yield "请在 https://platform.deepseek.com/ 购买 API 调用，然后设置 API key";
    }
    if (modelConfig.serverType === 'bianxie') {
      yield "请在 https://api.bianxie.ai 购买 API 调用，然后设置 API key";
    }
    return;
  }

  const stream = modelConfig.requiresStream;

  const body = JSON.stringify({
    model: model,
    messages: [{ role: "user", content: prompt }],
    temperature: temperature,
    stream,
  });

  let resp;
  try {
    resp = await fetch(serverConfig.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body,
    });
  } catch (e: any) {
    yield `出错啦: ${e.message}`;
    return;
  }

  const reader = resp.body?.getReader();
  if (!reader) {
    yield "No response from the server.";
    return;
  }

  const decoder = new TextDecoder();

  if (stream) {
    let tailing = "";
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      let textDelta = tailing + decoder.decode(value);
      let splits = textDelta
        .split("\n")
        .flatMap((s) => s.split("data: "))
        .filter(Boolean);

      const badEnd = !(textDelta.endsWith("]}") || textDelta.endsWith("[DONE]"));
      tailing = badEnd ? splits.splice(splits.length - 1, 1)[0] : "";
      
      try {
        let delta = splits
          .map((s) => {
            return s.endsWith("[DONE]")
              ? ""
              : JSON.parse(s).choices[0].delta.content;
          })
          .join("");
        yield delta;
      } catch (e) {
        console.error("Error parsing stream response:", e);
        console.log("Raw response:", textDelta);
      }
    }
  } else {
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      text += decoder.decode(value);
    }

    try {
      yield JSON.parse(text).choices[0].message.content;
    } catch (e) {
      console.error("Error parsing non-stream response:", e);
      console.log("Raw response:", text);
    }
  }
}

