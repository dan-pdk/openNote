CREATE TABLE usuarios (
    id VARCHAR(32) PRIMARY KEY;
    
    username VARCHAR(128) NOT NULL UNIQUE,
    email VARCHAR(128) NOT NULL UNIQUE,
    hash_senha VARCHAR(256) NOT NULL,
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

    id_categoria VARCHAR(128) REFERENCES category(id) ON DELETE SET NULL,
);

CREATE TABLE salas (
    id SERIAL PRIMARY KEY,

    nome VARCHAR(128) NOT NULL,
    capacidade TINYINT,
    tipo VARCHAR(128) NOT NULL,
    
    lider_id VARCHAR(32) REFERENCES usuarios(id)
);

CREATE TABLE threads (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(128) NOT NULL UNIQUE,
    
    autor_id VARCHAR(32) REFERENCES usuarios(id)
);

CREATE TABLE comentarios (
    id SERIAL PRIMARY KEY,

    conteudo TEXT,
    flagged BOOLEAN,

    autor_id VARCHAR(32) REFERENCES usuarios(id),
    responde_a INT REFERENCES comentarios(id) ON DELETE SET NULL,
    pertence_a INT REFERENCES threads(id) ON DELETE CASCADE
);

CREATE TABLE anexos (
    id SERIAL PRIMARY KEY,

    nome VARCHAR(128) NOT NULL,
    url_anexo TEXT,

    dataAdicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
