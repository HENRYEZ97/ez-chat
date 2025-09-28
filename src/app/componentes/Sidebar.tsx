export default function Sidebar () {
    return (
        <div className="w-64 md:w-1/4 h-screen bg-gray-900 dark:bg-gray-950 text-white p-4 flex flex-col justify-between">
            <div>
            <h2 className="text-xl font-bold mb-4 ml-2">Conversas</h2>
                <ul className="space-y-2">
                    <li className="p-2 rounded hover:bg-gray-700 cursor-pointer">Setor qualquer</li>
                    <li className="p-2 rounded hover:bg-gray-700 cursor-pointer">Financeiro</li>
                    <li className="p-2 rounded hover:bg-gray-700 cursor-pointer">TI</li>
                </ul>
            </div>
    </div>    
)
}