import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
Activity,
AlertCircle,
Bell,
Calendar,
Check,
ChevronRight,
CircleDollarSign,
Dumbbell,
Home,
LogOut,
Moon,
Plus,
Search,
Settings,
ShieldCheck,
Sun,
Trash2,
Trophy,
User,
Users,
Wallet,
X,
} from 'lucide-react'
import { supabase } from '../integrations/supabase/client'

export const Route = createFileRoute('/')({
component: IndexPage,
})

type Role = 'admin' | 'super_admin' | 'personal' | 'aluno' | string

type ModalType =
| 'student'
| 'exercise'
| 'workout'
| 'payment'
| 'studentDetails'
| null

type Tab =
| 'dashboard'
| 'students'
| 'workouts'
| 'exercises'
| 'finance'
| 'settings'

type Student = {
id: string
user_id: string | null
full_name: string
email: string | null
phone: string | null
start_date: string
notes: string | null
status: string
monthly_fee: number
due_day: number
grace_days: number
}

type MuscleGroup = {
id: string
name: string
slug: string
}

type Exercise = {
id: string
muscle_group_id: string
name: string
instructions: string
media_url: string | null
media_type: string
difficulty: string
equipment: string | null
muscle_groups?: {
name: string
} | null
}

type Workout = {
id: string
name: string
focus: string | null
description: string | null
created_by: string | null
}

type WorkoutExercise = {
id: string
workout_id: string
exercise_id: string
position: number
sets: number
reps: string
rest_seconds: number
notes: string | null
exercise?: Exercise
}

type StudentWorkout = {
id: string
student_id: string
workout_id: string
weekday: number | null
position: number
active: boolean
workout?: Workout
}

type Payment = {
id: string
student_id: string
reference_month: string
amount: number
due_date: string
paid_at: string | null
status: string
notes: string | null
student?: Student
}

function formatCurrency(value: number) {
return new Intl.NumberFormat('pt-BR', {
style: 'currency',
currency: 'BRL',
}).format(Number(value) || 0)
}

function formatDate(date: string | null | undefined) {
if (!date) return '-'

const parsed = new Date(`${date}T12:00:00`)

if (Number.isNaN(parsed.getTime())) return date

return parsed.toLocaleDateString('pt-BR')
}

function getRoleLabel(role: Role) {
if (role === 'aluno') return 'Aluno'
if (role === 'personal') return 'Personal'
if (role === 'admin' || role === 'super_admin') {
return 'Administrador'
}

return role || 'Usuário'
}

function getTodayWeekday() {
const day = new Date().getDay()

return day === 0 ? 7 : day
}

function getWeekdayName(day: number | null) {
const names = [
'',
'Segunda',
'Terça',
'Quarta',
'Quinta',
'Sexta',
'Sábado',
'Domingo',
]

return day ? names[day] || '-' : 'Todos os dias'
}

function isAdminRole(role: Role) {
return (
role === 'admin' ||
role === 'super_admin' ||
role === 'personal'
)
}

function normalizeStudent(student: any): Student {
return {
id: String(student.id),
user_id: student.user_id ?? null,
full_name: String(student.full_name ?? ''),
email: student.email ?? null,
phone: student.phone ?? null,
start_date:
student.start_date ||
new Date().toISOString().slice(0, 10),
notes: student.notes ?? null,
status: student.status || 'ativo',
monthly_fee: Number(student.monthly_fee) || 0,
due_day: Number(student.due_day) || 5,
grace_days: Number(student.grace_days) || 0,
}
}

function sortStudents(list: Student[]) {
return [...list].sort((a, b) =>
a.full_name.localeCompare(b.full_name, 'pt-BR')
)
}

export function IndexPage() {
const [session, setSession] = useState<any>(null)
const [loading, setLoading] = useState(true)
const [appLoading, setAppLoading] = useState(false)

const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [loginError, setLoginError] = useState('')

const [role, setRole] = useState<Role>('aluno')
const [profile, setProfile] = useState<any>(null)

const [darkMode, setDarkMode] = useState(true)
const [activeTab, setActiveTab] = useState<Tab>('dashboard')

const [students, setStudents] = useState<Student[]>([])
const [exercises, setExercises] = useState<Exercise[]>([])
const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([])
const [workouts, setWorkouts] = useState<Workout[]>([])
const [workoutExercises, setWorkoutExercises] = useState<
WorkoutExercise[]

> ([])
const [studentWorkouts, setStudentWorkouts] = useState<
StudentWorkout[]
> ([])
const [payments, setPayments] = useState<Payment[]>([])

const [searchQuery, setSearchQuery] = useState('')

const [modalType, setModalType] = useState<ModalType>(null)
const [selectedStudent, setSelectedStudent] =
useState<Student | null>(null)
const [selectedWorkout, setSelectedWorkout] =
useState<Workout | null>(null)

const [newStudentName, setNewStudentName] = useState('')
const [newStudentEmail, setNewStudentEmail] = useState('')
const [newStudentPhone, setNewStudentPhone] = useState('')
const [newStudentFee, setNewStudentFee] = useState('')
const [newStudentDueDay, setNewStudentDueDay] = useState('5')
const [newStudentType, setNewStudentType] = useState<
'aluno' | 'personal'

> ('aluno')

const [newExName, setNewExName] = useState('')
const [newExGroup, setNewExGroup] = useState('')
const [newExInstructions, setNewExInstructions] = useState('')
const [newExMediaUrl, setNewExMediaUrl] = useState('')
const [newExDifficulty, setNewExDifficulty] =
useState('iniciante')
const [newExEquipment, setNewExEquipment] = useState('')

const [newWorkoutName, setNewWorkoutName] = useState('')
const [newWorkoutFocus, setNewWorkoutFocus] = useState('')
const [newWorkoutDescription, setNewWorkoutDescription] =
useState('')

const [newPaymentStudent, setNewPaymentStudent] = useState('')
const [newPaymentAmount, setNewPaymentAmount] = useState('')
const [newPaymentDueDate, setNewPaymentDueDate] = useState('')
const [newPaymentReferenceMonth, setNewPaymentReferenceMonth] =
useState('')

const [studentProfile, setStudentProfile] =
useState<Student | null>(null)
const [studentTodayWorkout, setStudentTodayWorkout] =
useState<StudentWorkout | null>(null)
const [studentTodayExercises, setStudentTodayExercises] = useState<
WorkoutExercise[]

> ([])
const [studentSession, setStudentSession] = useState<any>(null)
const [completedSets, setCompletedSets] = useState<string[]>([])

useEffect(() => {
let mounted = true

async function initialize() {
  try {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession()

    if (!mounted) return

    setSession(currentSession)

    if (currentSession) {
      await loadApplication(currentSession.user.id)
    }
  } catch (error) {
    console.error('Erro ao inicializar:', error)
  } finally {
    if (mounted) {
      setLoading(false)
    }
  }
}

initialize()

const {
  data: { subscription },
} = supabase.auth.onAuthStateChange(
  async (_event, nextSession) => {
    if (!mounted) return

    setSession(nextSession)

    if (nextSession) {
      await loadApplication(nextSession.user.id)
    } else {
      clearApplicationState()
    }

    setLoading(false)
  }
)

return () => {
  mounted = false
  subscription.unsubscribe()
}

}, [])

function clearApplicationState() {
setProfile(null)
setStudentProfile(null)
setStudentTodayWorkout(null)
setStudentTodayExercises([])
setStudentSession(null)
setCompletedSets([])
setStudents([])
setExercises([])
setMuscleGroups([])
setWorkouts([])
setWorkoutExercises([])
setStudentWorkouts([])
setPayments([])
}

async function loadApplication(userId: string) {
setAppLoading(true)

try {
  const { data: profileData, error: profileError } =
    await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

  if (profileError) {
    console.error('Erro ao carregar profile:', profileError)
  }

  setProfile(profileData)

  const { data: roleData, error: roleError } =
    await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

  if (roleError) {
    console.error('Erro ao carregar role:', roleError)
  }

  const detectedRole: Role = roleData?.role
    ? String(roleData.role)
    : 'aluno'

  setRole(detectedRole)

  if (isAdminRole(detectedRole)) {
    await loadAdminData()
  } else {
    await loadStudentData(userId)
  }
} catch (error) {
  console.error('Erro ao carregar aplicação:', error)
} finally {
  setAppLoading(false)
}

}

async function loadAdminData() {
const [
studentsResult,
exercisesResult,
muscleGroupsResult,
workoutsResult,
workoutExercisesResult,
studentWorkoutsResult,
paymentsResult,
] = await Promise.all([
supabase
.from('students')
.select('*')
.order('full_name', { ascending: true })
.range(0, 9999),

  supabase
    .from('exercises')
    .select('*, muscle_groups(name)')
    .order('name', { ascending: true })
    .range(0, 9999),

  supabase
    .from('muscle_groups')
    .select('*')
    .order('sort_order', { ascending: true })
    .range(0, 9999),

  supabase
    .from('workouts')
    .select('*')
    .order('name', { ascending: true })
    .range(0, 9999),

  supabase
    .from('workout_exercises')
    .select(
      '*, exercise:exercises(*, muscle_groups(name))'
    )
    .order('position', { ascending: true })
    .range(0, 9999),

  supabase
    .from('student_workouts')
    .select('*, workout:workouts(*)')
    .order('position', { ascending: true })
    .range(0, 9999),

  supabase
    .from('payments')
    .select('*, student:students(*)')
    .order('due_date', { ascending: true })
    .range(0, 9999),
])

if (studentsResult.error) {
  console.error(
    'Erro ao carregar alunos:',
    studentsResult.error
  )
}

if (exercisesResult.error) {
  console.error(
    'Erro ao carregar exercícios:',
    exercisesResult.error
  )
}

if (muscleGroupsResult.error) {
  console.error(
    'Erro ao carregar grupos musculares:',
    muscleGroupsResult.error
  )
}

if (workoutsResult.error) {
  console.error(
    'Erro ao carregar treinos:',
    workoutsResult.error
  )
}

if (workoutExercisesResult.error) {
  console.error(
    'Erro ao carregar exercícios dos treinos:',
    workoutExercisesResult.error
  )
}

if (studentWorkoutsResult.error) {
  console.error(
    'Erro ao carregar treinos dos alunos:',
    studentWorkoutsResult.error
  )
}

if (paymentsResult.error) {
  console.error(
    'Erro ao carregar pagamentos:',
    paymentsResult.error
  )
}

const normalizedStudents = sortStudents(
  (studentsResult.data || []).map(normalizeStudent)
)

setStudents(normalizedStudents)

setExercises(
  (exercisesResult.data || []) as Exercise[]
)

setMuscleGroups(
  (muscleGroupsResult.data || []) as MuscleGroup[]
)

setWorkouts(
  (workoutsResult.data || []) as Workout[]
)

setWorkoutExercises(
  (workoutExercisesResult.data ||
    []) as WorkoutExercise[]
)

setStudentWorkouts(
  (studentWorkoutsResult.data ||
    []) as StudentWorkout[]
)

setPayments(
  (paymentsResult.data || []) as Payment[]
)

}

async function loadStudentData(userId: string) {
const { data: studentData, error } = await supabase
.from('students')
.select('*')
.eq('user_id', userId)
.maybeSingle()

if (error) {
  console.error('Erro ao carregar aluno:', error)
}

if (!studentData) {
  setStudentProfile(null)
  setStudentTodayWorkout(null)
  setStudentTodayExercises([])
  setStudentSession(null)
  setCompletedSets([])
  return
}

const student = normalizeStudent(studentData)

setStudentProfile(student)

const { data: assignments, error: assignmentError } =
  await supabase
    .from('student_workouts')
    .select('*, workout:workouts(*)')
    .eq('student_id', student.id)
    .eq('active', true)
    .eq('weekday', getTodayWeekday())
    .order('position', { ascending: true })

if (assignmentError) {
  console.error(
    'Erro ao carregar treino do aluno:',
    assignmentError
  )
}

const todayAssignment =
  (assignments?.[0] as StudentWorkout | undefined) ||
  undefined

setStudentTodayWorkout(todayAssignment || null)

if (!todayAssignment) {
  setStudentTodayExercises([])
  setStudentSession(null)
  setCompletedSets([])
  return
}

const { data: exercisesData, error: exercisesError } =
  await supabase
    .from('workout_exercises')
    .select(
      '*, exercise:exercises(*, muscle_groups(name))'
    )
    .eq('workout_id', todayAssignment.workout_id)
    .order('position', { ascending: true })

if (exercisesError) {
  console.error(
    'Erro ao carregar exercícios do treino:',
    exercisesError
  )
}

setStudentTodayExercises(
  (exercisesData || []) as WorkoutExercise[]
)

const { data: currentSession, error: sessionError } =
  await supabase
    .from('workout_sessions')
    .select('*')
    .eq('student_id', student.id)
    .eq('workout_id', todayAssignment.workout_id)
    .eq('status', 'em_andamento')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

if (sessionError) {
  console.error(
    'Erro ao carregar sessão:',
    sessionError
  )
}

if (currentSession) {
  setStudentSession(currentSession)

  const { data: logs, error: logsError } =
    await supabase
      .from('set_logs')
      .select('*')
      .eq('session_id', currentSession.id)

  if (logsError) {
    console.error(
      'Erro ao carregar séries:',
      logsError
    )
  }

  setCompletedSets(
    (logs || []).map(
      (item: any) =>
        `${item.workout_exercise_id}-${item.set_number}`
    )
  )
} else {
  setStudentSession(null)
  setCompletedSets([])
}

}

async function handleLogin(e: React.FormEvent) {
e.preventDefault()

setLoginError('')
setLoading(true)

const { error } =
  await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

if (error) {
  setLoginError('E-mail ou senha inválidos.')
  setLoading(false)
}

}

async function handleLogout() {
await supabase.auth.signOut()

setSession(null)
clearApplicationState()

}

async function handleSaveStudent(e: React.FormEvent) {
e.preventDefault()

if (!newStudentName.trim()) {
  alert('Informe o nome completo.')
  return
}

if (!session?.user?.id) {
  alert('Sessão administrativa não encontrada.')
  return
}

const dueDay = Math.min(
  31,
  Math.max(1, Number(newStudentDueDay) || 5)
)

setAppLoading(true)

try {
  const payload = {
    full_name: newStudentName.trim(),
    email: newStudentEmail.trim() || null,
    phone: newStudentPhone.trim() || null,
    start_date: new Date().toISOString().slice(0, 10),
    monthly_fee:
      Number(newStudentFee.replace(',', '.')) || 0,
    due_day: dueDay,
    created_by: session.user.id,
    status: 'ativo',
  }

  const { data, error } = await supabase
    .from('students')
    .insert([payload])
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao cadastrar aluno:', error)
    alert(
      `Não foi possível cadastrar o aluno: ${error.message}`
    )
    return
  }

  if (data) {
    const newStudent = normalizeStudent(data)

    setStudents((current) =>
      sortStudents([...current, newStudent])
    )
  }

  console.log(
    'Tipo selecionado para o cadastro:',
    newStudentType
  )

  closeModal()
  resetStudentForm()
} finally {
  setAppLoading(false)
}

}

function resetStudentForm() {
setNewStudentName('')
setNewStudentEmail('')
setNewStudentPhone('')
setNewStudentFee('')
setNewStudentDueDay('5')
setNewStudentType('aluno')
}

async function handleSaveExercise(e: React.FormEvent) {
e.preventDefault()

if (!newExName.trim() || !newExGroup) {
  alert('Informe o nome e o grupo muscular.')
  return
}

setAppLoading(true)

try {
  const { data, error } = await supabase
    .from('exercises')
    .insert([
      {
        name: newExName.trim(),
        muscle_group_id: newExGroup,
        instructions: newExInstructions.trim(),
        media_url: newExMediaUrl.trim() || null,
        media_type: 'image',
        difficulty: newExDifficulty,
        equipment: newExEquipment.trim() || null,
      },
    ])
    .select('*, muscle_groups(name)')
    .single()

  if (error) {
    console.error(error)
    alert(
      `Não foi possível cadastrar o exercício: ${error.message}`
    )
    return
  }

  if (data) {
    setExercises((current) =>
      [...current, data as Exercise].sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR')
      )
    )
  }

  closeModal()

  setNewExName('')
  setNewExGroup('')
  setNewExInstructions('')
  setNewExMediaUrl('')
  setNewExDifficulty('iniciante')
  setNewExEquipment('')
} finally {
  setAppLoading(false)
}

}

async function deleteExercise(exerciseId: string) {
if (!confirm('Deseja realmente excluir este exercício?')) {
return
}

const { error } = await supabase
  .from('exercises')
  .delete()
  .eq('id', exerciseId)

if (error) {
  alert(`Não foi possível excluir: ${error.message}`)
  return
}

setExercises((current) =>
  current.filter((exercise) => exercise.id !== exerciseId)
)

}

async function handleSaveWorkout(e: React.FormEvent) {
e.preventDefault()

if (!newWorkoutName.trim()) {
  alert('Informe o nome da ficha.')
  return
}

if (!session?.user?.id) {
  alert('Sessão administrativa não encontrada.')
  return
}

setAppLoading(true)

try {
  const { data, error } = await supabase
    .from('workouts')
    .insert([
      {
        name: newWorkoutName.trim(),
        focus: newWorkoutFocus.trim() || null,
        description:
          newWorkoutDescription.trim() || null,
        created_by: session.user.id,
      },
    ])
    .select('*')
    .single()

  if (error) {
    console.error(error)
    alert(
      `Não foi possível criar o treino: ${error.message}`
    )
    return
  }

  if (data) {
    setWorkouts((current) =>
      [...current, data as Workout].sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR')
      )
    )
  }

  closeModal()

  setNewWorkoutName('')
  setNewWorkoutFocus('')
  setNewWorkoutDescription('')
} finally {
  setAppLoading(false)
}

}

async function addExerciseToWorkout(
workoutId: string,
exerciseId: string
) {
const alreadyAdded = workoutExercises.some(
(item) =>
item.workout_id === workoutId &&
item.exercise_id === exerciseId
)

if (alreadyAdded) {
  alert('Este exercício já está nesta ficha.')
  return
}

const currentExercises = workoutExercises.filter(
  (item) => item.workout_id === workoutId
)

const nextPosition =
  currentExercises.length > 0
    ? Math.max(
        ...currentExercises.map(
          (item) => Number(item.position) || 0
        )
      ) + 1
    : 1

const { data, error } = await supabase
  .from('workout_exercises')
  .insert([
    {
      workout_id: workoutId,
      exercise_id: exerciseId,
      position: nextPosition,
      sets: 3,
      reps: '12',
      rest_seconds: 60,
    },
  ])
  .select(
    '*, exercise:exercises(*, muscle_groups(name))'
  )
  .single()

if (error) {
  alert(`Não foi possível adicionar: ${error.message}`)
  return
}

if (data) {
  setWorkoutExercises((current) => [
    ...current,
    data as WorkoutExercise,
  ])
}

}

async function removeExerciseFromWorkout(id: string) {
if (!confirm('Remover este exercício da ficha?')) {
return
}

const { error } = await supabase
  .from('workout_exercises')
  .delete()
  .eq('id', id)

if (error) {
  alert(`Não foi possível remover: ${error.message}`)
  return
}

setWorkoutExercises((current) =>
  current.filter((item) => item.id !== id)
)

}

async function assignWorkoutToStudent(
studentId: string,
workoutId: string,
weekday: number
) {
const exists = studentWorkouts.some(
(item) =>
item.student_id === studentId &&
item.weekday === weekday &&
item.active
)

if (exists) {
  alert(
    'Este aluno já possui um treino ativo neste dia da semana.'
  )
  return
}

const existingPositions = studentWorkouts
  .filter((item) => item.student_id === studentId)
  .map((item) => Number(item.position) || 0)

const nextPosition =
  existingPositions.length > 0
    ? Math.max(...existingPositions) + 1
    : 1

const { data, error } = await supabase
  .from('student_workouts')
  .insert([
    {
      student_id: studentId,
      workout_id: workoutId,
      weekday,
      position: nextPosition,
      active: true,
    },
  ])
  .select('*, workout:workouts(*)')
  .single()

if (error) {
  alert(
    `Não foi possível atribuir o treino: ${error.message}`
  )
  return
}

if (data) {
  setStudentWorkouts((current) => [
    ...current,
    data as StudentWorkout,
  ])
}

}

async function handleSavePayment(e: React.FormEvent) {
e.preventDefault()

if (
  !newPaymentStudent ||
  !newPaymentAmount ||
  !newPaymentDueDate
) {
  alert('Preencha aluno, valor e vencimento.')
  return
}

const amount = Number(
  newPaymentAmount.replace(/\./g, '').replace(',', '.')
)

if (!Number.isFinite(amount) || amount <= 0) {
  alert('Informe um valor válido.')
  return
}

const reference =
  newPaymentReferenceMonth ||
  `${newPaymentDueDate.substring(0, 7)}-01`

const { data, error } = await supabase
  .from('payments')
  .insert([
    {
      student_id: newPaymentStudent,
      reference_month: reference,
      amount,
      due_date: newPaymentDueDate,
      status: 'pendente',
    },
  ])
  .select('*, student:students(*)')
  .single()

if (error) {
  alert(
    `Não foi possível registrar a mensalidade: ${error.message}`
  )
  return
}

if (data) {
  setPayments((current) =>
    [...current, data as Payment].sort((a, b) =>
      a.due_date.localeCompare(b.due_date)
    )
  )
}

closeModal()

setNewPaymentStudent('')
setNewPaymentAmount('')
setNewPaymentDueDate('')
setNewPaymentReferenceMonth('')

}

async function markPaymentPaid(payment: Payment) {
const { data, error } = await supabase
.from('payments')
.update({
status: 'pago',
paid_at: new Date().toISOString().slice(0, 10),
})
.eq('id', payment.id)
.select('*, student:students(*)')
.single()

if (error) {
  alert(
    `Não foi possível registrar o pagamento: ${error.message}`
  )
  return
}

setPayments((current) =>
  current.map((item) =>
    item.id === payment.id
      ? (data as Payment)
      : item
  )
)

}

async function startStudentWorkout() {
if (!studentProfile || !studentTodayWorkout) {
return
}

if (studentSession) {
  return
}

const { data, error } = await supabase
  .from('workout_sessions')
  .insert([
    {
      student_id: studentProfile.id,
      workout_id: studentTodayWorkout.workout_id,
      status: 'em_andamento',
    },
  ])
  .select('*')
  .single()

if (error) {
  alert(
    `Não foi possível iniciar o treino: ${error.message}`
  )
  return
}

setStudentSession(data)

}

async function completeSet(
workoutExerciseId: string,
setNumber: number
) {
if (!studentSession) {
await startStudentWorkout()
return
}

const key = `${workoutExerciseId}-${setNumber}`

if (completedSets.includes(key)) {
  return
}

const { error } = await supabase
  .from('set_logs')
  .insert([
    {
      session_id: studentSession.id,
      workout_exercise_id: workoutExerciseId,
      set_number: setNumber,
    },
  ])

if (error) {
  alert(
    `Não foi possível registrar a série: ${error.message}`
  )
  return
}

setCompletedSets((current) =>
  current.includes(key) ? current : [...current, key]
)

}

async function finishStudentWorkout() {
if (!studentSession) {
return
}

const { error } = await supabase
  .from('workout_sessions')
  .update({
    status: 'concluido',
    finished_at: new Date().toISOString(),
  })
  .eq('id', studentSession.id)

if (error) {
  alert(
    `Não foi possível finalizar o treino: ${error.message}`
  )
  return
}

setStudentSession(null)
setCompletedSets([])

if (session?.user?.id) {
  await loadStudentData(session.user.id)
}

}

function openModal(
type: ModalType,
student?: Student,
workout?: Workout
) {
setModalType(type)
setSelectedStudent(student || null)
setSelectedWorkout(workout || null)

if (type === 'payment') {
  setNewPaymentStudent(student?.id || '')
}

}

function closeModal() {
setModalType(null)
setSelectedStudent(null)
setSelectedWorkout(null)
}

const filteredStudents = useMemo(() => {
const query = searchQuery.toLowerCase().trim()

if (!query) {
  return students
}

return students.filter((student) =>
  `${student.full_name} ${student.email || ''} ${
    student.phone || ''
  }`
    .toLowerCase()
    .includes(query)
)

}, [students, searchQuery])

const activeStudents = students.filter(
(student) => student.status === 'ativo'
)

const pendingPayments = payments.filter(
(payment) => payment.status !== 'pago'
)

const receivedPayments = payments.filter(
(payment) => payment.status === 'pago'
)

const totalReceived = receivedPayments.reduce(
(sum, payment) =>
sum + Number(payment.amount || 0),
0
)

const totalPending = pendingPayments.reduce(
(sum, payment) =>
sum + Number(payment.amount || 0),
0
)

const currentWorkoutExercises = selectedWorkout
? workoutExercises
.filter(
(item) =>
item.workout_id === selectedWorkout.id
)
.sort(
(a, b) =>
Number(a.position) - Number(b.position)
)
: []

const studentCurrentPayments = studentProfile
? payments.filter(
(payment) =>
payment.student_id === studentProfile.id
)
: []

const studentPendingPayment =
studentCurrentPayments.find(
(payment) => payment.status !== 'pago'
) || null

if (loading) {
return ( <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center"> <div className="text-center"> <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center mx-auto mb-3 animate-pulse"> <Dumbbell size={22} /> </div>

      <p className="text-xs text-zinc-500">
        Carregando Bender Personal...
      </p>
    </div>
  </div>
)

}

if (!session) {
return ( <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-5"> <div className="w-full max-w-md"> <div className="text-center mb-8"> <div className="w-16 h-16 bg-red-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-red-600/30 mb-4"> <Dumbbell size={32} /> </div>

        <h1 className="text-2xl font-black uppercase">
          BENDER{' '}
          <span className="text-red-600">
            PERSONAL
          </span>
        </h1>

        <p className="text-xs text-zinc-500 mt-2">
          Treinamento inteligente e personalizado
        </p>
      </div>

      <form
        onSubmit={handleLogin}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4"
      >
        <div>
          <h2 className="font-bold text-lg">
            Bem-vindo
          </h2>

          <p className="text-xs text-zinc-500">
            Entre para acessar sua conta.
          </p>
        </div>

        {loginError && (
          <div className="bg-red-950/50 border border-red-900 rounded-xl p-3 text-xs text-red-400">
            {loginError}
          </div>
        )}

        <Field
          label="E-mail"
          value={email}
          onChange={setEmail}
          placeholder="seu@email.com"
          type="email"
          required
        />

        <Field
          label="Senha"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          type="password"
          required
        />

        <button
          type="submit"
          className="w-full bg-red-600 hover:bg-red-700 rounded-xl p-3.5 font-bold text-sm transition"
        >
          Entrar
        </button>
      </form>

      <p className="text-center text-[10px] text-zinc-700 mt-6">
        © Bender Personal
      </p>
    </div>
  </div>
)

}

if (!isAdminRole(role)) {
return ( <StudentApp
     darkMode={darkMode}
     setDarkMode={setDarkMode}
     studentProfile={studentProfile}
     studentTodayWorkout={studentTodayWorkout}
     studentTodayExercises={studentTodayExercises}
     studentSession={studentSession}
     completedSets={completedSets}
     pendingPayment={studentPendingPayment}
     onLogout={handleLogout}
     onStartWorkout={startStudentWorkout}
     onCompleteSet={completeSet}
     onFinishWorkout={finishStudentWorkout}
   />
)
}

return (
<AdminApp
darkMode={darkMode}
setDarkMode={setDarkMode}
activeTab={activeTab}
setActiveTab={setActiveTab}
profile={profile}
session={session}
role={role}
students={students}
exercises={exercises}
muscleGroups={muscleGroups}
workouts={workouts}
workoutExercises={workoutExercises}
studentWorkouts={studentWorkouts}
payments={payments}
filteredStudents={filteredStudents}
searchQuery={searchQuery}
setSearchQuery={setSearchQuery}
activeStudents={activeStudents}
pendingPayments={pendingPayments}
totalReceived={totalReceived}
totalPending={totalPending}
appLoading={appLoading}
modalType={modalType}
selectedStudent={selectedStudent}
selectedWorkout={selectedWorkout}
currentWorkoutExercises={currentWorkoutExercises}
newStudentName={newStudentName}
setNewStudentName={setNewStudentName}
newStudentEmail={newStudentEmail}
setNewStudentEmail={setNewStudentEmail}
newStudentPhone={newStudentPhone}
setNewStudentPhone={setNewStudentPhone}
newStudentFee={newStudentFee}
setNewStudentFee={setNewStudentFee}
newStudentDueDay={newStudentDueDay}
setNewStudentDueDay={setNewStudentDueDay}
newStudentType={newStudentType}
setNewStudentType={setNewStudentType}
newExName={newExName}
setNewExName={setNewExName}
newExGroup={newExGroup}
setNewExGroup={setNewExGroup}
newExInstructions={newExInstructions}
setNewExInstructions={setNewExInstructions}
newExMediaUrl={newExMediaUrl}
setNewExMediaUrl={setNewExMediaUrl}
newExDifficulty={newExDifficulty}
setNewExDifficulty={setNewExDifficulty}
newExEquipment={newExEquipment}
setNewExEquipment={setNewExEquipment}
newWorkoutName={newWorkoutName}
setNewWorkoutName={setNewWorkoutName}
newWorkoutFocus={newWorkoutFocus}
setNewWorkoutFocus={setNewWorkoutFocus}
newWorkoutDescription={newWorkoutDescription}
setNewWorkoutDescription={setNewWorkoutDescription}
newPaymentStudent={newPaymentStudent}
setNewPaymentStudent={setNewPaymentStudent}
newPaymentAmount={newPaymentAmount}
setNewPaymentAmount={setNewPaymentAmount}
newPaymentDueDate={newPaymentDueDate}
setNewPaymentDueDate={setNewPaymentDueDate}
newPaymentReferenceMonth={
newPaymentReferenceMonth
}
setNewPaymentReferenceMonth={
setNewPaymentReferenceMonth
}
openModal={openModal}
closeModal={closeModal}
handleLogout={handleLogout}
handleSaveStudent={handleSaveStudent}
handleSaveExercise={handleSaveExercise}
handleSaveWorkout={handleSaveWorkout}
handleSavePayment={handleSavePayment}
deleteExercise={deleteExercise}
addExerciseToWorkout={addExerciseToWorkout}
removeExerciseFromWorkout={
removeExerciseFromWorkout
}
assignWorkoutToStudent={assignWorkoutToStudent}
markPaymentPaid={markPaymentPaid}
getWeekdayName={getWeekdayName}
/>
)
}

function AdminApp(props: any) {
const {
darkMode,
setDarkMode,
activeTab,
setActiveTab,
profile,
session,
role,
students,
exercises,
muscleGroups,
workouts,
workoutExercises,
studentWorkouts,
payments,
filteredStudents,
searchQuery,
setSearchQuery,
activeStudents,
pendingPayments,
totalReceived,
totalPending,
appLoading,
modalType,
selectedStudent,
selectedWorkout,
currentWorkoutExercises,
newStudentName,
setNewStudentName,
newStudentEmail,
setNewStudentEmail,
newStudentPhone,
setNewStudentPhone,
newStudentFee,
setNewStudentFee,
newStudentDueDay,
setNewStudentDueDay,
newStudentType,
setNewStudentType,
newExName,
setNewExName,
newExGroup,
setNewExGroup,
newExInstructions,
setNewExInstructions,
newExMediaUrl,
setNewExMediaUrl,
newExDifficulty,
setNewExDifficulty,
newExEquipment,
setNewExEquipment,
newWorkoutName,
setNewWorkoutName,
newWorkoutFocus,
setNewWorkoutFocus,
newWorkoutDescription,
setNewWorkoutDescription,
newPaymentStudent,
setNewPaymentStudent,
newPaymentAmount,
setNewPaymentAmount,
newPaymentDueDate,
setNewPaymentDueDate,
newPaymentReferenceMonth,
setNewPaymentReferenceMonth,
openModal,
closeModal,
handleLogout,
handleSaveStudent,
handleSaveExercise,
handleSaveWorkout,
handleSavePayment,
deleteExercise,
addExerciseToWorkout,
removeExerciseFromWorkout,
assignWorkoutToStudent,
markPaymentPaid,
getWeekdayName,
} = props

const displayName =
profile?.full_name ||
session?.user?.email?.split('@')[0] ||
'Administrador'

const firstName = displayName.split(' ')[0]

const bg = darkMode
? 'bg-zinc-950 text-white'
: 'bg-gray-100 text-zinc-900'

const card = darkMode
? 'bg-zinc-900 border-zinc-800'
: 'bg-white border-gray-200'

const menuItems = [
{
id: 'dashboard',
label: 'Dashboard',
icon: Home,
},
{
id: 'students',
label: 'Alunos',
icon: Users,
},
{
id: 'workouts',
label: 'Treinos',
icon: Dumbbell,
},
{
id: 'exercises',
label: 'Exercícios',
icon: Activity,
},
{
id: 'finance',
label: 'Financeiro',
icon: Wallet,
},
{
id: 'settings',
label: 'Configurações',
icon: Settings,
},
]

return (
<div className={`min-h-screen ${bg}`}> <div className="flex min-h-screen">
<aside
className={`hidden lg:flex w-64 border-r flex-col p-4 sticky top-0 h-screen ${
            darkMode
              ? 'border-zinc-800 bg-zinc-950'
              : 'border-gray-200 bg-white'
          }`}
> <div className="flex items-center gap-3 px-2 py-3 mb-6"> <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center"> <Dumbbell size={21} /> </div>

        <div>
          <div className="font-black text-sm">
            BENDER
          </div>

          <div className="text-[9px] font-bold text-red-600 tracking-widest">
            PERSONAL
          </div>
        </div>
      </div>

      <div className="px-2 mb-5">
        <div className="text-[10px] text-zinc-500 uppercase font-bold">
          Administrador
        </div>

        <div className="font-bold mt-1 truncate">
          {displayName}
        </div>

        <div className="text-[10px] text-zinc-500">
          {getRoleLabel(role)}
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${
                active
                  ? 'bg-red-600 text-white'
                  : darkMode
                    ? 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    : 'text-zinc-500 hover:bg-gray-100 hover:text-zinc-900'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-500 hover:bg-red-500/10"
      >
        <LogOut size={18} />
        Sair
      </button>
    </aside>

    <div className="flex-1 min-w-0">
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur ${
          darkMode
            ? 'bg-zinc-950/90 border-zinc-800'
            : 'bg-white/90 border-gray-200'
        }`}
      >
        <div className="px-4 md:px-7 py-4 flex items-center justify-between gap-4">
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center">
              <Dumbbell size={18} />
            </div>

            <span className="font-black text-sm">
              BENDER PERSONAL
            </span>
          </div>

          <div className="hidden lg:block">
            <h1 className="text-xl font-black">
              {activeTab === 'dashboard'
                ? `Oi, ${firstName} 👋`
                : menuItems.find(
                    (item) =>
                      item.id === activeTab
                  )?.label}
            </h1>

            <p className="text-xs text-zinc-500">
              Painel Administrativo
            </p>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() =>
                setDarkMode(!darkMode)
              }
              className={`p-2.5 rounded-xl border ${
                darkMode
                  ? 'bg-zinc-900 border-zinc-800'
                  : 'bg-gray-100 border-gray-200'
              }`}
            >
              {darkMode ? (
                <Sun size={17} />
              ) : (
                <Moon size={17} />
              )}
            </button>

            <button
              className={`p-2.5 rounded-xl border ${
                darkMode
                  ? 'bg-zinc-900 border-zinc-800'
                  : 'bg-gray-100 border-gray-200'
              }`}
            >
              <Bell size={17} />
            </button>
          </div>
        </div>
      </header>

      <div className="lg:hidden overflow-x-auto border-b border-zinc-800">
        <div className="flex gap-1 p-2 min-w-max">
          {menuItems.map((item) => {
            const Icon = item.icon

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs ${
                  activeTab === item.id
                    ? 'bg-red-600 text-white'
                    : 'text-zinc-500'
                }`}
              >
                <Icon size={14} />
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      <main className="p-4 md:p-7 max-w-[1500px] mx-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black">
                Painel Administrativo
              </h2>

              <p className="text-sm text-zinc-500">
                Visão geral do Bender Personal
              </p>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <StatCard
                icon={<Users size={19} />}
                label="Total de Alunos"
                value={students.length}
                card={card}
              />

              <StatCard
                icon={<Check size={19} />}
                label="Alunos Ativos"
                value={activeStudents.length}
                card={card}
              />

              <StatCard
                icon={<Dumbbell size={19} />}
                label="Treinos"
                value={workouts.length}
                card={card}
              />

              <StatCard
                icon={<Activity size={19} />}
                label="Exercícios"
                value={exercises.length}
                card={card}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div
                className={`xl:col-span-2 rounded-2xl border p-5 ${card}`}
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-bold">
                      Resumo financeiro
                    </h3>

                    <p className="text-xs text-zinc-500">
                      Situação das mensalidades cadastradas
                    </p>
                  </div>

                  <CircleDollarSign className="text-red-600" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <MiniMetric
                    label="Recebido"
                    value={formatCurrency(
                      totalReceived
                    )}
                    icon={<Wallet size={16} />}
                  />

                  <MiniMetric
                    label="Pendente"
                    value={formatCurrency(
                      totalPending
                    )}
                    icon={<AlertCircle size={16} />}
                  />

                  <MiniMetric
                    label="Pagamentos pendentes"
                    value={pendingPayments.length}
                    icon={<Calendar size={16} />}
                  />
                </div>
              </div>

              <div
                className={`rounded-2xl border p-5 ${card}`}
              >
                <h3 className="font-bold mb-4">
                  Ações rápidas
                </h3>

                <div className="grid gap-2">
                  <QuickAction
                    icon={<Plus size={17} />}
                    label="Cadastrar aluno"
                    onClick={() =>
                      openModal('student')
                    }
                  />

                  <QuickAction
                    icon={<Dumbbell size={17} />}
                    label="Criar treino"
                    onClick={() =>
                      openModal('workout')
                    }
                  />

                  <QuickAction
                    icon={<Activity size={17} />}
                    label="Adicionar exercício"
                    onClick={() =>
                      openModal('exercise')
                    }
                  />

                  <QuickAction
                    icon={
                      <CircleDollarSign size={17} />
                    }
                    label="Registrar mensalidade"
                    onClick={() =>
                      openModal('payment')
                    }
                  />
                </div>
              </div>
            </div>

            <div
              className={`rounded-2xl border ${card}`}
            >
              <div className="p-5 border-b border-zinc-800">
                <h3 className="font-bold">
                  Alunos recentes
                </h3>
              </div>

              <div className="divide-y divide-zinc-800">
                {students.slice(0, 6).map((student: Student) => (
                  <button
                    key={student.id}
                    onClick={() =>
                      openModal(
                        'studentDetails',
                        student
                      )
                    }
                    className="w-full p-4 flex items-center gap-3 text-left hover:bg-zinc-800/30"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-600/10 text-red-600 flex items-center justify-center font-bold">
                      {student.full_name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">
                        {student.full_name}
                      </div>

                      <div className="text-xs text-zinc-500 truncate">
                        {student.email ||
                          student.phone ||
                          'Sem contato'}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-1 rounded-full ${
                        student.status === 'ativo'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-zinc-500/10 text-zinc-500'
                      }`}
                    >
                      {student.status}
                    </span>

                    <ChevronRight
                      size={16}
                      className="text-zinc-500"
                    />
                  </button>
                ))}

                {students.length === 0 && (
                  <EmptyState text="Nenhum aluno cadastrado." />
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-5">
            <PageHeader
              title="Alunos"
              description="Gerencie seus alunos e todas as informações relacionadas."
              button="Cadastrar aluno"
              onClick={() =>
                openModal('student')
              }
            />

            <div className="relative max-w-lg">
              <Search
                className="absolute left-3 top-3 text-zinc-500"
                size={17}
              />

              <input
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Buscar por nome, e-mail ou telefone..."
                className={`w-full rounded-xl border py-3 pl-10 pr-3 text-sm outline-none ${
                  darkMode
                    ? 'bg-zinc-900 border-zinc-800'
                    : 'bg-white border-gray-200'
                }`}
              />
            </div>

            <div
              className={`rounded-2xl border overflow-hidden ${card}`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-zinc-800">
                    <tr className="text-left text-xs text-zinc-500">
                      <th className="p-4">Aluno</th>
                      <th className="p-4">Contato</th>
                      <th className="p-4">
                        Mensalidade
                      </th>
                      <th className="p-4">
                        Vencimento
                      </th>
                      <th className="p-4">Status</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-zinc-800">
                    {filteredStudents.map(
                      (student: Student) => (
                        <tr key={student.id}>
                          <td className="p-4">
                            <div className="font-bold">
                              {student.full_name}
                            </div>

                            <div className="text-xs text-zinc-500">
                              Início:{' '}
                              {formatDate(
                                student.start_date
                              )}
                            </div>
                          </td>

                          <td className="p-4 text-xs text-zinc-500">
                            <div>
                              {student.email || '-'}
                            </div>
                            <div>
                              {student.phone || '-'}
                            </div>
                          </td>

                          <td className="p-4 font-medium">
                            {formatCurrency(
                              student.monthly_fee
                            )}
                          </td>

                          <td className="p-4">
                            Dia {student.due_day}
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2 py-1 rounded-full text-[10px] ${
                                student.status ===
                                'ativo'
                                  ? 'bg-green-500/10 text-green-500'
                                  : 'bg-zinc-500/10 text-zinc-500'
                              }`}
                            >
                              {student.status}
                            </span>
                          </td>

                          <td className="p-4">
                            <button
                              onClick={() =>
                                openModal(
                                  'studentDetails',
                                  student
                                )
                              }
                              className="p-2 rounded-lg hover:bg-zinc-800"
                            >
                              <ChevronRight
                                size={16}
                              />
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {filteredStudents.length === 0 && (
                <EmptyState text="Nenhum aluno encontrado." />
              )}
            </div>
          </div>
        )}

        {activeTab === 'exercises' && (
          <div className="space-y-5">
            <PageHeader
              title="Biblioteca de exercícios"
              description="Cadastre exercícios com instruções e demonstração animada."
              button="Adicionar exercício"
              onClick={() =>
                openModal('exercise')
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {exercises.map((exercise: Exercise) => (
                <div
                  key={exercise.id}
                  className={`rounded-2xl border overflow-hidden ${card}`}
                >
                  <div className="aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden">
                    {exercise.media_url ? (
                      <img
                        src={exercise.media_url}
                        alt={exercise.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-zinc-600">
                        <Dumbbell
                          size={32}
                          className="mx-auto mb-2"
                        />

                        <span className="text-xs">
                          Sem demonstração
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold">
                          {exercise.name}
                        </h3>

                        <p className="text-xs text-red-600 mt-1">
                          {exercise.muscle_groups
                            ?.name ||
                            'Sem grupo'}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          deleteExercise(
                            exercise.id
                          )
                        }
                        className="p-2 rounded-lg text-zinc-500 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <p className="text-xs text-zinc-500 mt-3 line-clamp-3">
                      {exercise.instructions ||
                        'Sem instruções cadastradas.'}
                    </p>

                    <div className="flex gap-2 mt-4">
                      <span className="text-[10px] px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                        {exercise.difficulty}
                      </span>

                      {exercise.equipment && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                          {exercise.equipment}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {exercises.length === 0 && (
              <EmptyState text="Nenhum exercício cadastrado." />
            )}
          </div>
        )}

        {activeTab === 'workouts' && (
          <div className="space-y-5">
            <PageHeader
              title="Fichas de treino"
              description="Monte fichas, adicione exercícios e depois atribua aos alunos."
              button="Criar treino"
              onClick={() =>
                openModal('workout')
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {workouts.map((workout: Workout) => {
                const count =
                  workoutExercises.filter(
                    (item: WorkoutExercise) =>
                      item.workout_id ===
                      workout.id
                  ).length

                const assigned =
                  studentWorkouts.filter(
                    (item: StudentWorkout) =>
                      item.workout_id ===
                      workout.id
                  ).length

                return (
                  <button
                    key={workout.id}
                    onClick={() =>
                      openModal(
                        'studentDetails',
                        undefined,
                        workout
                      )
                    }
                    className={`text-left rounded-2xl border p-5 hover:border-red-600/50 transition ${card}`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center mb-4">
                      <Dumbbell size={21} />
                    </div>

                    <h3 className="font-bold">
                      {workout.name}
                    </h3>

                    {workout.focus && (
                      <p className="text-xs text-red-600 mt-1">
                        {workout.focus}
                      </p>
                    )}

                    <p className="text-xs text-zinc-500 mt-2 line-clamp-2">
                      {workout.description ||
                        'Sem descrição cadastrada.'}
                    </p>

                    <div className="flex gap-2 mt-4">
                      <span className="text-[10px] px-2 py-1 bg-zinc-800 rounded-full text-zinc-400">
                        {count} exercícios
                      </span>

                      <span className="text-[10px] px-2 py-1 bg-zinc-800 rounded-full text-zinc-400">
                        {assigned} alunos
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {workouts.length === 0 && (
              <EmptyState text="Nenhuma ficha criada." />
            )}
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-5">
            <PageHeader
              title="Financeiro"
              description="Acompanhe mensalidades e pagamentos dos alunos."
              button="Registrar mensalidade"
              onClick={() =>
                openModal('payment')
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <StatCard
                icon={<Wallet size={19} />}
                label="Recebido"
                value={formatCurrency(
                  totalReceived
                )}
                card={card}
              />

              <StatCard
                icon={<AlertCircle size={19} />}
                label="Pendente"
                value={formatCurrency(
                  totalPending
                )}
                card={card}
              />

              <StatCard
                icon={<Users size={19} />}
                label="Pendências"
                value={pendingPayments.length}
                card={card}
              />
            </div>

            <div
              className={`rounded-2xl border overflow-hidden ${card}`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-zinc-800">
                    <tr className="text-left text-xs text-zinc-500">
                      <th className="p-4">Aluno</th>
                      <th className="p-4">
                        Referência
                      </th>
                      <th className="p-4">Valor</th>
                      <th className="p-4">
                        Vencimento
                      </th>
                      <th className="p-4">Status</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-zinc-800">
                    {payments.map((payment: Payment) => (
                      <tr key={payment.id}>
                        <td className="p-4 font-bold">
                          {payment.student
                            ?.full_name || '-'}
                        </td>

                        <td className="p-4 text-xs text-zinc-500">
                          {formatDate(
                            payment.reference_month
                          )}
                        </td>

                        <td className="p-4">
                          {formatCurrency(
                            Number(
                              payment.amount || 0
                            )
                          )}
                        </td>

                        <td className="p-4">
                          {formatDate(
                            payment.due_date
                          )}
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] ${
                              payment.status ===
                              'pago'
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-amber-500/10 text-amber-500'
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>

                        <td className="p-4">
                          {payment.status !==
                            'pago' && (
                            <button
                              onClick={() =>
                                markPaymentPaid(
                                  payment
                                )
                              }
                              className="text-xs bg-green-600/10 text-green-500 px-3 py-2 rounded-lg hover:bg-green-600 hover:text-white"
                            >
                              Marcar pagamento
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {payments.length === 0 && (
                <EmptyState text="Nenhuma mensalidade cadastrada." />
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-5">
            <PageHeader
              title="Configurações"
              description="Informações da conta administrativa."
            />

            <div
              className={`rounded-2xl border p-5 ${card}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-red-600/10 text-red-600 flex items-center justify-center text-xl font-black">
                  {displayName
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <h3 className="font-bold text-lg">
                    {displayName}
                  </h3>

                  <p className="text-sm text-zinc-500">
                    {session?.user?.email}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <ShieldCheck
                      size={14}
                      className="text-red-600"
                    />

                    <span className="text-xs text-red-600 font-bold">
                      {getRoleLabel(role)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`rounded-2xl border p-5 ${card}`}
            >
              <h3 className="font-bold mb-2">
                Ambiente administrativo
              </h3>

              <p className="text-sm text-zinc-500">
                Este ambiente é destinado aos usuários
                com permissão de administrador ou
                personal.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  </div>

  {modalType === 'student' && (
    <Modal
      title="Cadastrar usuário"
      onClose={closeModal}
    >
      <form
        onSubmit={handleSaveStudent}
        className="space-y-4"
      >
        <Field
          label="Nome completo"
          value={newStudentName}
          onChange={setNewStudentName}
          placeholder="Ex.: João Silva"
          required
        />

        <Field
          label="E-mail"
          value={newStudentEmail}
          onChange={setNewStudentEmail}
          placeholder="joao@email.com"
          type="email"
        />

        <Field
          label="Telefone"
          value={newStudentPhone}
          onChange={setNewStudentPhone}
          placeholder="(51) 99999-9999"
        />

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Mensalidade"
            value={newStudentFee}
            onChange={setNewStudentFee}
            placeholder="120,00"
          />

          <Field
            label="Dia do vencimento"
            value={newStudentDueDay}
            onChange={setNewStudentDueDay}
            placeholder="5"
            type="number"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-400 block mb-1.5">
            Tipo de usuário
          </label>

          <select
            value={newStudentType}
            onChange={(event) =>
              setNewStudentType(
                event.target.value as
                  | 'aluno'
                  | 'personal'
              )
            }
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm outline-none"
          >
            <option value="aluno">
              Aluno
            </option>

            <option value="personal">
              Personal
            </option>
          </select>

          <p className="text-[10px] text-zinc-600 mt-1.5">
            Personal terá acesso ao ambiente
            administrativo.
          </p>
        </div>

        <button
          type="submit"
          disabled={appLoading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl p-3 font-bold text-sm"
        >
          {appLoading
            ? 'Cadastrando...'
            : 'Cadastrar'}
        </button>
      </form>
    </Modal>
  )}

  {modalType === 'exercise' && (
    <Modal
      title="Cadastrar exercício"
      onClose={closeModal}
    >
      <form
        onSubmit={handleSaveExercise}
        className="space-y-4"
      >
        <Field
          label="Nome do exercício"
          value={newExName}
          onChange={setNewExName}
          placeholder="Ex.: Supino reto"
          required
        />

        <div>
          <label className="text-xs text-zinc-400 block mb-1.5">
            Grupo muscular
          </label>

          <select
            value={newExGroup}
            onChange={(event) =>
              setNewExGroup(event.target.value)
            }
            required
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm outline-none"
          >
            <option value="">
              Selecione...
            </option>

            {muscleGroups.map((group: MuscleGroup) => (
              <option
                key={group.id}
                value={group.id}
              >
                {group.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">
              Dificuldade
            </label>

            <select
              value={newExDifficulty}
              onChange={(event) =>
                setNewExDifficulty(
                  event.target.value
                )
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm"
            >
              <option value="iniciante">
                Iniciante
              </option>

              <option value="intermediario">
                Intermediário
              </option>

              <option value="avancado">
                Avançado
              </option>
            </select>
          </div>

          <Field
            label="Equipamento"
            value={newExEquipment}
            onChange={setNewExEquipment}
            placeholder="Halter"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-400 block mb-1.5">
            GIF / animação do exercício
          </label>

          <input
            value={newExMediaUrl}
            onChange={(event) =>
              setNewExMediaUrl(
                event.target.value
              )
            }
            placeholder="URL do GIF"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm"
          />

          {newExMediaUrl && (
            <div className="mt-3 aspect-video rounded-xl overflow-hidden bg-zinc-950">
              <img
                src={newExMediaUrl}
                alt="Prévia da animação"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>

        <div>
          <label className="text-xs text-zinc-400 block mb-1.5">
            Como realizar
          </label>

          <textarea
            value={newExInstructions}
            onChange={(event) =>
              setNewExInstructions(
                event.target.value
              )
            }
            rows={5}
            placeholder="Explique de forma simples como executar o movimento..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={appLoading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl p-3 font-bold text-sm"
        >
          {appLoading
            ? 'Salvando...'
            : 'Salvar exercício'}
        </button>
      </form>
    </Modal>
  )}

  {modalType === 'workout' && (
    <Modal
      title="Criar ficha de treino"
      onClose={closeModal}
    >
      <form
        onSubmit={handleSaveWorkout}
        className="space-y-4"
      >
        <Field
          label="Nome da ficha"
          value={newWorkoutName}
          onChange={setNewWorkoutName}
          placeholder="Ex.: Treino A - Hipertrofia"
          required
        />

        <Field
          label="Foco"
          value={newWorkoutFocus}
          onChange={setNewWorkoutFocus}
          placeholder="Peito, ombros e tríceps"
        />

        <div>
          <label className="text-xs text-zinc-400 block mb-1.5">
            Descrição
          </label>

          <textarea
            value={newWorkoutDescription}
            onChange={(event) =>
              setNewWorkoutDescription(
                event.target.value
              )
            }
            rows={4}
            placeholder="Descrição da ficha..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={appLoading}
          className="w-full bg-red-600 disabled:opacity-50 rounded-xl p-3 font-bold text-sm"
        >
          {appLoading
            ? 'Criando...'
            : 'Criar ficha'}
        </button>
      </form>
    </Modal>
  )}

  {modalType === 'payment' && (
    <Modal
      title="Registrar mensalidade"
      onClose={closeModal}
    >
      <form
        onSubmit={handleSavePayment}
        className="space-y-4"
      >
        <div>
          <label className="text-xs text-zinc-400 block mb-1.5">
            Aluno
          </label>

          <select
            value={newPaymentStudent}
            onChange={(event) =>
              setNewPaymentStudent(
                event.target.value
              )
            }
            required
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm"
          >
            <option value="">
              Selecione o aluno...
            </option>

            {students.map((student: Student) => (
              <option
                key={student.id}
                value={student.id}
              >
                {student.full_name}
              </option>
            ))}
          </select>

          <p className="text-[10px] text-zinc-600 mt-1.5">
            {students.length} usuários disponíveis
          </p>
        </div>

        <Field
          label="Valor"
          value={newPaymentAmount}
          onChange={setNewPaymentAmount}
          placeholder="120,00"
          required
        />

        <Field
          label="Vencimento"
          value={newPaymentDueDate}
          onChange={setNewPaymentDueDate}
          type="date"
          required
        />

        <Field
          label="Mês de referência"
          value={newPaymentReferenceMonth}
          onChange={
            setNewPaymentReferenceMonth
          }
          type="date"
        />

        <button
          type="submit"
          className="w-full bg-red-600 rounded-xl p-3 font-bold text-sm"
        >
          Registrar mensalidade
        </button>
      </form>
    </Modal>
  )}

  {modalType === 'studentDetails' &&
    selectedStudent && (
      <Modal
        title={selectedStudent.full_name}
        onClose={closeModal}
      >
        <StudentDetails
          student={selectedStudent}
          payments={payments.filter(
            (payment: Payment) =>
              payment.student_id ===
              selectedStudent.id
          )}
          studentWorkouts={studentWorkouts.filter(
            (item: StudentWorkout) =>
              item.student_id ===
              selectedStudent.id
          )}
          workouts={workouts}
          onAssign={assignWorkoutToStudent}
          getWeekdayName={getWeekdayName}
        />
      </Modal>
    )}

  {modalType === 'studentDetails' &&
    selectedWorkout && (
      <Modal
        title={selectedWorkout.name}
        onClose={closeModal}
      >
        <WorkoutDetails
          workout={selectedWorkout}
          exercises={currentWorkoutExercises}
          allExercises={exercises}
          onAdd={addExerciseToWorkout}
          onRemove={removeExerciseFromWorkout}
        />
      </Modal>
    )}

  {appLoading && (
    <div className="fixed bottom-4 right-4 z-[100] bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs shadow-xl">
      Processando...
    </div>
  )}
</div>

)
}

function StudentApp({
darkMode,
setDarkMode,
studentProfile,
studentTodayWorkout,
studentTodayExercises,
studentSession,
completedSets,
pendingPayment,
onLogout,
onStartWorkout,
onCompleteSet,
onFinishWorkout,
}: any) {
const [tab, setTab] = useState<
'home' | 'workout' | 'history' | 'profile'

> ('home')

const bg = darkMode
? 'bg-zinc-950 text-white'
: 'bg-gray-100 text-zinc-900'

const card = darkMode
? 'bg-zinc-900 border-zinc-800'
: 'bg-white border-gray-200'

const firstName =
studentProfile?.full_name?.split(' ')[0] ||
'Aluno'

const totalSets = studentTodayExercises.reduce(
(
sum: number,
exercise: WorkoutExercise
) =>
sum + Number(exercise.sets || 0),
0
)

const progress =
totalSets > 0
? Math.min(
100,
Math.round(
(completedSets.length /
totalSets) *
100
)
)
: 0

return (
<div className={`min-h-screen ${bg}`}>
<header
className={`sticky top-0 z-40 border-b backdrop-blur ${
          darkMode
            ? 'bg-zinc-950/90 border-zinc-800'
            : 'bg-white/90 border-gray-200'
        }`}
> <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between"> <div className="flex items-center gap-3"> <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center"> <Dumbbell size={20} /> </div>

        <div>
          <div className="text-[9px] text-red-600 font-black tracking-widest">
            BENDER
          </div>

          <div className="font-black text-sm">
            PERSONAL
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() =>
            setDarkMode(!darkMode)
          }
          className="p-2.5 rounded-xl border border-zinc-800"
        >
          {darkMode ? (
            <Sun size={17} />
          ) : (
            <Moon size={17} />
          )}
        </button>

        <button
          onClick={onLogout}
          className="p-2.5 rounded-xl bg-red-600/10 text-red-500"
        >
          <LogOut size={17} />
        </button>
      </div>
    </div>
  </header>

  <main className="max-w-2xl mx-auto px-4 py-5 pb-28">
    {tab === 'home' && (
      <div className="space-y-4">
        <div>
          <p className="text-sm text-zinc-500">
            Bem-vindo de volta
          </p>

          <h1 className="text-3xl font-black mt-1">
            Oi, {firstName} 👋
          </h1>

          <p className="text-sm text-zinc-500 mt-1">
            Vamos treinar hoje?
          </p>
        </div>

        <div
          className={`rounded-2xl border p-4 flex items-center gap-3 ${
            pendingPayment
              ? 'border-amber-500/30 bg-amber-500/10'
              : 'border-green-500/30 bg-green-500/10'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              pendingPayment
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-green-500/10 text-green-500'
            }`}
          >
            {pendingPayment ? (
              <AlertCircle size={19} />
            ) : (
              <Check size={19} />
            )}
          </div>

          <div className="flex-1">
            <div className="text-[10px] uppercase font-bold text-zinc-500">
              Mensalidade
            </div>

            <div className="font-bold text-sm">
              {pendingPayment
                ? 'Existe uma mensalidade pendente'
                : 'Em dia'}
            </div>

            {pendingPayment && (
              <div className="text-xs text-amber-500">
                Vencimento:{' '}
                {formatDate(
                  pendingPayment.due_date
                )}
              </div>
            )}
          </div>
        </div>

        <div
          className={`rounded-2xl border p-5 ${card}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase text-red-600 font-bold">
                Treino de hoje
              </div>

              <h2 className="text-xl font-black mt-1">
                {studentTodayWorkout?.workout
                  ?.name ||
                  'Dia de descanso'}
              </h2>
            </div>

            <Dumbbell className="text-red-600" />
          </div>

          {studentTodayWorkout ? (
            <>
              <p className="text-xs text-zinc-500 mb-4">
                {studentTodayWorkout.workout
                  ?.focus ||
                  studentTodayWorkout.workout
                    ?.description ||
                  'Treino programado para hoje.'}
              </p>

              <button
                onClick={() => {
                  onStartWorkout()
                  setTab('workout')
                }}
                className="w-full bg-red-600 hover:bg-red-700 rounded-xl p-3.5 font-bold text-sm"
              >
                {studentSession
                  ? 'Continuar treino'
                  : 'Iniciar treino'}
              </button>
            </>
          ) : (
            <div className="py-8 text-center">
              <Calendar
                size={30}
                className="mx-auto text-zinc-700 mb-3"
              />

              <p className="font-bold">
                Descanso hoje
              </p>

              <p className="text-xs text-zinc-500 mt-1">
                Nenhum treino foi programado para
                hoje.
              </p>
            </div>
          )}
        </div>

        {studentTodayWorkout && (
          <div
            className={`rounded-2xl border p-5 ${card}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-500">
                  Progresso de hoje
                </div>

                <div className="text-2xl font-black mt-1">
                  {progress}%
                </div>
              </div>

              <div className="w-14 h-14 rounded-full border-4 border-red-600/20 flex items-center justify-center">
                <Trophy
                  size={20}
                  className="text-red-600"
                />
              </div>
            </div>

            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mt-4">
              <div
                className="h-full bg-red-600 transition-all"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <p className="text-xs text-zinc-500 mt-2">
              {completedSets.length} de{' '}
              {totalSets} séries concluídas
            </p>
          </div>
        )}
      </div>
    )}

    {tab === 'workout' && (
      <div className="space-y-4">
        <div>
          <div className="text-xs text-red-600 font-bold uppercase">
            Treino de hoje
          </div>

          <h1 className="text-2xl font-black mt-1">
            {studentTodayWorkout?.workout
              ?.name || 'Treino'}
          </h1>
        </div>

        {studentTodayExercises.map(
          (item: WorkoutExercise) => {
            const exercise = item.exercise

            return (
              <div
                key={item.id}
                className={`rounded-2xl border overflow-hidden ${card}`}
              >
                {exercise?.media_url && (
                  <div className="aspect-video bg-zinc-950 flex items-center justify-center">
                    <img
                      src={exercise.media_url}
                      alt={exercise.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-black text-lg">
                        {exercise?.name}
                      </h2>

                      <div className="text-xs text-red-600 mt-1">
                        {exercise
                          ?.muscle_groups
                          ?.name}
                      </div>
                    </div>

                    <span className="text-xs text-zinc-500">
                      {item.sets} × {item.reps}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {Array.from({
                      length: Number(
                        item.sets || 0
                      ),
                    }).map((_, index) => {
                      const setNumber =
                        index + 1

                      const completed =
                        completedSets.includes(
                          `${item.id}-${setNumber}`
                        )

                      return (
                        <button
                          key={setNumber}
                          onClick={() =>
                            onCompleteSet(
                              item.id,
                              setNumber
                            )
                          }
                          className={`p-3 rounded-xl border text-xs font-bold ${
                            completed
                              ? 'bg-green-600 text-white border-green-600'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          {completed ? (
                            <Check
                              size={15}
                              className="inline mr-1"
                            />
                          ) : (
                            `Série ${setNumber} · `
                          )}

                          {completed
                            ? 'Concluída'
                            : item.reps}
                        </button>
                      )
                    })}
                  </div>

                  <div className="text-xs text-zinc-500 mt-4">
                    Descanso:{' '}
                    {item.rest_seconds}s
                  </div>

                  {exercise?.instructions && (
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <div className="text-[10px] uppercase text-zinc-500 font-bold mb-2">
                        Como realizar
                      </div>

                      <p className="text-xs leading-5 text-zinc-400 whitespace-pre-line">
                        {exercise.instructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          }
        )}

        {studentTodayExercises.length > 0 && (
          <button
            onClick={onFinishWorkout}
            className="w-full bg-green-600 hover:bg-green-700 rounded-xl p-3.5 font-bold"
          >
            Finalizar treino
          </button>
        )}
      </div>
    )}

    {tab === 'history' && (
      <div className="space-y-4">
        <h1 className="text-2xl font-black">
          Histórico
        </h1>

        <div
          className={`rounded-2xl border p-5 ${card}`}
        >
          <Activity
            size={30}
            className="text-red-600 mb-3"
          />

          <h2 className="font-bold">
            Seu histórico de treinos
          </h2>

          <p className="text-xs text-zinc-500 mt-2">
            Aqui ficará o histórico completo das
            sessões realizadas.
          </p>
        </div>
      </div>
    )}

    {tab === 'profile' && (
      <div className="space-y-4">
        <h1 className="text-2xl font-black">
          Meu perfil
        </h1>

        <div
          className={`rounded-2xl border p-5 ${card}`}
        >
          <div className="w-16 h-16 rounded-full bg-red-600/10 text-red-600 flex items-center justify-center text-xl font-black mb-4">
            {studentProfile?.full_name
              ?.charAt(0)
              .toUpperCase()}
          </div>

          <h2 className="text-xl font-black">
            {studentProfile?.full_name}
          </h2>

          <p className="text-sm text-zinc-500 mt-1">
            {studentProfile?.email ||
              'Sem e-mail'}
          </p>

          <p className="text-sm text-zinc-500">
            {studentProfile?.phone ||
              'Sem telefone'}
          </p>

          <div className="mt-5 pt-5 border-t border-zinc-800">
            <div className="text-[10px] uppercase text-zinc-500 font-bold">
              Mensalidade
            </div>

            <div className="text-xl font-black mt-1">
              {formatCurrency(
                Number(
                  studentProfile?.monthly_fee ||
                    0
                )
              )}
            </div>
          </div>
        </div>
      </div>
    )}
  </main>

  <nav
    className={`fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur ${
      darkMode
        ? 'bg-zinc-950/95 border-zinc-800'
        : 'bg-white/95 border-gray-200'
    }`}
  >
    <div className="max-w-2xl mx-auto grid grid-cols-4 p-2">
      <StudentNavButton
        active={tab === 'home'}
        icon={<Home size={18} />}
        label="Início"
        onClick={() => setTab('home')}
      />

      <StudentNavButton
        active={tab === 'workout'}
        icon={<Dumbbell size={18} />}
        label="Treino"
        onClick={() => setTab('workout')}
      />

      <StudentNavButton
        active={tab === 'history'}
        icon={<Trophy size={18} />}
        label="Histórico"
        onClick={() => setTab('history')}
      />

      <StudentNavButton
        active={tab === 'profile'}
        icon={<User size={18} />}
        label="Perfil"
        onClick={() => setTab('profile')}
      />
    </div>
  </nav>
</div>

)
}

function StatCard({
icon,
label,
value,
card,
}: {
icon: React.ReactNode
label: string
value: React.ReactNode
card: string
}) {
return (
<div className={`rounded-2xl border p-4 ${card}`}> <div className="w-9 h-9 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center mb-3">
{icon} </div>

  <div className="text-2xl font-black">
    {value}
  </div>

  <div className="text-xs text-zinc-500 mt-1">
    {label}
  </div>
</div>

)
}

function MiniMetric({
label,
value,
icon,
}: {
label: string
value: React.ReactNode
icon: React.ReactNode
}) {
return ( <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800"> <div className="flex items-center gap-2 text-zinc-500">
{icon}

    <span className="text-xs">
      {label}
    </span>
  </div>

  <div className="font-black text-lg mt-2">
    {value}
  </div>
</div>

)
}

function QuickAction({
icon,
label,
onClick,
}: {
icon: React.ReactNode
label: string
onClick: () => void
}) {
return ( <button
   onClick={onClick}
   className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-red-600/50 text-left"
 > <span className="text-red-600">
{icon} </span>

  <span className="text-xs font-bold">
    {label}
  </span>

  <ChevronRight
    size={15}
    className="ml-auto text-zinc-600"
  />
</button>

)
}

function PageHeader({
title,
description,
button,
onClick,
}: {
title: string
description: string
button?: string
onClick?: () => void
}) {
return ( <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"> <div> <h1 className="text-2xl font-black">
{title} </h1>

    <p className="text-sm text-zinc-500 mt-1">
      {description}
    </p>
  </div>

  {button && onClick && (
    <button
      onClick={onClick}
      className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
    >
      <Plus size={17} />
      {button}
    </button>
  )}
</div>

)
}

function EmptyState({
text,
}: {
text: string
}) {
return ( <div className="p-10 text-center text-sm text-zinc-500">
{text} </div>
)
}

function Field({
label,
value,
onChange,
placeholder,
type = 'text',
required = false,
}: {
label: string
value: string
onChange: (value: string) => void
placeholder?: string
type?: string
required?: boolean
}) {
return ( <div> <label className="text-xs text-zinc-400 block mb-1.5">
{label} </label>

  <input
    type={type}
    required={required}
    value={value}
    onChange={(event) =>
      onChange(event.target.value)
    }
    placeholder={placeholder}
    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm outline-none focus:border-red-600"
  />
</div>

)
}

function Modal({
title,
onClose,
children,
}: {
title: string
onClose: () => void
children: React.ReactNode
}) {
return ( <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"> <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-3xl"> <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-5 py-4 flex items-center justify-between"> <h2 className="font-black">
{title} </h2>

      <button
        onClick={onClose}
        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
      >
        <X size={18} />
      </button>
    </div>

    <div className="p-5">
      {children}
    </div>
  </div>
</div>

)
}

function StudentDetails({
student,
payments,
studentWorkouts,
workouts,
onAssign,
getWeekdayName,
}: any) {
const [workoutId, setWorkoutId] =
useState('')

const [weekday, setWeekday] =
useState('1')

return ( <div className="space-y-5"> <div className="flex items-center gap-3"> <div className="w-14 h-14 rounded-full bg-red-600/10 text-red-600 flex items-center justify-center text-xl font-black">
{student.full_name
.charAt(0)
.toUpperCase()} </div>

    <div>
      <h3 className="font-black text-lg">
        {student.full_name}
      </h3>

      <p className="text-xs text-zinc-500">
        {student.email ||
          'Sem e-mail'}
      </p>

      <span className="text-[10px] text-green-500">
        {student.status}
      </span>
    </div>
  </div>

  <div className="grid grid-cols-2 gap-3">
    <InfoBox
      label="Mensalidade"
      value={formatCurrency(
        Number(
          student.monthly_fee || 0
        )
      )}
    />

    <InfoBox
      label="Vencimento"
      value={`Dia ${student.due_day}`}
    />

    <InfoBox
      label="Telefone"
      value={student.phone || '-'}
    />

    <InfoBox
      label="Início"
      value={formatDate(
        student.start_date
      )}
    />
  </div>

  <div>
    <h3 className="font-bold mb-3">
      Treinos atribuídos
    </h3>

    <div className="space-y-2">
      {studentWorkouts.map(
        (item: StudentWorkout) => (
          <div
            key={item.id}
            className="p-3 rounded-xl bg-zinc-950 border border-zinc-800"
          >
            <div className="font-bold text-sm">
              {item.workout?.name}
            </div>

            <div className="text-xs text-zinc-500 mt-1">
              {getWeekdayName(
                item.weekday
              )}
            </div>
          </div>
        )
      )}

      {studentWorkouts.length === 0 && (
        <p className="text-xs text-zinc-500">
          Nenhum treino atribuído.
        </p>
      )}
    </div>
  </div>

  <div className="border-t border-zinc-800 pt-5">
    <h3 className="font-bold mb-3">
      Atribuir treino
    </h3>

    <div className="grid grid-cols-2 gap-2">
      <select
        value={workoutId}
        onChange={(event) =>
          setWorkoutId(
            event.target.value
          )
        }
        className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs"
      >
        <option value="">
          Treino...
        </option>

        {workouts.map(
          (workout: Workout) => (
            <option
              key={workout.id}
              value={workout.id}
            >
              {workout.name}
            </option>
          )
        )}
      </select>

      <select
        value={weekday}
        onChange={(event) =>
          setWeekday(
            event.target.value
          )
        }
        className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs"
      >
        <option value="1">
          Segunda
        </option>
        <option value="2">
          Terça
        </option>
        <option value="3">
          Quarta
        </option>
        <option value="4">
          Quinta
        </option>
        <option value="5">
          Sexta
        </option>
        <option value="6">
          Sábado
        </option>
        <option value="7">
          Domingo
        </option>
      </select>
    </div>

    <button
      disabled={!workoutId}
      onClick={async () => {
        if (!workoutId) return

        await onAssign(
          student.id,
          workoutId,
          Number(weekday)
        )

        setWorkoutId('')
      }}
      className="w-full mt-2 bg-red-600 disabled:opacity-40 rounded-xl p-3 text-xs font-bold"
    >
      Atribuir treino
    </button>
  </div>

  <div className="border-t border-zinc-800 pt-5">
    <h3 className="font-bold mb-3">
      Financeiro
    </h3>

    <div className="space-y-2">
      {payments.map(
        (payment: Payment) => (
          <div
            key={payment.id}
            className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between"
          >
            <div>
              <div className="font-bold text-xs">
                {formatDate(
                  payment.reference_month
                )}
              </div>

              <div className="text-[10px] text-zinc-500">
                Vencimento:{' '}
                {formatDate(
                  payment.due_date
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="font-bold text-xs">
                {formatCurrency(
                  Number(
                    payment.amount || 0
                  )
                )}
              </div>

              <div
                className={`text-[10px] ${
                  payment.status ===
                  'pago'
                    ? 'text-green-500'
                    : 'text-amber-500'
                }`}
              >
                {payment.status}
              </div>
            </div>
          </div>
        )
      )}

      {payments.length === 0 && (
        <p className="text-xs text-zinc-500">
          Nenhum registro financeiro.
        </p>
      )}
    </div>
  </div>
</div>

)
}

function WorkoutDetails({
workout,
exercises,
allExercises,
onAdd,
onRemove,
}: any) {
const [exerciseId, setExerciseId] =
useState('')

const availableExercises =
allExercises.filter(
(exercise: Exercise) =>
!exercises.some(
(item: WorkoutExercise) =>
item.exercise_id ===
exercise.id
)
)

return ( <div className="space-y-5"> <div> <h3 className="text-xl font-black">
{workout.name} </h3>

    {workout.focus && (
      <p className="text-xs text-red-600 mt-1">
        {workout.focus}
      </p>
    )}

    <p className="text-xs text-zinc-500 mt-2">
      {workout.description ||
        'Sem descrição.'}
    </p>
  </div>

  <div>
    <h3 className="font-bold mb-3">
      Exercícios da ficha
    </h3>

    <div className="space-y-2">
      {exercises.map(
        (
          item: WorkoutExercise,
          index: number
        ) => (
          <div
            key={item.id}
            className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-3"
          >
            <span className="text-xs text-zinc-600 font-bold">
              {index + 1}
            </span>

            <div className="flex-1">
              <div className="font-bold text-sm">
                {item.exercise?.name}
              </div>

              <div className="text-[10px] text-zinc-500">
                {item.sets} × {item.reps}{' '}
                · {item.rest_seconds}s
              </div>
            </div>

            <button
              onClick={() =>
                onRemove(item.id)
              }
              className="p-2 text-zinc-500 hover:text-red-500"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )
      )}

      {exercises.length === 0 && (
        <p className="text-xs text-zinc-500">
          Nenhum exercício adicionado.
        </p>
      )}
    </div>
  </div>

  <div className="border-t border-zinc-800 pt-5">
    <h3 className="font-bold mb-3">
      Adicionar exercício
    </h3>

    <div className="flex gap-2">
      <select
        value={exerciseId}
        onChange={(event) =>
          setExerciseId(
            event.target.value
          )
        }
        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs"
      >
        <option value="">
          Selecione...
        </option>

        {availableExercises.map(
          (exercise: Exercise) => (
            <option
              key={exercise.id}
              value={exercise.id}
            >
              {exercise.name}
            </option>
          )
        )}
      </select>

      <button
        disabled={!exerciseId}
        onClick={async () => {
          if (!exerciseId) return

          await onAdd(
            workout.id,
            exerciseId
          )

          setExerciseId('')
        }}
        className="bg-red-600 disabled:opacity-40 rounded-xl px-4"
      >
        <Plus size={17} />
      </button>
    </div>

    {availableExercises.length === 0 && (
      <p className="text-[10px] text-zinc-600 mt-2">
        Todos os exercícios cadastrados já
        estão nesta ficha.
      </p>
    )}
  </div>
</div>

)
}

function InfoBox({
label,
value,
}: {
label: string
value: string
}) {
return ( <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3"> <div className="text-[10px] uppercase text-zinc-600 font-bold">
{label} </div>

  <div className="text-xs font-bold mt-1">
    {value}
  </div>
</div>

)
}

function StudentNavButton({
active,
icon,
label,
onClick,
}: {
active: boolean
icon: React.ReactNode
label: string
onClick: () => void
}) {
return (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold ${
      active
        ? 'text-red-600'
        : 'text-zinc-500'
    }`}
  >
    {icon}
    {label}
  </button>
)
}
