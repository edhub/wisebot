const MODEL_NAME = "codegemma";
const DEFAULT_TEMPRATURE = 0.9;

export async function* queryBianXie(
  prompt: string = "Hi",
  server: string = "https://api.bianxie.ai",
  temprature: number = 0.7
) {
  const body = JSON.stringify({
    model: "gpt-4o",
    // model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    temprature: temprature,
    stream: true,
  });
  const url = "https://api.bianxie.ai/v1/chat/completions";
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer ",
    },
    body,
  });

  const reader = resp.body?.getReader();
  if (!reader) {
    yield "No response from the server.";
    console.log("server is", server);
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
          return s.endsWith("[DONE]")
            ? ""
            : JSON.parse(s).choices[0].delta.content;
        })
        .join("");
      yield delta;
    } catch (e) {
      console.log(textDelta);
    }
  }
}
