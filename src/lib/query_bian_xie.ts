export const KEY_BX_API_KEY = "key_bian_xie_api_key";
export const KEY_BX_CHOSEN_MODEL = "key_bian_xie_chosen_model";

let apiKey = localStorage.getItem(KEY_BX_API_KEY) || "";
let chosenModel = localStorage.getItem(KEY_BX_CHOSEN_MODEL) || "gpt-4o-mini";

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

function getModel() {
  return chosenModel;
}

function setModel(model: string) {
  if (chosenModel === model) {
    return;
  }

  chosenModel = model;
  localStorage.setItem(KEY_BX_CHOSEN_MODEL, model);
}

async function* queryBianXie(prompt: string = "Hi", temprature: number = 0.7) {
  if (!apiKey) {
    yield "API key is not set.";
    return;
  }

  const body = JSON.stringify({
    model: chosenModel,
    messages: [{ role: "user", content: prompt }],
    temprature: temprature,
    stream: true,
  });
  const url = "https://api.bianxie.ai/v1/chat/completions";
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body,
  });

  const reader = resp.body?.getReader();
  if (!reader) {
    yield "No response from the server.";
    return;
  }

  const decoder = new TextDecoder();

  let tailing = "";

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

    try {
      let delta = splits
        .map((s) => {
          return s.endsWith("[DONE]") ? "" : JSON.parse(s).choices[0].delta.content;
        })
        .join("");
      yield delta;
    } catch (e) {
      console.log(textDelta);
    }
  }
}

const BianXieApi = {
  getApiKey,
  setApiKey,
  getModel,
  setModel,
  query: queryBianXie,
};

export default BianXieApi;
