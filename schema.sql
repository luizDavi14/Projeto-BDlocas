-- Tabela de clientes
CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de agendamentos
CREATE TABLE agendamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT,
  servico VARCHAR(255) NOT NULL,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  observacoes TEXT,
  status ENUM('confirmado', 'cancelado', 'pendente') DEFAULT 'pendente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_cliente
    FOREIGN KEY (cliente_id)
    REFERENCES clientes(id)
    ON DELETE CASCADE,

  UNIQUE(cliente_id, data, hora)
);