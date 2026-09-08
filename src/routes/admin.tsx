import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Sun, Moon, Users, Dumbbell, Calendar, AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/admin' as any)({
  component: AdminDashboard,
})

function AdminDashboard() {
  const [darkMode, setDarkMode] = useState(false)

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-zinc-900'}`}>
      {/* Cabeçalho */}
      <header className="p-4 flex justify-between items-center border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold">PAINEL</h1>
          <p className="text-sm text-zinc-400">Bender Personal</p>
        </div>
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full border border-zinc-700 hover:bg-zinc-800 transition-colors"
          title="Alternar tema"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* Conteúdo Principal / Cards */}
      <main className="p-4 grid grid-cols-2 gap-4 max-w-md mx-auto">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col gap-1">
          <Users className="text-red-500 mb-2" size={24} />
          <span className="text-2xl font-bold">3</span>
          <span className="text-xs text-zinc-400">Alunos ativos</span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col gap-1">
          <Users className="text-red-500 mb-2" size={24} />
          <span className="text-2xl font-bold">3</span>
          <span className="text-xs text-zinc-400">Alunos no total</span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col gap-1">
          <Dumbbell className="text-red-500 mb-2" size={24} />
          <span className="text-2xl font-bold">41</span>
          <span className="text-xs text-zinc-400">Exercícios</span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col gap-1">
          <Calendar className="text-red-500 mb-2" size={24} />
          <span className="text-2xl font-bold">6</span>
          <span className="text-xs text-zinc-400">Treinos</span>
        </div>

        <div className="col-span-2 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-center gap-3">
          <AlertCircle className="text-amber-500" size={20} />
          <div>
            <h4 className="text-xs font-bold uppercase text-zinc-400">Mensalidades em Atraso</h4>
            <p className="text-sm">Nenhuma pendência.</p>
          </div>
        </div>
      </main>
    </div>
  )
}