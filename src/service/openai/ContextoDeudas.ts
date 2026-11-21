import {config, openai} from "./OpenAiAccess.ts";
import {type ResponseInput, type Tool} from "openai/resources/responses/responses";


const reniecEndpoint :string = (import.meta.env.VITE_RENIEC ?? "").replace(/\/+$/, "")

const contextoDeuda = `Eres un asistente de atencion al cliente de la empresa Fixfis. tu trabajo es atenter a clientes con sus deudas.
Podras ver existencia del cliente, deuda, pagar deudas, y buscar a un cliente por su dni.
El cliente Siempre tendra que identificarse con su dni. si tiene algun tipo de deudas, decir cuales y cual va a pagar.
Si el cliente ni tiene deudas, indicarlo amablemente.
tienes paciencia, hablas poco y eres directo
No respodner en markdown, solo texto plano. (puedes usar emojies),
Saluda por el nombre del cliente`

interface Deuda {
    dni: string,
    id : number
    deudaTotal: number,
    pagado: number | 0.,
    descripcion: string
}
const dataSet: Deuda[] = [
    { id: 1, dni: "22079533", deudaTotal: 1000, pagado: 0, descripcion: "Deuda de electricidad" },
    { id: 2, dni: "70631171", deudaTotal: 1500, pagado: 500, descripcion: "Deuda de agua" },
    { id: 3, dni: "70631178", deudaTotal: 850, pagado: 850, descripcion: "Deuda de mantenimiento" },
    { id: 4, dni: "45892163", deudaTotal: 2000, pagado: 1000, descripcion: "Deuda de electricidad" },
    { id: 5, dni: "71928456", deudaTotal: 1200, pagado: 0, descripcion: "Deuda de agua" },
    { id: 6, dni: "60381729", deudaTotal: 750, pagado: 250, descripcion: "Deuda de internet" },
    { id: 7, dni: "48192637", deudaTotal: 1800, pagado: 1800, descripcion: "Deuda de mantenimiento" },
    { id: 8, dni: "73519284", deudaTotal: 950, pagado: 0, descripcion: "Deuda de electricidad" },
    { id: 9, dni: "22079533", deudaTotal: 500, pagado: 200, descripcion: "Deuda de agua" },
    { id: 10, dni: "70631171", deudaTotal: 2200, pagado: 1000, descripcion: "Deuda de mantenimiento" },
    { id: 11, dni: "45892163", deudaTotal: 600, pagado: 600, descripcion: "Deuda de internet" },
    { id: 12, dni: "81927364", deudaTotal: 1300, pagado: 0, descripcion: "Deuda de electricidad" },
    { id: 13, dni: "71928456", deudaTotal: 900, pagado: 450, descripcion: "Deuda de mantenimiento" },
    { id: 14, dni: "60381729", deudaTotal: 1600, pagado: 800, descripcion: "Deuda de agua" },
    { id: 15, dni: "92736185", deudaTotal: 1100, pagado: 1100, descripcion: "Deuda de electricidad" },
    { id: 16, dni: "73519284", deudaTotal: 2000, pagado: 500, descripcion: "Deuda de internet" },
    { id: 17, dni: "48192637", deudaTotal: 700, pagado: 0, descripcion: "Deuda de agua" },
    { id: 18, dni: "81927364", deudaTotal: 1450, pagado: 750, descripcion: "Deuda de mantenimiento" },
    { id: 19, dni: "22079533", deudaTotal: 1800, pagado: 900, descripcion: "Deuda de electricidad" },
    { id: 20, dni: "92736185", deudaTotal: 550, pagado: 0, descripcion: "Deuda de agua" },
];

function pagarDeuda(dni:string, id:number, monto:number){
    if (dni.length !== 8) return "El dni debe tener 8 digitos"
    if (dni.startsWith("0")) return "El dni no puede comenzar con 0"

    const deuda = dataSet.find(d=>d.dni === dni && d.id === id)

    if (deuda === undefined) return "No se encontro ninguna deuda con ese dni y para ese id"

    let calculo = deuda.deudaTotal - (deuda.pagado + monto);

    if (calculo !== 0) return `Hubo un ${calculo<0 ? "exedente" : "faltante" } de ${calculo}, el pago tiene que ser exacto, no prosigue`

    deuda.pagado = deuda.pagado + monto;

    return `Se pago exitosamente, pagado ${deuda.pagado}, faltante ${deuda.deudaTotal - deuda.pagado}`
}

function verDeuda(dni:string, id:number){
    if (dni.length !== 8) return "El dni debe tener 8 digitos"
    if (dni.startsWith("0")) return "El dni no puede comenzar con 0"

    const deuda = dataSet.find(d=>d.dni === dni && d.id === id)

    if (deuda === undefined) return "No se encontro ninguna deuda con ese dni y para ese id"

    return deuda
}

function verDeudas(dni:string){
    if (dni.length !== 8) return "El dni debe tener 8 digitos"
    if (dni.startsWith("0")) return "El dni no puede comenzar con 0"

    const deudas = dataSet.filter(d=>d.dni === dni)
    if (deudas.length === 0) return "No se encontro ninguna deuda con ese dni"
    return deudas
}

async function consultarReniec(dni:string){
    if (dni.length !== 8) return "El dni debe tener 8 digitos"
    if (dni.startsWith("0")) return "El dni no puede comenzar con 0"
    if (!reniecEndpoint) return { error: "Falta VITE_RENIEC en el .env" }
    const url = `${reniecEndpoint}/${dni}`
    const rs = await fetch(url,{
        method : "GET",
        headers : {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
    })

    const texto = await rs.text()
    if (!rs.ok) return { error: `RENIEC ${rs.status}: ${texto || rs.statusText}` }
    if (!texto) return { error: "RENIEC devolvio una respuesta vacia" }

    try {
        return JSON.parse(texto)
    } catch {
        return { error: `RENIEC devolvio algo que no es JSON: ${texto.slice(0, 200)}` }
    }
}

const funciones: Record<string, (args: any) => any> = {
    pagarDeuda: (args) => pagarDeuda(args.dni, args.id, args.monto),
    verDeuda: (args) => verDeuda(args.dni, args.id),
    verDeudas: (args) => verDeudas(args.dni),
    consultarReniec: (args) => consultarReniec(args.dni)
};
const deudaTools: Tool[] = [
    {
        type: "function",
        name: "pagarDeuda",
        description: "Paga la deuda del cliente, el cliente debe estar registrado en el sistema, debe tener una deuda para poder pagarla y indicar el monto",
        parameters: {
            type: "object",
            properties: {
                dni: {type: "string", description: "Dni del cliente (este dato te lo da el cliente, antes de enviar, validar que el dni sea de 8 digitos y numeros) "},
                id: {type: "number", description: "id de la deuda, normalmente la obtienes consultando todas las deudas del cliente, o el cliente te lo proporciona"},
                monto: {type: "number", description: "monto monetario que el cliente va a pagar sobre esta deuda"}
            },
            required: ["dni","id","monto"],
            additionalProperties: false
        },
        strict: true
    },

    {
        type: "function",
        name: "verDeuda",
        description: "Vemos una deuda en especifico del usuario",
        parameters: {
            type: "object",
            properties: {
                dni: {type: "string", description: "Dni del cliente (este dato te lo da el cliente, antes de enviar, validar que el dni sea de 8 digitos y numeros) "},
                id: {type: "number", description: "id de la deuda, normalmente la obtienes consultando todas las deudas del cliente, o el cliente te lo proporciona"}
            },
            required: ["dni","id"],
            additionalProperties: false
        },
        strict: true
    },

    {
        type: "function",
        name: "verDeudas",
        description: "Vemos todas las deudas del cliente",
        parameters: {
            type: "object",
            properties: {
                dni: {type: "string", description: "Dni del cliente (este dato te lo da el cliente, antes de enviar, validar que el dni sea de 8 digitos y numeros) "}
            },
            required: ["dni"],
            additionalProperties: false
        },
        strict: true
    },
    {
        type: "function",
        name: "consultarReniec",
        description: "Obtiene el nombre del cliente, esto para una atencion mas personalizada",
        parameters: {
            type: "object",
            properties: {
                dni: {type: "string", description: "Dni del cliente (este dato te lo da el cliente, antes de enviar, validar que el dni sea de 8 digitos y numeros) "}
            },
            required: ["dni"],
            additionalProperties: false
        },
        strict: true
    }
]


export async function askSomethingDeudas(question: string, lastId: any = undefined): Promise<[string, string?]> {
    let input: ResponseInput = [{role: "user", content: question}]

    for (let i = 0; i < 5; i++) {
        const response = await openai.responses.create({
            model: config.model,
            instructions: contextoDeuda,
            input: input,
            tools : deudaTools,
            previous_response_id: lastId,
            max_output_tokens: 2000,
            reasoning: {effort: "low"}
        })

        lastId = response.id

        const llamadas = response.output.filter((item) => item.type === 'function_call')

        if (llamadas.length === 0){
            return [response.output_text,response.id]
        }

        input = await Promise.all(llamadas.map(async (llamada) => {
            const name = llamada.name;
            const args = JSON.parse(llamada.arguments);

            console.log(`[Funcion] ${name}(${JSON.stringify(args)})`);

            let resultado;

            try {
                const ejecutar = funciones[name];

                if (!ejecutar) {
                    throw new Error(`Función desconocida: ${name}`);
                }

                resultado = await ejecutar(args);

            } catch (e) {
                resultado = {
                    error: e instanceof Error ? e.message : "Error desconocido"
                };
            }

            console.log(`[resultado] ${JSON.stringify(resultado)}`);

            return {
                type: "function_call_output" as const,
                call_id: llamada.call_id,
                output: JSON.stringify(resultado)
            };
        }));
    }
    return ["Error", undefined]
}