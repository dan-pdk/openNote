CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    
    username VARCHAR(128) NOT NULL UNIQUE,
    email VARCHAR(128) NOT NULL UNIQUE,
    hash_senha VARCHAR(256),
    isAdmin BOOLEAN,
    mirror_foto TEXT
);

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    
    nome VARCHAR(128) NOT NULL,
    cor VARCHAR(7) NOT NULL
);

CREATE TABLE tarefas (
    id SERIAL PRIMARY KEY,
    
    nome VARCHAR(128) NOT NULL,
    dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dataEntrega TIMESTAMP,

    id_categoria INT REFERENCES categorias(id) ON DELETE SET NULL
);

CREATE TABLE salas (
    id UUID PRIMARY KEY DEFAULT uuidv7(),

    nome VARCHAR(128) NOT NULL,
    capacidade INT,
    tipo VARCHAR(128) NOT NULL,
    icone_url VARCHAR(1024),

    lider_id UUID,
    CONSTRAINT fk_lider_id FOREIGN KEY (lider_id) REFERENCES usuarios(id)
);

CREATE TABLE threads (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(128) NOT NULL UNIQUE,
    
    autor_id UUID REFERENCES usuarios(id)
);

CREATE TABLE comentarios (
    id SERIAL PRIMARY KEY,

    conteudo TEXT,
    flagged BOOLEAN,

    autor_id UUID REFERENCES usuarios(id),
    responde_a INT REFERENCES comentarios(id) ON DELETE SET NULL,
    pertence_a INT REFERENCES threads(id) ON DELETE CASCADE
);

CREATE TABLE anexos (
    id SERIAL PRIMARY KEY,

    nome VARCHAR(128) NOT NULL,
    url_anexo TEXT,

    dataAdicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
