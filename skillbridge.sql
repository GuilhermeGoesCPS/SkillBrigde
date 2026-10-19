drop database if exists skillbridge;
create database skillbridge;
use skillbridge;

create table usuarios(
    id int primary key auto_increment,
    nome varchar(50) not null,
    email varchar(100) not null unique,
    senha blob(128) not null comment "PBKDF2-SHA512: 16-byte salt + 64-byte derived key",
    descricao longtext,
    endereco text not null,
    contato text
);

create table empresas(
    id int primary key auto_increment,
    cnpj char(14) not null unique,
    
    usuario int not null, foreign key(usuario) references usuarios(id)
);

create table instituicoes(
    id int primary key auto_increment,
    cnpj char(14) not null unique,

    usuario int not null, foreign key(usuario) references usuarios(id)
);

create table cursos(
    id int primary key auto_increment,
    nome varchar(50) not null unique
);

create table alunos(
    id int primary key auto_increment,
    ra char(13) not null unique,
    periodo char(1) not null,

    usuario int not null, foreign key(usuario) references usuarios(id),
    curso int not null, foreign key(curso) references cursos(id),
    instituicao int not null, foreign key(instituicao) references instituicoes(id)
);

create table vagas(
    id int primary key auto_increment,
    tipo varchar(20) not null,
    descricao longtext,
    salario decimal(11, 2) not null,
    horario_inicio time not null,
    horario_termino time not null,
    numero_de_vagas int,
    
    empresa int not null, foreign key(empresa) references empresas(id)
);

create table candidaturas(
    id int primary key auto_increment,
    aceito boolean,

    aluno int not null, foreign key(aluno) references alunos(id),
    vaga int not null, foreign key(vaga) references vagas(id)
);

create table categorias(
    id int primary key auto_increment,
    nome varchar(20) not null
);

create table tags(
    id int primary key auto_increment,
    nome varchar(30) not null
);

create table tags_x_categorias(
    tag int not null, foreign key(tag) references tags(id),
    categoria int not null, foreign key(categoria) references categorias(id),

    primary key(tag, categoria)
);

create table tags_x_vagas(
    tag int not null, foreign key(tag) references tags(id),
    vaga int not null, foreign key(vaga) references vagas(id),

    primary key(tag, vaga)
);

create table tags_x_alunos(
    tag int not null, foreign key(tag) references tags(id),
    aluno int not null, foreign key(aluno) references alunos(id),

    primary key(tag, aluno)
);
