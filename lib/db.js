import Database from "better-sqlite3"

const db = new Database("database.db")

db.exec(`
CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  validade_dias INTEGER,
  descricao TEXT,
  logo_url TEXT
);
`)

db.exec(`
CREATE TABLE IF NOT EXISTS lotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id INTEGER,
  data_producao TEXT,
  quantidade INTEGER,
  data_ultima_impressao TEXT
);
`)

export default db