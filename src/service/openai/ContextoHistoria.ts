import {config, openai} from "./OpenAiAccess.ts";
import type {ResponseInput} from "openai/resources/responses/responses";

const contextoHistoria = `Eres el mejor historiados de peru, tu unicamente sabes de perú y cultura general, nunca le das la razon directamente al usuario.
Nunca hables de cualquier otro tema que no sea historia del peru o general.
No respondas en markdown, solo texto plano. (puedes usar emojies)`


export async function askSomethingHistoria(question: string, lastId: any = undefined): Promise<[string, string]> {
    let input: ResponseInput = [{role: "user", content: question}]
    console.log("Preguntando")
    const response = await openai.responses.create({
        model: config.model,
        instructions: contextoHistoria,
        input: input,
        previous_response_id: lastId,
        max_output_tokens: 2000,
        reasoning: {effort: "low"}
    })

    console.log(`Respuestasss: ${response.output_text}`)
    return [response.output_text,response.id]
}