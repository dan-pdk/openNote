CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    username VARCHAR(128) NOT NULL UNIQUE,
    email VARCHAR(128) NOT NULL UNIQUE,
    hash_senha VARCHAR(256),
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    mirror_foto TEXT,
    show_email BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(128) NOT NULL,
    cor VARCHAR(7) NOT NULL
);

CREATE TABLE salas (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    nome VARCHAR(128) NOT NULL,
    tipo VARCHAR(32) NOT NULL DEFAULT 'restrita' CHECK (tipo IN ('restrita', 'livre')),
    icone_url VARCHAR(1024),
    lider_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP default CURRENT_TIMESTAMP
);

CREATE TABLE sala_membros (
    id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    id_sala UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
    data_entrada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pode_criar_tarefas BOOLEAN NOT NULL DEFAULT TRUE,
    pode_mandar_mensagens BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id_usuario, id_sala)
);

CREATE TABLE tarefas (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    nome VARCHAR(128) NOT NULL,
    data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_entrega TIMESTAMP,
    descricao TEXT,
    cor VARCHAR(7) NOT NULL DEFAULT '#14B8A6',
    concluida BOOLEAN NOT NULL DEFAULT FALSE,
    criador_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    id_categoria INT REFERENCES categorias(id) ON DELETE SET NULL,
    id_sala UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE
);

CREATE TABLE tarefa_conclusoes (
    id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    id_tarefa UUID NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
    data_conclusao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario, id_tarefa)
);

CREATE TABLE anexos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(128) NOT NULL,
    url_anexo TEXT NOT NULL,
    data_adicao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_tarefa UUID NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE
);

CREATE TABLE threads (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(128) NOT NULL,
    autor_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    id_tarefa UUID NOT NULL UNIQUE REFERENCES tarefas(id) ON DELETE CASCADE
);

CREATE TABLE comentarios (
    id SERIAL PRIMARY KEY,
    conteudo TEXT NOT NULL,
    flagged BOOLEAN NOT NULL DEFAULT FALSE,
    autor_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    responde_a INT REFERENCES comentarios(id) ON DELETE SET NULL,
    pertence_a INT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sala_mensagens (
    id SERIAL PRIMARY KEY,
    conteudo TEXT NOT NULL,
    autor_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    id_sala UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tarefa_leituras (
    id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    id_tarefa UUID NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
    ultimo_comentario_id INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario, id_tarefa)
);
