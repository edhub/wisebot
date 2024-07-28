export const KEY_OLLAMA_CHOSEN_MODEL = "key_ollama_chosen_model";
export const KEY_OLLAMA_SERVER_URL = "key_ollama_server_url";
const KEY_OLLAMA_AVAILABLE_MODELS = "key_ollama_available_models";

export const LOCAL_SERVER_URL = "http://localhost:11434";

const modelsString = localStorage.getItem(KEY_OLLAMA_AVAILABLE_MODELS);
let availableModels: string[] = JSON.parse(modelsString || "[]");
let chosenModel = localStorage.getItem(KEY_OLLAMA_CHOSEN_MODEL) || "";
let serverUrl = localStorage.getItem(KEY_OLLAMA_SERVER_URL) || LOCAL_SERVER_URL;

async function* queryOllama(prompt: string = "Hi", temprature: number = 0.7) {
  const body = JSON.stringify({
    model: chosenModel,
    prompt,
    temprature,
    keep_alive: "90m",
  });

  let resp;

  try {
    resp = await fetch(serverUrl + "/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
    console.log("server is", serverUrl);
    return;
  }

  const decoder = new TextDecoder();
  let lastDelta = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const textDelta = decoder.decode(value).trim();
    try {
      lastDelta += textDelta;
      let jsonStrings = lastDelta.split("\n");

      let delta = jsonStrings.map((s) => JSON.parse(s).response).join("");

      lastDelta = "";
      yield delta;
    } catch (e) {
      console.log(textDelta);
    }
  }
}

const ollamaApi = {
  get model() {
    return chosenModel;
  },

  set model(model: string) {
    if (chosenModel !== model) {
      chosenModel = model;
      localStorage.setItem(KEY_OLLAMA_CHOSEN_MODEL, model);
    }
  },

  get availableModels() {
    return availableModels;
  },

  set availableModels(models: string[]) {
    if (availableModels !== models) {
      availableModels = models;
      localStorage.setItem(KEY_OLLAMA_AVAILABLE_MODELS, JSON.stringify(models));
    }
  },

  get serverUrl() {
    return serverUrl;
  },

  set serverUrl(url: string) {
    if (serverUrl !== url) {
      serverUrl = url;
      localStorage.setItem(KEY_OLLAMA_SERVER_URL, url);
    }
  },

  query: queryOllama,
};

export default ollamaApi;
