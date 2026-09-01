-- ENUMS
CREATE TYPE public.app_role AS ENUM ('super_admin','personal','aluno');
CREATE TYPE public.student_status AS ENUM ('ativo','inativo','pausado');
CREATE TYPE public.payment_status AS ENUM ('pendente','pago','atrasado');
CREATE TYPE public.media_type AS ENUM ('image','gif','lottie');

-- UPDATED_AT HELPER
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  must_change_password boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','personal')
  );
$$;

CREATE POLICY "profiles_select_own_or_staff" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles_insert_own_or_staff" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles_update_own_or_staff" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "user_roles_select_own_or_staff" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- STUDENTS
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  full_name text NOT NULL,
  email text,
  phone text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  status public.student_status NOT NULL DEFAULT 'ativo',
  monthly_fee numeric(10,2) NOT NULL DEFAULT 0,
  due_day integer NOT NULL DEFAULT 5,
  grace_days integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_select" ON public.students FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "students_staff_write" ON public.students FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PAYMENTS
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  reference_month date NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  paid_at date,
  status public.payment_status NOT NULL DEFAULT 'pendente',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, reference_month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select" ON public.payments FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = payments.student_id AND s.user_id = auth.uid())
  );
CREATE POLICY "payments_staff_write" ON public.payments FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- MUSCLE GROUPS
CREATE TABLE public.muscle_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.muscle_groups TO authenticated;
GRANT ALL ON public.muscle_groups TO service_role;
ALTER TABLE public.muscle_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "muscle_groups_select" ON public.muscle_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "muscle_groups_staff_write" ON public.muscle_groups FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER muscle_groups_updated_at BEFORE UPDATE ON public.muscle_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- EXERCISES
CREATE TABLE public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  muscle_group_id uuid NOT NULL REFERENCES public.muscle_groups(id) ON DELETE RESTRICT,
  name text NOT NULL,
  instructions text NOT NULL DEFAULT '',
  media_url text,
  media_type public.media_type NOT NULL DEFAULT 'image',
  difficulty text NOT NULL DEFAULT 'iniciante',
  equipment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated;
GRANT ALL ON public.exercises TO service_role;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER exercises_updated_at BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- WORKOUTS
CREATE TABLE public.workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  focus text,
  description text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts TO authenticated;
GRANT ALL ON public.workouts TO service_role;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER workouts_updated_at BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- WORKOUT EXERCISES
CREATE TABLE public.workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  position integer NOT NULL DEFAULT 1,
  sets integer NOT NULL DEFAULT 3,
  reps text NOT NULL DEFAULT '12',
  rest_seconds integer NOT NULL DEFAULT 60,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_exercises TO authenticated;
GRANT ALL ON public.workout_exercises TO service_role;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER workout_exercises_updated_at BEFORE UPDATE ON public.workout_exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- STUDENT WORKOUTS
CREATE TABLE public.student_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  weekday integer,
  position integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, workout_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_workouts TO authenticated;
GRANT ALL ON public.student_workouts TO service_role;
ALTER TABLE public.student_workouts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER student_workouts_updated_at BEFORE UPDATE ON public.student_workouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ACCESS HELPER: workout assigned to current user
CREATE OR REPLACE FUNCTION public.user_has_workout(_user_id uuid, _workout_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_workouts sw
    JOIN public.students s ON s.id = sw.student_id
    WHERE sw.workout_id = _workout_id AND sw.active AND s.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_exercise(_user_id uuid, _exercise_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workout_exercises we
    JOIN public.student_workouts sw ON sw.workout_id = we.workout_id AND sw.active
    JOIN public.students s ON s.id = sw.student_id
    WHERE we.exercise_id = _exercise_id AND s.user_id = _user_id
  );
$$;

CREATE POLICY "workouts_select" ON public.workouts FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR public.user_has_workout(auth.uid(), id));
CREATE POLICY "workouts_staff_write" ON public.workouts FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "workout_exercises_select" ON public.workout_exercises FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR public.user_has_workout(auth.uid(), workout_id));
CREATE POLICY "workout_exercises_staff_write" ON public.workout_exercises FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "exercises_select" ON public.exercises FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR public.user_has_exercise(auth.uid(), id));
CREATE POLICY "exercises_staff_write" ON public.exercises FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "student_workouts_select" ON public.student_workouts FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_workouts.student_id AND s.user_id = auth.uid())
  );
CREATE POLICY "student_workouts_staff_write" ON public.student_workouts FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- NEW USER PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, must_change_password)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, false)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SEED: MUSCLE GROUPS
INSERT INTO public.muscle_groups (slug, name, sort_order) VALUES
  ('peitoral','Peitoral',1),
  ('costas','Costas',2),
  ('pernas','Pernas',3),
  ('ombro','Ombro',4),
  ('biceps','Bíceps',5),
  ('triceps','Tríceps',6),
  ('abdomen','Abdômen',7),
  ('gluteo','Glúteo',8),
  ('cardio','Cardio',9);

-- SEED: EXERCISES
INSERT INTO public.exercises (muscle_group_id, name, instructions, difficulty, equipment)
SELECT mg.id, e.name, e.instructions, e.difficulty, e.equipment
FROM (VALUES
  ('peitoral','Supino reto com barra','Deite no banco, desça a barra até a linha do peito e empurre estendendo os cotovelos sem travar.','intermediario','Barra'),
  ('peitoral','Supino inclinado com halteres','Banco a 30-45°. Desça os halteres ao lado do peito e empurre para cima juntando levemente.','intermediario','Halteres'),
  ('peitoral','Crucifixo na máquina','Cotovelos levemente flexionados, feche os braços à frente do peito e volte controlando.','iniciante','Máquina'),
  ('peitoral','Flexão de braço','Corpo alinhado, desça até o peito perto do chão e empurre sem arquear a lombar.','iniciante','Peso do corpo'),
  ('costas','Puxada frontal na polia','Puxe a barra até a altura do queixo aproximando as escápulas, volte controlando.','iniciante','Polia'),
  ('costas','Remada curvada com barra','Tronco inclinado, costas retas, puxe a barra até o abdômen e desça devagar.','intermediario','Barra'),
  ('costas','Remada baixa sentado','Puxe o triângulo até o abdômen mantendo o tronco firme e os ombros para trás.','iniciante','Polia'),
  ('costas','Barra fixa','Pegada pronada, puxe até o queixo passar da barra e desça com controle.','avancado','Barra fixa'),
  ('costas','Pulldown com corda','Braços estendidos, puxe a corda até as coxas contraindo as costas.','iniciante','Polia'),
  ('pernas','Agachamento livre','Pés na largura dos ombros, desça até as coxas paralelas ao chão mantendo o peito aberto.','intermediario','Barra'),
  ('pernas','Leg press 45°','Pés na plataforma, desça até 90° nos joelhos e empurre sem travar os joelhos.','iniciante','Máquina'),
  ('pernas','Cadeira extensora','Estenda os joelhos até quase a extensão total e volte controlando o peso.','iniciante','Máquina'),
  ('pernas','Mesa flexora','Deitado, flexione os joelhos trazendo o calcanhar em direção ao glúteo.','iniciante','Máquina'),
  ('pernas','Afundo com halteres','Passo à frente, desça o joelho de trás em direção ao chão e retorne.','intermediario','Halteres'),
  ('pernas','Stiff com barra','Joelhos semi-flexionados, desça a barra rente às pernas sentindo o posterior.','intermediario','Barra'),
  ('pernas','Panturrilha em pé','Suba na ponta dos pés ao máximo e desça alongando a panturrilha.','iniciante','Máquina'),
  ('ombro','Desenvolvimento com halteres','Sentado, empurre os halteres acima da cabeça sem arquear a lombar.','intermediario','Halteres'),
  ('ombro','Elevação lateral','Suba os braços até a linha dos ombros com cotovelos levemente flexionados.','iniciante','Halteres'),
  ('ombro','Elevação frontal','Suba o halter à frente até a altura dos ombros, sem balançar o tronco.','iniciante','Halteres'),
  ('ombro','Crucifixo inverso','Tronco inclinado, abra os braços para trás contraindo o ombro posterior.','iniciante','Halteres'),
  ('ombro','Remada alta','Puxe a barra rente ao corpo até a altura do peito com cotovelos altos.','intermediario','Barra'),
  ('biceps','Rosca direta com barra','Cotovelos junto ao corpo, suba a barra contraindo o bíceps e desça devagar.','iniciante','Barra'),
  ('biceps','Rosca alternada com halteres','Suba um halter por vez girando o punho no fim do movimento.','iniciante','Halteres'),
  ('biceps','Rosca martelo','Pegada neutra, suba os halteres sem girar o punho.','iniciante','Halteres'),
  ('biceps','Rosca scott','Braços apoiados no banco, suba controlando e desça sem estender bruscamente.','intermediario','Banco scott'),
  ('triceps','Tríceps na polia com barra','Cotovelos fixos ao lado do corpo, estenda os braços até embaixo.','iniciante','Polia'),
  ('triceps','Tríceps corda','Estenda os braços abrindo a corda no final do movimento.','iniciante','Polia'),
  ('triceps','Tríceps testa','Deitado, flexione os cotovelos levando a barra até a testa e estenda.','intermediario','Barra W'),
  ('triceps','Mergulho no banco','Mãos no banco atrás do corpo, desça flexionando os cotovelos e suba.','iniciante','Banco'),
  ('abdomen','Abdominal supra','Deitado, suba o tronco contraindo o abdômen sem puxar o pescoço.','iniciante','Peso do corpo'),
  ('abdomen','Prancha isométrica','Apoie antebraços e pontas dos pés mantendo o corpo alinhado.','iniciante','Peso do corpo'),
  ('abdomen','Elevação de pernas','Deitado, suba as pernas estendidas até 90° e desça sem tocar o chão.','intermediario','Peso do corpo'),
  ('abdomen','Prancha lateral','De lado, apoie um antebraço e mantenha o quadril elevado e alinhado.','intermediario','Peso do corpo'),
  ('gluteo','Elevação pélvica','Costas apoiadas no banco, suba o quadril contraindo o glúteo no topo.','intermediario','Barra'),
  ('gluteo','Glúteo no cabo','Estenda a perna para trás mantendo o tronco firme.','iniciante','Polia'),
  ('gluteo','Agachamento sumô','Pés afastados e pontas para fora, desça mantendo os joelhos alinhados.','iniciante','Halter'),
  ('gluteo','Abdução na máquina','Sentado, abra as pernas contra a resistência e volte controlando.','iniciante','Máquina'),
  ('cardio','Esteira','Caminhada ou corrida em ritmo constante conforme orientação do treino.','iniciante','Esteira'),
  ('cardio','Bicicleta ergométrica','Pedale em ritmo constante mantendo a postura ereta.','iniciante','Bicicleta'),
  ('cardio','Elíptico','Movimento contínuo coordenando braços e pernas.','iniciante','Elíptico'),
  ('cardio','Pular corda','Saltos curtos na ponta dos pés, em séries de tempo.','intermediario','Corda')
) AS e(group_slug, name, instructions, difficulty, equipment)
JOIN public.muscle_groups mg ON mg.slug = e.group_slug;

-- SEED: WORKOUTS A-E
INSERT INTO public.workouts (name, focus, description) VALUES
  ('Treino A','Peitoral e Tríceps','Empurrar: peito e tríceps.'),
  ('Treino B','Costas e Bíceps','Puxar: costas e bíceps.'),
  ('Treino C','Pernas e Glúteo','Membros inferiores completo.'),
  ('Treino D','Ombro e Abdômen','Ombros e core.'),
  ('Treino E','Cardio e Core','Condicionamento e abdômen.');

INSERT INTO public.workout_exercises (workout_id, exercise_id, position, sets, reps, rest_seconds)
SELECT w.id, ex.id, d.position, d.sets, d.reps, d.rest
FROM (VALUES
  ('Treino A','Supino reto com barra',1,4,'10',90),
  ('Treino A','Supino inclinado com halteres',2,3,'12',60),
  ('Treino A','Crucifixo na máquina',3,3,'12',60),
  ('Treino A','Tríceps na polia com barra',4,3,'12',60),
  ('Treino A','Tríceps corda',5,3,'15',45),
  ('Treino B','Puxada frontal na polia',1,4,'10',90),
  ('Treino B','Remada curvada com barra',2,3,'10',90),
  ('Treino B','Remada baixa sentado',3,3,'12',60),
  ('Treino B','Rosca direta com barra',4,3,'12',60),
  ('Treino B','Rosca martelo',5,3,'12',45),
  ('Treino C','Agachamento livre',1,4,'10',120),
  ('Treino C','Leg press 45°',2,4,'12',90),
  ('Treino C','Cadeira extensora',3,3,'15',60),
  ('Treino C','Mesa flexora',4,3,'12',60),
  ('Treino C','Elevação pélvica',5,3,'12',60),
  ('Treino C','Panturrilha em pé',6,4,'20',45),
  ('Treino D','Desenvolvimento com halteres',1,4,'10',90),
  ('Treino D','Elevação lateral',2,3,'15',45),
  ('Treino D','Crucifixo inverso',3,3,'15',45),
  ('Treino D','Prancha isométrica',4,3,'40 seg',45),
  ('Treino D','Abdominal supra',5,3,'20',45),
  ('Treino E','Esteira',1,1,'20 min',0),
  ('Treino E','Bicicleta ergométrica',2,1,'10 min',0),
  ('Treino E','Elevação de pernas',3,3,'15',45),
  ('Treino E','Prancha lateral',4,3,'30 seg',45)
) AS d(workout_name, exercise_name, position, sets, reps, rest)
JOIN public.workouts w ON w.name = d.workout_name
JOIN public.exercises ex ON ex.name = d.exercise_name;