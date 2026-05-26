require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./db');

const app = express();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, 'public')
    )
);

// ======================================================
// CLIENTES
// ======================================================

// LISTAR CLIENTES
app.get('/api/clientes', (req, res) => {

    const sql = `
        SELECT *
        FROM clientes
        ORDER BY nome ASC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(results);
    });
});

// CRIAR CLIENTE
app.post('/api/clientes', (req, res) => {

    const {
        nome,
        telefone,
        email
    } = req.body;

    if (!nome || !telefone) {

        return res.status(400).json({
            error: 'Nome e telefone são obrigatórios.'
        });
    }

    const sql = `
        INSERT INTO clientes
        (
            nome,
            telefone,
            email
        )
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [
            nome,
            telefone,
            email
        ],
        (err, result) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                id: result.insertId,
                nome,
                telefone,
                email
            });
        }
    );
});

// ATUALIZAR CLIENTE
app.put('/api/clientes/:id', (req, res) => {

    const { id } = req.params;

    const {
        nome,
        telefone,
        email
    } = req.body;

    const sql = `
        UPDATE clientes
        SET
            nome = ?,
            telefone = ?,
            email = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            nome,
            telefone,
            email,
            id
        ],
        (err) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                message: 'Cliente atualizado com sucesso.'
            });
        }
    );
});

// DELETAR CLIENTE
app.delete('/api/clientes/:id', (req, res) => {

    const { id } = req.params;

    const sql = `
        DELETE FROM clientes
        WHERE id = ?
    `;

    db.query(
        sql,
        [id],
        (err) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                message: 'Cliente excluído com sucesso.'
            });
        }
    );
});

// ======================================================
// PEDIDOS
// ======================================================

// LISTAR PEDIDOS
app.get('/api/pedidos', (req, res) => {

    const sql = `
        SELECT *
        FROM pedidos
        ORDER BY created_at DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            return res.status(500).json({
                error: err.message
            });
        }

        res.json(results);
    });
});

// CRIAR PEDIDO
app.post('/api/pedidos', (req, res) => {

    const {
        cliente,
        pizza,
        quantidade,
        endereco,
        status
    } = req.body;

    if (
        !cliente ||
        !pizza ||
        !quantidade ||
        !endereco
    ) {

        return res.status(400).json({
            error: 'Preencha todos os campos.'
        });
    }

    // PREÇOS DAS PIZZAS
    const precos = {
        Calabresa: 45,
        Portuguesa: 50,
        'Frango Catupiry': 55,
        Marguerita: 40
    };

    const precoPizza =
        precos[pizza] || 40;

    const total =
        precoPizza * quantidade;

    const sql = `
        INSERT INTO pedidos
        (
            cliente,
            pizza,
            quantidade,
            endereco,
            status,
            total
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            cliente,
            pizza,
            quantidade,
            endereco,
            status || 'pendente',
            total
        ],
        (err, result) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                id: result.insertId,
                cliente,
                pizza,
                quantidade,
                endereco,
                status,
                total
            });
        }
    );
});

// ATUALIZAR PEDIDO
app.put('/api/pedidos/:id', (req, res) => {

    const { id } = req.params;

    const {
        cliente,
        pizza,
        quantidade,
        endereco,
        status
    } = req.body;

    const precos = {
        Calabresa: 45,
        Portuguesa: 50,
        'Frango Catupiry': 55,
        Marguerita: 40
    };

    const precoPizza =
        precos[pizza] || 40;

    const total =
        precoPizza * quantidade;

    const sql = `
        UPDATE pedidos
        SET
            cliente = ?,
            pizza = ?,
            quantidade = ?,
            endereco = ?,
            status = ?,
            total = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            cliente,
            pizza,
            quantidade,
            endereco,
            status,
            total,
            id
        ],
        (err) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                message: 'Pedido atualizado com sucesso.'
            });
        }
    );
});

// DELETAR PEDIDO
app.delete('/api/pedidos/:id', (req, res) => {

    const { id } = req.params;

    const sql = `
        DELETE FROM pedidos
        WHERE id = ?
    `;

    db.query(
        sql,
        [id],
        (err) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                message: 'Pedido excluído com sucesso.'
            });
        }
    );
});

// ======================================================
// DASHBOARD
// ======================================================

app.get('/api/dashboard', (req, res) => {

    const hoje =
        new Date()
        .toISOString()
        .split('T')[0];

    const pedidosHojeSql = `
        SELECT COUNT(*) AS total
        FROM pedidos
        WHERE DATE(created_at) = ?
    `;

    db.query(
        pedidosHojeSql,
        [hoje],
        (err1, pedidosHoje) => {

            if (err1) {

                return res.status(500).json({
                    error: err1.message
                });
            }

            const faturamentoSql = `
                SELECT SUM(total) AS faturamento
                FROM pedidos
            `;

            db.query(
                faturamentoSql,
                (err2, faturamento) => {

                    if (err2) {

                        return res.status(500).json({
                            error: err2.message
                        });
                    }

                    const pendentesSql = `
                        SELECT COUNT(*) AS pendentes
                        FROM pedidos
                        WHERE status = 'pendente'
                    `;

                    db.query(
                        pendentesSql,
                        (err3, pendentes) => {

                            if (err3) {

                                return res.status(500).json({
                                    error: err3.message
                                });
                            }

                            const clientesSql = `
                                SELECT COUNT(*) AS total
                                FROM clientes
                            `;

                            db.query(
                                clientesSql,
                                (err4, clientes) => {

                                    if (err4) {

                                        return res.status(500).json({
                                            error: err4.message
                                        });
                                    }

                                    res.json({
                                        pedidosHoje:
                                            pedidosHoje[0].total,

                                        faturamento:
                                            faturamento[0].faturamento || 0,

                                        pendentes:
                                            pendentes[0].pendentes,

                                        totalClientes:
                                            clientes[0].total
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

// ======================================================
// ESTATÍSTICAS
// ======================================================

app.get('/api/estatisticas', (req, res) => {

    const sql = `
        SELECT *
        FROM pedidos
    `;

    db.query(sql, (err, results) => {

        if (err) {

            return res.status(500).json({
                error: err.message
            });
        }

        const pizzasRanking = {};

        const statusPedidos = {
            pendente: 0,
            preparando: 0,
            saiu_entrega: 0,
            entregue: 0,
            cancelado: 0
        };

        results.forEach(pedido => {

            pizzasRanking[pedido.pizza] =
                (pizzasRanking[pedido.pizza] || 0) + 1;

            if (pedido.status) {
                statusPedidos[pedido.status]++;
            }
        });

        res.json({
            totalPedidos: results.length,
            pizzasRanking,
            statusPedidos
        });
    });
});

// ======================================================
// SPA
// ======================================================

app.use((req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            'public',
            'index.html'
        )
    );
});

// ======================================================
// SERVIDOR
// ======================================================

app.listen(port, () => {

    console.log(
        `Servidor rodando em http://localhost:${port}`
    );
});