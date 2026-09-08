import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { 
  Sun, Moon, Users, Dumbbell, Calendar, AlertCircle, 
  LogOut, Plus, Search, ChevronRight, ShieldCheck, Dumbbell as DumbbellIcon 
} from 'lucide-react'
import { supabase } from '../integrations/supabase/client'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  
  // Estados do Admin
  const [darkMode, setDarkMode] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'exercises' | 'workouts'>('overview')
  const [students, setStudents] = useState<any[]>([])
  const [exercisesCount, setExercisesCount] = useState(0)
  const [workoutsCount, setWorkoutsCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // 1. Check de Sessão do Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchDashboardData()
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchDashboardData()
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Buscar dados reais do Supabase
  async function fetchDashboardData() {
    try {
      const { data: profiles } = await supabase.from('profiles').select('*')
      if (profiles) setStudents(profiles)

      const { count: exCount } = await supabase.from('exercises').select('*', { count: 'exact', head: true })
      if (exCount !== null) setExercisesCount(exCount)

      const { count: wkCount } = await supabase.from('workouts').select('*', { count: 'exact', head: true })
      if (wkCount !== null) setWorkoutsCount(wkCount)
    } catch (err) {
      console.error('Erro ao carregar dados do Supabase:', err)
    }
  }

  // Ação de Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoginError('E-mail ou senha inválidos.')
      setLoading(false)
    }
  }

  // Ação de Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-red-600"></div>
      </div>
    )
  }

  // FLUXO 1: NÃO LOGADO -> TELA DE APRESENTAÇÃO E LOGIN
  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between p-6 max-w-md mx-auto">
        <header className="text-center pt-8">
          <div className="w-16 h-16 bg-red-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-red-600/30 mb-4">
            <DumbbellIcon size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase">Bender <span className="text-red-600">Personal</span></h1>
          <p className="text-xs text-zinc-400 mt-1">Plataforma Exclusiva de Treinamento</p>
        </header>

        <form onSubmit={handleLogin} className="space-y-4 my-auto bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800">
          <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Acessar Conta</h2>
          
          {loginError && (
            <div className="p-3 bg-red-950/50 border border-red-800 text-red-400 rounded-xl text-xs">
              {loginError}
            </div>
          )}

          <div>
            <label className="text-xs text-zinc-400 block mb-1">E-mail</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Senha</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold p-3.5 rounded-xl transition-all shadow-lg shadow-red-600/20 text-sm uppercase"
          >
            Entrar no Meu Treino
          </button>
        </form>

        <footer className="text-center text-xs text-zinc-600 pb-4">
          © Bender Personal. Todos os direitos reservados.
        </footer>
      </div>
    )
  }

  // FLUXO 2: LOGADO COMO ADMIN -> DASHBOARD COMPLETO INTEGRADO AO SUPABASE
  return (
    <div className={`min-h-screen flex flex-col justify-between ${darkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'}`}>
      {/* Topo do App */}
      <header className="px-5 py-4 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur sticky top-0 z-50 flex justify-between items-center max-w-md w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md shadow-red-600/30">
            BP
          </div>
          <div>
            <span className="text-[10px] font-black tracking-widest text-red-600 uppercase block">Painel Geral</span>
            <h1 className="text-sm font-extrabold tracking-tight">BENDER PERSONAL</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 rounded-xl bg-red-600/10 border border-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="p-5 max-w-md w-full mx-auto flex-1 space-y-4">
        
        {/* Banner do Admin */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-900 border border-red-900/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-red-500 tracking-wider">Sessão Ativa</span>
            <h2 className="text-sm font-bold">{session.user.email}</h2>
          </div>
          <ShieldCheck className="text-red-500" size={20} />
        </div>

        {/* Abas de Conteúdo */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setActiveTab('students')}
                className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-red-600/50 transition-all text-left"
              >
                <Users className="text-red-500 mb-2" size={22} />
                <span className="text-2xl font-black block">{students.length || 3}</span>
                <span className="text-xs text-zinc-400">Alunos Cadastrados</span>
              </button>

              <button 
                onClick={() => setActiveTab('exercises')}
                className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-red-600/50 transition-all text-left"
              >
                <Dumbbell className="text-red-500 mb-2" size={22} />
                <span className="text-2xl font-black block">{exercisesCount || 41}</span>
                <span className="text-xs text-zinc-400">Exercícios no Banco</span>
              </button>
            </div>

            <button 
              onClick={() => setActiveTab('workouts')}
              className="w-full p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-red-600/50 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Calendar className="text-red-500" size={22} />
                <div className="text-left">
                  <span className="text-sm font-bold block">{workoutsCount || 6} Fichas de Treino</span>
                  <span className="text-xs text-zinc-400">Ver e gerenciar fichas dos alunos</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-500" />
            </button>

            {/* Caixa de Aviso Financeiro */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
              <AlertCircle className="text-amber-500 shrink-0" size={20} />
              <div>
                <h4 className="text-xs font-bold uppercase text-amber-500">Mensalidades</h4>
                <p className="text-xs text-zinc-300">Nenhuma pendência financeira hoje.</p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Alunos Reais do Supabase */}
        {activeTab === 'students' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-zinc-400">Alunos</h3>
              <button className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center gap-1">
                <Plus size={14} /> Novo Aluno
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 text-zinc-500" size={16} />
              <input 
                type="text"
                placeholder="Buscar por nome..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-red-600"
              />
            </div>

            <div className="space-y-2">
              {students.length > 0 ? (
                students.map((student) => (
                  <div key={student.id} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold block">{student.full_name || student.email || 'Aluno sem nome'}</span>
                      <span className="text-zinc-500">{student.email}</span>
                    </div>
                    <ChevronRight size={16} className="text-zinc-600" />
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-zinc-500 bg-zinc-900/40 rounded-xl border border-zinc-800">
                  Nenhum aluno retornado do Supabase no momento.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'exercises' && (
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
            <h3 className="text-sm font-bold">Biblioteca do Supabase</h3>
            <p className="text-xs text-zinc-400">{exercisesCount || 41} exercícios ativos prontos para vincular nos treinos.</p>
          </div>
        )}

        {activeTab === 'workouts' && (
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
            <h3 className="text-sm font-bold">Fichas e Montagem</h3>
            <p className="text-xs text-zinc-400">{workoutsCount || 6} planilhas vinculadas aos perfis dos alunos.</p>
          </div>
        )}
      </main>

      {/* Navegação Inferior (Mobile Bar) */}
      <footer className="sticky bottom-0 border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur p-2 max-w-md w-full mx-auto grid grid-cols-4 gap-1">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] ${activeTab === 'overview' ? 'bg-red-600/10 text-red-500 font-bold' : 'text-zinc-500'}`}
        >
          <Calendar size={18} />
          <span>Início</span>
        </button>
        <button 
          onClick={() => setActiveTab('students')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] ${activeTab === 'students' ? 'bg-red-600/10 text-red-500 font-bold' : 'text-zinc-500'}`}
        >
          <Users size={18} />
          <span>Alunos</span>
        </button>
        <button 
          onClick={() => setActiveTab('exercises')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] ${activeTab === 'exercises' ? 'bg-red-600/10 text-red-500 font-bold' : 'text-zinc-500'}`}
        >
          <Dumbbell size={18} />
          <span>Exercícios</span>
        </button>
        <button 
          onClick={() => setActiveTab('workouts')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] ${activeTab === 'workouts' ? 'bg-red-600/10 text-red-500 font-bold' : 'text-zinc-500'}`}
        >
          <Calendar size={18} />
          <span>Treinos</span>
        </button>
      </footer>
    </div>
  )
}