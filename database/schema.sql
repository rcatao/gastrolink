-- GastroLink — modelo relacional (DER lógico) do MVP
-- Seis entidades: usuarios, restaurantes, influenciadores, ofertas,
-- interesses_whatsapp e moderacao_denuncias.
-- A aplicação em execução persiste o equivalente desnormalizado
-- (LocalStorage ou Cloud Firestore). Este script documenta a visão relacional.

CREATE TABLE usuarios (
  id_usuario        VARCHAR(64) PRIMARY KEY,
  nome_completo     VARCHAR(160) NOT NULL,
  email             VARCHAR(180) NOT NULL UNIQUE,
  senha_hash        CHAR(64) NOT NULL,
  tipo_perfil       VARCHAR(20) NOT NULL CHECK (tipo_perfil IN ('RESTAURANTE', 'INFLUENCIADOR', 'ADMIN')),
  created_at        TIMESTAMP NOT NULL
);

CREATE TABLE restaurantes (
  id_restaurante    VARCHAR(64) PRIMARY KEY,
  id_usuario        VARCHAR(64) NOT NULL UNIQUE REFERENCES usuarios (id_usuario),
  nome_fantasia     VARCHAR(160) NOT NULL,
  documento         VARCHAR(32),
  whatsapp          VARCHAR(20) NOT NULL,
  culinaria         VARCHAR(40) NOT NULL,
  bairro            VARCHAR(160) NOT NULL
);

CREATE TABLE influenciadores (
  id_influenciador  VARCHAR(64) PRIMARY KEY,
  id_usuario        VARCHAR(64) NOT NULL UNIQUE REFERENCES usuarios (id_usuario),
  handle            VARCHAR(80) NOT NULL,
  rede_social       VARCHAR(40) NOT NULL,
  seguidores        INTEGER NOT NULL CHECK (seguidores >= 0),
  nicho             VARCHAR(160),
  media_kit_url     VARCHAR(300)
);

CREATE TABLE ofertas (
  id_oferta         VARCHAR(64) PRIMARY KEY,
  id_restaurante    VARCHAR(64) NOT NULL REFERENCES restaurantes (id_restaurante),
  titulo            VARCHAR(180) NOT NULL,
  modelo_parceria   VARCHAR(40) NOT NULL CHECK (modelo_parceria IN ('Permuta Simples', 'Permuta + Cachê', 'Evento')),
  categoria         VARCHAR(40) NOT NULL,
  bairro            VARCHAR(160) NOT NULL,
  o_que_oferece     TEXT NOT NULL,
  o_que_pede        TEXT NOT NULL,
  min_seguidores    INTEGER NOT NULL CHECK (min_seguidores >= 0),
  tags              TEXT NOT NULL,
  status            VARCHAR(20) NOT NULL CHECK (status IN ('active', 'paused', 'suspended')),
  cliques_whatsapp  INTEGER NOT NULL DEFAULT 0 CHECK (cliques_whatsapp >= 0),
  created_at        TIMESTAMP NOT NULL
);

CREATE TABLE interesses_whatsapp (
  id_interesse      VARCHAR(64) PRIMARY KEY,
  id_oferta         VARCHAR(64) NOT NULL REFERENCES ofertas (id_oferta),
  id_influenciador  VARCHAR(64) NOT NULL REFERENCES influenciadores (id_influenciador),
  mensagem          TEXT NOT NULL,
  url               TEXT NOT NULL,
  created_at        TIMESTAMP NOT NULL
);

CREATE TABLE moderacao_denuncias (
  id_denuncia       VARCHAR(64) PRIMARY KEY,
  id_oferta         VARCHAR(64) NOT NULL REFERENCES ofertas (id_oferta),
  id_reportante     VARCHAR(64) NOT NULL REFERENCES usuarios (id_usuario),
  id_admin_revisor  VARCHAR(64) REFERENCES usuarios (id_usuario),
  motivo            TEXT NOT NULL,
  status            VARCHAR(20) NOT NULL CHECK (status IN ('PENDENTE', 'APROVADA', 'SUSPENSA')),
  created_at        TIMESTAMP NOT NULL,
  decided_at        TIMESTAMP
);

CREATE INDEX idx_ofertas_restaurante ON ofertas (id_restaurante);
CREATE INDEX idx_ofertas_status ON ofertas (status);
CREATE INDEX idx_interesses_oferta ON interesses_whatsapp (id_oferta);
CREATE INDEX idx_denuncias_status ON moderacao_denuncias (status);
