export interface HomeCardBotao {
  texto: string;
  href: string;
}

export interface HomeCard {
  titulo: string;
  texto: string;
  botao?: HomeCardBotao;
}

export const homeCards: HomeCard[] = [
  {
    titulo: "SOBRE NÓS",
    texto:
      "O SkillBridge é uma plataforma digital que conecta estudantes do Centro Paula Souza a oportunidades de estágio, aprendizagem e emprego, facilitando a aproximação entre empresas e talentos em formação.",
  },
  {
    titulo: "PROPÓSITO",
    texto:
      "Nosso propósito é de reduzir a dificuldade de inserção dos alunos no mercado de trabalho, promovendo oportunidades mais acessíveis, inclusivas e compatíveis com a realidade acadêmica.",
  },
  {
    titulo: "ALUNO",
    texto:
      "Você aluno do Centro Paula Souza tem oportunidades de encontrar vagas compatíveis com a sua jornada acadêmica, por meio do nosso edital de vagas com filtragem eficaz para o que você procura.",
  },
  {
    titulo: "EMPRESA",
    texto:
      "Você empresa que deseja contratar nossos alunos promissores, a plataforma SkillBridge tem uma rápida, simples e intuitiva criação de vagas além de disponibilizar um grande banco de talentos para procurar o aluno ideal para a sua vaga!",
  },
  {
    titulo: "ACESSE NOSSA PLATAFORMA",
    texto:
      "Clique no botão abaixo para aproveitar as oportunidades e abrir as portas para o sucesso através do SkillBridge!",
    botao: { texto: "Acessar", href: "/login-aluno" },
  },
];
