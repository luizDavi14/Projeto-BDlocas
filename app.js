const { createApp } = Vue;

const api = axios.create({
    baseURL: '/api'
});

createApp({

    data() {

        return {

            currentView: 'dashboard',
            sidebarOpen: false,

            isDarkMode:
                localStorage.getItem('theme') === 'dark',

            dashboardData: {
                pedidosHoje: 0,
                faturamento: 0,
                pendentes: 0,
                totalClientes: 0
            },

            pedidos: [],
            pedidosRecentes: [],
            clientes: [],

            estatisticasData: {
                totalPedidos: 0,
                pizzasRanking: {},
                statusPedidos: {}
            },

            showModalPedido: false,
            showModalCliente: false,
            showDeleteModal: false,

            deleteType: '',
            deleteId: null,

            buscaCliente: '',

            chartInstance: null,

            pedidoForm: {
                id: null,
                cliente: '',
                pizza: 'Calabresa',
                quantidade: 1,
                endereco: '',
                status: 'pendente'
            },

            clienteForm: {
                id: null,
                nome: '',
                telefone: '',
                email: ''
            },

            toasts: [],
            toastId: 0
        };
    },

    computed: {

        clientesFiltrados() {

            const busca =
                this.buscaCliente.toLowerCase();

            return this.clientes.filter(c =>

                c.nome.toLowerCase().includes(busca) ||

                c.telefone.includes(busca)
            );
        }
    },

    methods: {

        // =========================================
        // FORMATAR DATA
        // =========================================

        formatarData(data) {

            if (!data) return '-';

            const novaData = new Date(data);

            return novaData.toLocaleDateString('pt-BR');
        },

        // =========================================
        // CALCULAR TOTAL
        // =========================================

        calcularTotal(pizza, quantidade = 1) {

            const precos = {

                'Calabresa': 45,
                'Portuguesa': 52,
                'Frango Catupiry': 50,
                'Marguerita': 48
            };

            return (precos[pizza] || 0) * quantidade;
        },

        // =========================================
        // TEMA
        // =========================================

        toggleTheme() {

            this.isDarkMode = !this.isDarkMode;

            const theme =
                this.isDarkMode ? 'dark' : 'light';

            document.documentElement.setAttribute(
                'data-theme',
                theme
            );

            localStorage.setItem('theme', theme);
        },

        // =========================================
        // TROCAR VIEW
        // =========================================

        changeView(view) {

            this.currentView = view;

            if (view === 'dashboard') {
                this.loadDashboard();
            }

            if (view === 'pedidos') {
                this.loadPedidos();
            }

            if (view === 'clientes') {
                this.loadClientes();
            }

            if (view === 'estatisticas') {
                this.loadEstatisticas();
            }
        },

        // =========================================
        // TOAST
        // =========================================

        showToast(message, type = 'success') {

            const id = this.toastId++;

            this.toasts.push({
                id,
                message,
                type
            });

            setTimeout(() => {

                this.toasts =
                    this.toasts.filter(
                        t => t.id !== id
                    );

            }, 3000);
        },

        // =========================================
        // DASHBOARD
        // =========================================

        async loadDashboard() {

            try {

                const res =
                    await api.get('/dashboard');

                this.dashboardData = res.data;

            } catch (err) {

                console.error(err);

                this.showToast(
                    'Erro ao carregar dashboard',
                    'error'
                );
            }
        },

        // =========================================
        // PEDIDOS
        // =========================================

        async loadPedidos() {

            try {

                const res =
                    await api.get('/pedidos');

                this.pedidos = res.data;

                this.pedidosRecentes =
                    res.data.slice(0, 5);

            } catch (err) {

                console.error(err);

                this.showToast(
                    'Erro ao carregar pedidos',
                    'error'
                );
            }
        },

        openPedidoModal(pedido = null) {

            if (pedido) {

                this.pedidoForm = {
                    ...pedido
                };

            } else {

                this.pedidoForm = {
                    id: null,
                    cliente: '',
                    pizza: 'Calabresa',
                    quantidade: 1,
                    endereco: '',
                    status: 'pendente'
                };
            }

            this.showModalPedido = true;
        },

        async savePedido() {

            try {

                const payload = {

                    ...this.pedidoForm,

                    total: this.calcularTotal(
                        this.pedidoForm.pizza,
                        this.pedidoForm.quantidade
                    )
                };

                if (this.pedidoForm.id) {

                    // EDITAR
                    await api.put(
                        `/pedidos/${this.pedidoForm.id}`,
                        payload
                    );

                    this.showToast(
                        'Pedido atualizado!'
                    );

                } else {

                    // NOVO
                    await api.post(
                        '/pedidos',
                        payload
                    );

                    this.showToast(
                        'Pedido criado!'
                    );
                }

                this.showModalPedido = false;

                this.loadPedidos();

                this.loadDashboard();

            } catch (err) {

                console.error(err);

                this.showToast(
                    'Erro ao salvar pedido',
                    'error'
                );
            }
        },

        // =========================================
        // CLIENTES
        // =========================================

        async loadClientes() {

            try {

                const res =
                    await api.get('/clientes');

                this.clientes = res.data;

            } catch (err) {

                console.error(err);

                this.showToast(
                    'Erro ao carregar clientes',
                    'error'
                );
            }
        },

        openClienteModal(cliente = null) {

            if (cliente) {

                this.clienteForm = {
                    ...cliente
                };

            } else {

                this.clienteForm = {
                    id: null,
                    nome: '',
                    telefone: '',
                    email: ''
                };
            }

            this.showModalCliente = true;
        },

        async saveCliente() {

            try {

                if (this.clienteForm.id) {

                    await api.put(
                        `/clientes/${this.clienteForm.id}`,
                        this.clienteForm
                    );

                } else {

                    await api.post(
                        '/clientes',
                        this.clienteForm
                    );
                }

                this.showToast(
                    'Cliente salvo!'
                );

                this.showModalCliente = false;

                this.loadClientes();

                this.loadDashboard();

            } catch (err) {

                console.error(err);

                this.showToast(
                    'Erro ao salvar cliente',
                    'error'
                );
            }
        },

        // =========================================
        // EXCLUIR
        // =========================================

        confirmDelete(type, id) {

            this.deleteType = type;
            this.deleteId = id;

            this.showDeleteModal = true;
        },

        async executeDelete() {

            try {

                await api.delete(
                    `/${this.deleteType}s/${this.deleteId}`
                );

                this.showToast(
                    'Registro excluído!'
                );

                this.showDeleteModal = false;

                if (this.deleteType === 'pedido') {
                    this.loadPedidos();
                }

                if (this.deleteType === 'cliente') {
                    this.loadClientes();
                }

                this.loadDashboard();

            } catch (err) {

                console.error(err);

                this.showToast(
                    'Erro ao excluir',
                    'error'
                );
            }
        },

        // =========================================
        // ESTATÍSTICAS
        // =========================================

        async loadEstatisticas() {

            try {

                const res =
                    await api.get('/estatisticas');

                this.estatisticasData = res.data;

                this.$nextTick(() => {
                    this.renderCharts();
                });

            } catch (err) {

                console.error(err);

                this.showToast(
                    'Erro ao carregar estatísticas',
                    'error'
                );
            }
        },

        renderCharts() {

            const ctx =
                document.getElementById('chartStatus');

            if (!ctx) return;

            if (this.chartInstance) {
                this.chartInstance.destroy();
            }

            this.chartInstance = new Chart(ctx, {

                type: 'doughnut',

                data: {

                    labels: [
                        'Pendente',
                        'Preparando',
                        'Saiu Entrega',
                        'Entregue',
                        'Cancelado'
                    ],

                    datasets: [{

                        data: [

                            this.estatisticasData
                                .statusPedidos
                                ?.pendente || 0,

                            this.estatisticasData
                                .statusPedidos
                                ?.preparando || 0,

                            this.estatisticasData
                                .statusPedidos
                                ?.saiu_entrega || 0,

                            this.estatisticasData
                                .statusPedidos
                                ?.entregue || 0,

                            this.estatisticasData
                                .statusPedidos
                                ?.cancelado || 0
                        ]
                    }]
                }
            });
        }
    },

    mounted() {

        if (this.isDarkMode) {

            document.documentElement.setAttribute(
                'data-theme',
                'dark'
            );
        }

        this.loadDashboard();
        this.loadPedidos();
        this.loadClientes();
    }

}).mount('#app');