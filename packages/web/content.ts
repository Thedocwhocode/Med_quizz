/**
 * Static content pages, rendered to plain HTML at build time.
 *
 * The app itself is a client-side SPA whose only public route is a room-code
 * input -- there is nothing there for a search engine to rank. These pages
 * carry the indexable text, so they are emitted as complete HTML documents
 * that need no JavaScript to be read.
 *
 * Edit the copy below to match your audience: this text is what decides
 * whether a search result ever points here.
 */

export interface ContentSection {
  heading: string
  body: string[]
  items?: string[]
}

export interface FaqEntry {
  question: string
  answer: string
}

export interface ContentPage {
  /** URL path, without extension: `sobre` is served at `/sobre`. */
  slug: string
  /** BCP 47 language of the copy, e.g. `pt-BR`. Must match what is written below. */
  lang: string
  /** Used as `<title>`, and as the `<h1>` unless `heading` overrides it. */
  title: string
  heading: string
  description: string
  intro: string[]
  sections: ContentSection[]
  /** Heading above the FAQ block; write it in the same language as the copy. */
  faqHeading: string
  faq: FaqEntry[]
  /** Label and path of the call to action pointing back into the app. */
  cta: { label: string; href: string }
}

export const contentPages: ContentPage[] = [
  {
    slug: "sobre",
    lang: "pt-BR",
    title: "Quiz ao vivo para aulas de medicina",
    heading: "Quiz ao vivo para aulas de medicina",
    description:
      "Plataforma de quiz ao vivo para ensino médico: os alunos entram pelo celular com um código, respondem em tempo real e o ranking aparece na tela da sala.",
    intro: [
      "Uma plataforma de quiz ao vivo feita para aula: você projeta a pergunta, a turma responde pelo celular e o resultado aparece na hora — sem instalar aplicativo e sem criar conta.",
      "O software é open source e roda no seu próprio servidor, o que significa que as perguntas, as respostas dos alunos e os resultados permanecem na sua infraestrutura.",
    ],
    sections: [
      {
        heading: "Como funciona uma partida",
        body: [
          "A mecânica é a mesma de um quiz de auditório, adaptada para uma sala de aula ou um plantão de ensino.",
        ],
        items: [
          "Você abre a sala pela área do professor e projeta o código na tela.",
          "Os alunos acessam o endereço pelo navegador do celular e digitam esse código.",
          "Cada pergunta abre com tempo limitado; quem responde mais rápido e certo pontua mais.",
          "Ao final de cada pergunta, a distribuição das respostas aparece na tela — é aí que a discussão começa.",
          "O ranking acumulado fecha a rodada.",
        ],
      },
      {
        heading: "Por que usar quiz ao vivo no ensino médico",
        body: [
          "Responder a uma pergunta antes de ouvir a resposta é mais eficiente do que ouvir a explicação primeiro. Recuperar uma informação da memória fortalece o traço mais do que revê-la passivamente — o efeito de teste, um dos achados mais replicados da psicologia cognitiva.",
          "Há um segundo ganho, menos citado: a distribuição das respostas revela o erro coletivo. Quando 60% da turma escolhe a mesma alternativa errada, você descobriu um equívoco compartilhado que uma aula expositiva jamais teria exposto — e pode corrigi-lo naquele momento, com a turma ainda engajada no problema.",
        ],
      },
      {
        heading: "Recursos",
        body: ["O que está disponível na plataforma."],
        items: [
          "Perguntas com imagem — útil para ECG, radiografia, lâmina ou fundo de olho.",
          "Tempo e pontuação configuráveis por pergunta.",
          "Quizzes salvos em arquivos, versionáveis e reutilizáveis entre turmas.",
          "Identidade visual personalizável: cores, logo e nome da instituição.",
          "Interface em vários idiomas.",
          "Instalação self-hosted via Docker, em servidor próprio ou na nuvem.",
        ],
      },
      {
        heading: "Para quem é",
        body: [
          "Professores de graduação em medicina, preceptores de residência, coordenadores de liga acadêmica e quem organiza sessões de educação continuada — qualquer contexto em que uma turma reunida precisa ser avaliada de forma formativa, sem o peso de uma prova.",
        ],
      },
    ],
    faqHeading: "Perguntas frequentes",
    faq: [
      {
        question: "Os alunos precisam instalar algum aplicativo?",
        answer:
          "Não. A participação acontece pelo navegador do celular: basta abrir o endereço e digitar o código da sala.",
      },
      {
        question: "É preciso criar conta para jogar?",
        answer:
          "Não. O aluno informa apenas um nome de exibição. Só a área do professor exige senha.",
      },
      {
        question: "Onde ficam armazenadas as perguntas e as respostas?",
        answer:
          "No servidor onde você instalou a plataforma. Como o software é self-hosted, nenhum dado é enviado a serviços de terceiros.",
      },
      {
        question: "Quantos alunos podem participar ao mesmo tempo?",
        answer:
          "O limite é o do servidor em que a plataforma está instalada. Para uma turma de graduação ou uma sessão de residência, um servidor modesto é suficiente.",
      },
      {
        question: "É possível reaproveitar um quiz em outra turma?",
        answer:
          "Sim. Cada quiz é um arquivo salvo na configuração e pode ser reaberto, editado e reutilizado quantas vezes for necessário.",
      },
      {
        question: "O projeto é gratuito?",
        answer:
          "Sim. É software open source — você pode instalar, usar e modificar livremente, arcando apenas com o custo do servidor onde o hospeda.",
      },
    ],
    cta: { label: "Entrar em uma sala", href: "/" },
  },
]
