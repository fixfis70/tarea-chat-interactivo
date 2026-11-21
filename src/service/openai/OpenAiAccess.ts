import OpenAi from "openai";
const env = import.meta.env;

const config = {
    endpoint: env.VITE_FOUNDRY_ENDPOINT,
    apiKey: env.VITE_FOUNDRY_KEY,
    model: env.VITE_MODEL,
}
const openai = new OpenAi({
    dangerouslyAllowBrowser: true,
    baseURL: config.endpoint,
    apiKey: config.apiKey,
});


export { config, openai}