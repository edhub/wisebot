export const KEY_BX_API_KEY = "key_bian_xie_api_key";
export const KEY_BX_CHOSEN_MODEL = "key_bian_xie_chosen_model";

let apiKey = localStorage.getItem(KEY_BX_API_KEY) || "";

function getApiKey() {
  return apiKey;
}

function setApiKey(key: string) {
  if (apiKey === key) {
    return;
  }
  apiKey = key;
  localStorage.setItem(KEY_BX_API_KEY, apiKey);
}

const SERVER_URL = "https://api.bianxie.ai/v1/chat/completions";

async function* queryBianXie(model: string, prompt: string = "Hi", temprature: number = 0.7) {
  if (!apiKey) {
    yield "API key is not set.";
    return;
  }

  // o1mini 不用 stream 整体速度会快很多。
  const stream = model.startsWith("o1") ? false : true;

  const body = JSON.stringify({
    model: model,
    messages: [{ role: "user", content: prompt }],
    temprature: temprature,
    stream,
  });

  let resp;
  try {
    resp = await fetch(SERVER_URL, {
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

  let tailing = "";

  if (stream) {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // split the response by newline, and filter empty strings
      let textDelta = tailing + decoder.decode(value);
      let splits = textDelta
        .split("\n")
        .flatMap((s) => s.split("data: "))
        .filter(Boolean);

      const badEnd = !(textDelta.endsWith("]}") || textDelta.endsWith("[DONE]"));
      tailing = badEnd ? splits.splice(splits.length - 1, 1)[0] : "";
      if (badEnd) {
        console.log(tailing);
      }

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
        console.log(e);
        console.log(textDelta);
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
      console.log(text);
    }
  }
}

const BianXieApi = {
  getApiKey,
  setApiKey,
  query: queryBianXie,
};

export default BianXieApi;
