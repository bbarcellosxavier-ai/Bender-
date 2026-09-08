import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Sun, Moon, Users, Dumbbell, Calendar, AlertCircle, ArrowLeft, LogOut, ChevronRight, UserPlus } from 'lucide-react'

export const Route = createFileRoute('/admin')({
  component: AdminDashboard,
})

function AdminDashboard() {
  const [darkMode, setDarkMode] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'exercises' | 'workouts'>('overview')
  const navigate = useNavigate()

  return (
    <div className={`min-h-screen flex flex-col justify-between ${darkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
      {/* Topo Unificado - Idêntico ao design da Landing Page */}
      <header className="px-5 py-4 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate({ to: '/' })}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-600 transition-all text-zinc-300"
            title="Voltar para o Início"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="text-xs font-black tracking-widest text-red-600 uppercase block">Área Restrita</span>
            <h1 className="text-base font-extrabold tracking-tight leading-none">PAINEL PERSONAL</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all text-zinc-300"
            title="Alternar Tema"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button 
            onClick={() => navigate({ to: '/' })}
            className="p-2.5 rounded-xl bg-red-600/10 border border-red-600/30 text-red-500 hover:bg-red-600 hover:text-white transition-all"
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Conteúdo Principal Otimizado para Mobile */}
      <main className="p-5 max-w-md w-full mx-auto flex-1 space-y-5">
        
        {/* Perfil do Administrador Conectado */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 to-zinc-900 border border-red-900/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-black text-white shadow-lg shadow-red-600/30">
              B
            </div>
            <div>
              <h2 className="text-sm font-bold">Bianca & Talis</h2>
              <p className="text-xs text-zinc-400">Acesso Super Admin / Personal</p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
            Ativo
          </span>
        </div>

        {/* Visão Geral dos Indicadores */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setActiveTab('students')}
                className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-red-600/50 transition-all text-left group relative overflow-hidden"
              >
                <div className="w-8 h-8 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-500 mb-3 group-hover:scale-110 transition-transform">
                  <Users size={18} />
                </div>
                <span className="text-3xl font-black block tracking-tight">3</span>
                <span className="text-xs font-medium text-zinc-400">Alunos Ativos</span>
              </button>

              <button 
                onClick={() => setActiveTab('exercises')}
                className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-red-600/50 transition-all text-left group relative overflow-hidden"
              >
                <div className="w-8 h-8 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-500 mb-3 group-hover:scale-110 transition-transform">
                  <Dumbbell size={18} />
                </div>
                <span className="text-3xl font-black block tracking-tight">41</span>
                <span className="text-xs font-medium text-zinc-400">Exercícios</span>
              </button>
            </div>

            <button 
              onClick={() => setActiveTab('workouts')}
              className="w-full p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-red-600/50 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-500">
                  <Calendar size={20} />
                </div>
                <div className="text-left">
                  <span className="text-base font-bold block">6 Fichas de Treino</span>
                  <span className="text-xs text-zinc-400">Gerenciar planilhas ativas</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-500 group-hover:text-white transition-colors" />
            </button>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
              <AlertCircle className="text-amber-500 shrink-0" size={20} />
              <div>
                <h4 className="text-xs font-extrabold uppercase text-amber-500">Status Financeiro</h4>
                <p className="text-xs text-zinc-300">Todas as mensalidades estão em dia.</p>
              </div>
            </div>
          </div>
        )}

        {/* Abas Detalhadas */}
        {activeTab === 'students' && (
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold">Gestão de Alunos</h3>
                <p className="text-xs text-zinc-400">Alunos cadastrados na plataforma</p>
              </div>
              <button className="p-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-1 text-xs font-bold">
                <UserPlus size={14} /> NOVO
              </button>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold block">Bianca</span>
                  <span className="text-zinc-500">bianca@admin.com</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 font-bold border border-red-800">ADMIN</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold block">Talis</span>
                  <span className="text-zinc-500">talis@admin.com</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 font-bold border border-red-800">ADMIN</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'exercises' && (
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
            <h3 className="text-base font-bold">Biblioteca de Exercícios</h3>
            <p className="text-xs text-zinc-400">41 exercícios cadastrados com demonstração em vídeo/GIF.</p>
          </div>
        )}

        {activeTab === 'workouts' && (
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
            <h3 className="text-base font-bold">Fichas de Treino</h3>
            <p className="text-xs text-zinc-400">Monte e atribua treinos para seus alunos.</p>
          </div>
        )}
      </main>

      {/* Menu Fixo de Navegação Inferior (Mobile Bar) */}
      <footer className="sticky bottom-0 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur p-2.5 max-w-md w-full mx-auto grid grid-cols-4 gap-1">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-red-600/10 text-red-500 font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Calendar size={18} />
          <span className="text-[10px]">Painel</span>
        </button>
        <button 
          onClick={() => setActiveTab('students')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'students' ? 'bg-red-600/10 text-red-500 font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Users size={18} />
          <span className="text-[10px]">Alunos</span>
        </button>
        <button 
          onClick={() => setActiveTab('exercises')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'exercises' ? 'bg-red-600/10 text-red-500 font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Dumbbell size={18} />
          <span className="text-[10px]">Exercícios</span>
        </button>
        <button 
          onClick={() => setActiveTab('workouts')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'workouts' ? 'bg-red-600/10 text-red-500 font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Calendar size={18} />
          <span className="text-[10px]">Treinos</span>
        </button>
      </footer>
    </div>
  )
}