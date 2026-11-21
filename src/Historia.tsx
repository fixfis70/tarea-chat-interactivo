import Chat, {type ChatMessage} from "./components/Chat.tsx";
import {useState} from "react";
import {askSomethingHistoria} from "./service/openai/ContextoHistoria.ts";

export default function Historia() {
  const [inputText, setInputText] = useState<string>()
  const [waitResponse,setWaitResponse] = useState<boolean>()
  const [lastId, setLastId] = useState<string>()
  const [chats, setChats] = useState<ChatMessage[]>([
    // {id: 1, content: "Hola", isAi: false},
    {id: 2, content: "Hola, en que puedo ayudarte hoy?", isAi: true},
    // {id: 3, content: "en nada, solo quiero ver que funciones", isAi: false},
    // {id: 4, content: "Gasto totalemente inecesario de agua 🥀", isAi: true}
  ])

  function userWrite(){
    if (waitResponse) return
    setWaitResponse(true)
    chats.push({
      content:inputText!,
      isAi: false
    })

    aiWrite(inputText!)

    setInputText("")
  }

  function aiWrite(question: string){
    askSomethingHistoria(question,lastId).then(([response,id])=>{
      setLastId(id)
      chats.push({
        content:response,
        isAi: true
      })
      setWaitResponse(false)
    })
  }

  return (
    <div className="flex h-full justify-center bg-gray-950 text-white p-3">
      {/*Chat*/}
      <div className="flex flex-col h-full w-2xl p-4 bg-gray-800 rounded-lg">
        {/* burbujas de texto */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {chats.map((chat) => (
              <Chat
                content={chat.content}
                isAi={chat.isAi}
              />
          ))}
        </div>
        {/*text field*/}
        <div className="mt-3">
           <textarea
               disabled={waitResponse}
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               onKeyDown={(e) => e.key === "Enter" && inputText?.trim() && userWrite()}
               className="w-full resize-none rounded-lg p-3 bg-gray-900 text-white"
               placeholder="Escribe un mensaje..."
           />
        </div>
      </div>
    </div>
  )
}