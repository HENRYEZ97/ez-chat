import Sidebar from "./componentes/Sidebar";
import ChatWindow from "./componentes/ChatWindow";

export default function Home () {
  return (
    <div className="flex">
      <Sidebar />
      <ChatWindow />
    </div>
  )
}