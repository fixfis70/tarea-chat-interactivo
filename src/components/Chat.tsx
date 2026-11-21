
export interface ChatMessage {
    id?: number
    content: string
    isAi: boolean
}
export default function Chat({content, isAi}: ChatMessage) {

    const [direccion, color] = [
        isAi ? "justify-start" : "justify-end",
        isAi ? "bg-slate-700" : "bg-gray-600",
    ]

    return (
        <div className={`flex flex-row w-full ${direccion}`}>
            <div className={`flex flex-col max-w-[70%] min-w-[40%] rounded-lg ${color} ${direccion} p-2`}>
                {/*quien*/}
                <div className={`flex w-full font-bold text-base text-white ${direccion}`}>
                    {isAi ? "AI" : "Tu"}
                </div>
                {/*contenido*/}
                <div className="flex w-full text-gray-300 text-sm">
                    {content}
                </div>
            </div>
        </div>
    )
}