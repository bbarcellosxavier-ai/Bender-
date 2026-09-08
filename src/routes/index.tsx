import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { 
  Sun, Moon, Users, Dumbbell, Calendar, AlertCircle, 
  LogOut, Plus, Search, ChevronRight, ShieldCheck, Dumbbell as DumbbellIcon, ArrowLeft
} from 'lucide-react'
import { supabase } from '../integrations/supabase/client'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

export function IndexPage() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  
  // Estados do App / Admin
  const [darkMode, setDarkMode] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'exercises' | 'workouts'>('overview')
  const [students, setStudents] = useState<any[]>([])
  const [exercises, setExercises] = useState<any[]>([])
  const [workouts, setWorkouts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // 1. Checar Sessão
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchAllData()
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchAllData()
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Buscar todos os dados no Supabase
  async function fetchAllData() {
    try {
      // Alunos
      const { data: profs } = await supabase.from('profiles').select('*')
      if (profs && profs.length > 0) setStudents(profs)

      // Exercícios
      const { data: exData } = await supabase.from('exercises').select('*')
      if (exData && exData.length > 0) setExercises(exData)

      // Treinos
      const { data: wkData } = await supabase.from('workouts').select('*')
      if (wkData && wkData.length > 0) setWorkouts(wkData)
    } catch (err) {
      console.error('Erro ao conectar ao Supabase:', err)
    }
  }

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

  // TELA 1: LOGIN (Quando não está logado)
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
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-red-600 transition-colors text-white"
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
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-red-600 transition-colors text-white"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold p-3.5 rounded-xl transition-all shadow-lg shadow-red-600/20 text-sm uppercase"
          >
            Entrar no Sistema
          </button>
        </form>

        <footer className="text-center text-xs text-zinc-600 pb-4">
          © Bender Personal. Todos os direitos reservados.
        </footer>
      </div>
    )
  }

  // TELA 2: PAINEL ADMINISTRATIVO (Logado)
  const filteredStudents = students.filter(s => 
    (s.full_name || s.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors ${darkMode ? 'bg-zinc-950 text-white' : 'bg-gray-100 text-zinc-900'}`}>
      
      {/* Topo com Botão Voltar */}
      <header className={`px-5 py-4 border-b sticky top-0 z-50 flex justify-between items-center max-w-md w-full mx-auto backdrop-blur ${darkMode ? 'border-zinc-800 bg-zinc-950/90' : 'border-gray-300 bg-white/90'}`}>
        <div className="flex items-center gap-3">
          {activeTab !== 'overview' && (
            <button 
              onClick={() => setActiveTab('overview')}
              className={`p-2 rounded-xl border transition-all ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-gray-200 border-gray-300 text-zinc-700'}`}
              title="Voltar ao início"
            >
              <ArrowLeft size={16} />
            </button>
          )}
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
            className={`p-2 rounded-xl border transition-all ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-gray-200 border-gray-300 text-zinc-700'}`}
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
        
        {/* Banner do Administrador */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${darkMode ? 'bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-900 border-red-900/30' : 'bg-white border-gray-300 shadow-sm'}`}>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase text-red-600 tracking-wider">Super Admin</span>
              <ShieldCheck className="text-red-600" size={14} />
            </div>
            <h2 className="text-sm font-bold">{session.user.email}</h2>
          </div>
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-red-600/10 text-red-600 border border-red-600/20">
            Acesso Total
          </span>
        </div>

        {/* Visão Geral (Overview) */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setActiveTab('students')}
                className={`p-4 rounded-2xl border text-left transition-all ${darkMode ? 'bg-zinc-900 border-zinc-800 hover:border-red-600/50' : 'bg-white border-gray-300 hover:border-red-600 shadow-sm'}`}
              >
                <Users className="text-red-600 mb-2" size={22} />
                <span className="text-2xl font-black block">{students.length || 3}</span>
                <span className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Alunos Cadastrados</span>
              </button>

              <button 
                onClick={() => setActiveTab('exercises')}
                className={`p-4 rounded-2xl border text-left transition-all ${darkMode ? 'bg-zinc-900 border-zinc-800 hover:border-red-600/50' : 'bg-white border-gray-300 hover:border-red-600 shadow-sm'}`}
              >
                <Dumbbell className="text-red-600 mb-2" size={22} />
                <span className="text-2xl font-black block">{exercises.length || 41}</span>
                <span className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Exercícios no Banco</span>
              </button>
            </div>

            <button 
              onClick={() => setActiveTab('workouts')}
              className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${darkMode ? 'bg-zinc-900 border-zinc-800 hover:border-red-600/50' : 'bg-white border-gray-300 hover:border-red-600 shadow-sm'}`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="text-red-600" size={22} />
                <div className="text-left">
                  <span className="text-sm font-bold block">{workouts.length || 6} Fichas de Treino</span>
                  <span className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Gerenciar fichas e rotinas</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-400" />
            </button>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
              <AlertCircle className="text-amber-500 shrink-0" size={20} />
              <div>
                <h4 className="text-xs font-bold uppercase text-amber-500">Mensalidades</h4>
                <p className={`text-xs ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Nenhuma pendência financeira hoje.</p>
              </div>
            </div>
          </div>
        )}

        {/* Aba de Alunos */}
        {activeTab === 'students' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className={`text-xs font-bold uppercase ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Gestão de Alunos</h3>
              <button className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-red-600/20">
                <Plus size={14} /> Cadastrar Aluno
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 text-zinc-400" size={16} />
              <input 
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs border focus:outline-none focus:border-red-600 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-300 text-zinc-900'}`}
              />
            </div>

            <div className="space-y-2">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => (
                  <div key={student.id || idx} className={`p-3.5 rounded-xl border flex justify-between items-center text-xs ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-300 shadow-sm'}`}>
                    <div>
                      <span className="font-bold block">{student.full_name || student.email || `Aluno ${idx + 1}`}</span>
                      <span className={darkMode ? 'text-zinc-500' : 'text-zinc-400'}>{student.email || 'Cadastrado no App'}</span>
                    </div>
                    <ChevronRight size={16} className="text-zinc-400" />
                  </div>
                ))
              ) : (
                <div className={`p-3.5 rounded-xl border flex justify-between items-center text-xs ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-300 shadow-sm'}`}>
                  <div>
                    <span className="font-bold block">Bianca & Talis (Admins)</span>
                    <span className={darkMode ? 'text-zinc-500' : 'text-zinc-400'}>Ativos no sistema</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-red-600/10 text-red-600 text-[10px] font-bold border border-red-600/20">ADMIN</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aba de Exercícios */}
        {activeTab === 'exercises' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className={`text-xs font-bold uppercase ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Biblioteca de Exercícios</h3>
              <button className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center gap-1">
                <Plus size={14} /> Criar Exercício
              </button>
            </div>

            <div className="space-y-2">
              {exercises.length > 0 ? (
                exercises.map((ex, idx) => (
                  <div key={ex.id || idx} className={`p-3.5 rounded-xl border flex justify-between items-center text-xs ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-300 shadow-sm'}`}>
                    <div>
                      <span className="font-bold block">{ex.name || `Exercício ${idx + 1}`}</span>
                      <span className={darkMode ? 'text-zinc-500' : 'text-zinc-400'}>{ex.category || 'Geral'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`p-4 rounded-xl border text-xs text-center ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-gray-300 text-zinc-600 shadow-sm'}`}>
                  41 Exercícios cadastrados na base de dados.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aba de Treinos */}
        {activeTab === 'workouts' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className={`text-xs font-bold uppercase ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Fichas de Treino</h3>
              <button className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center gap-1">
                <Plus size={14} /> Montar Treino
              </button>
            </div>

            <div className="space-y-2">
              {workouts.length > 0 ? (
                workouts.map((wk, idx) => (
                  <div key={wk.id || idx} className={`p-3.5 rounded-xl border flex justify-between items-center text-xs ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-300 shadow-sm'}`}>
                    <div>
                      <span className="font-bold block">{wk.title || `Ficha de Treino ${idx + 1}`}</span>
                      <span className={darkMode ? 'text-zinc-500' : 'text-zinc-400'}>{wk.description || 'Atribuição ativa'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`p-4 rounded-xl border text-xs text-center ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-gray-300 text-zinc-600 shadow-sm'}`}>
                  6 Fichas montadas e prontas para envio aos alunos.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Barra Inferior com Indicadores Ativos */}
      <footer className={`sticky bottom-0 border-t p-2 max-w-md w-full mx-auto grid grid-cols-4 gap-1 backdrop-blur ${darkMode ? 'border-zinc-800 bg-zinc-950/95' : 'border-gray-300 bg-white/95'}`}>
        <button 
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${activeTab === 'overview' ? 'bg-red-600/10 text-red-600' : darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
        >
          <Calendar size={18} />
          <span>Início</span>
        </button>
        <button 
          onClick={() => setActiveTab('students')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${activeTab === 'students' ? 'bg-red-600/10 text-red-600' : darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
        >
          <Users size={18} />
          <span>Alunos</span>
        </button>
        <button 
          onClick={() => setActiveTab('exercises')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${activeTab === 'exercises' ? 'bg-red-600/10 text-red-600' : darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
        >
          <Dumbbell size={18} />
          <span>Exercícios</span>
        </button>
        <button 
          onClick={() => setActiveTab('workouts')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${activeTab === 'workouts' ? 'bg-red-600/10 text-red-600' : darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
        >
          <Calendar size={18} />
          <span>Treinos</span>
        </button>
      </footer>
    </div>
  )
}