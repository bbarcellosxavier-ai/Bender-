import { createFileRoute } from "@tanstack/react-router";
import { Dumbbell, ShieldCheck, Smartphone, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bender Personal | Treinos do seu personal trainer" },
      {
        name: "description",
        content:
          "App de treinos do Bender Personal: o aluno vê o treino do dia, a demonstração de cada exercício e as instruções de execução.",
      },
      { property: "og:title", content: "Bender Personal" },
      {
        property: "og:description",
        content:
          "Treino do dia, demonstração dos exercícios e instruções de execução, direto no celular.",
      },
    ],
  }),
  component: Index,
});

const highlights = [
  {
    icon: Dumbbell,
    title: "Treino do dia na tela inicial",
    text: "O aluno abre o app e já vê o primeiro exercício, sem cliques extras.",
  },
  {
    icon: Users,
    title: "Cada aluno, seu plano",
    text: "O personal monta treinos por grupo muscular e atribui a cada aluno.",
  },
  {
    icon: ShieldCheck,
    title: "Acesso conforme a mensalidade",
    text: "Pagamento em atraso bloqueia o acesso automaticamente.",
  },
  {
    icon: Smartphone,
    title: "Instalável no celular",
    text: "Funciona como app, sem passar por loja de aplicativos.",
  },
];

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-5 pb-16 pt-12">
        <header className="flex flex-col items-center gap-4 text-center">
          <img
            src="/app-icon.png"
            alt="Logotipo do Bender Personal"
            width={96}
            height={96}
            className="h-24 w-24 rounded-2xl"
          />
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">
              Bender <span className="text-primary">Personal</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Os treinos montados pelo seu personal, com demonstração e
              instruções de execução.
            </p>
          </div>
        </header>

        <section className="rounded-xl border border-primary/40 bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Configuração pendente
          </p>
          <h2 className="mt-2 text-lg font-bold">Conecte o banco de dados</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            O login, o cadastro de alunos e os treinos entram assim que o
            projeto Supabase dedicado do Bender Personal estiver conectado.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          {highlights.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="flex gap-3 rounded-xl border border-border bg-card p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
