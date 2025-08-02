// --- Imports do Firebase SDK ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Configuração do Firebase (Fornecida por você) ---
const firebaseConfig = {
    apiKey: "AIzaSyBriXRfGzGKwsgtR6BXABd4sV6d8RNxYTo",
    authDomain: "parametrosap.firebaseapp.com",
    projectId: "parametrosap",
    storageBucket: "parametrosap.firebasestorage.app",
    messagingSenderId: "1033564215134",
    appId: "1:1033564215134:web:f54b868344f21d4f90e1cf",
    measurementId: "G-90X7QGZ1SP"
};

// --- Inicialização do Firebase e Firestore ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Referências para elementos do DOM ---
const searchBox = document.getElementById('search-box');
const tableBody = document.getElementById('table-body');
const addParamBtn = document.getElementById('add-param-btn');
const modal = document.getElementById('add-param-modal');
const closeBtn = document.querySelector('.close-btn');
const form = document.getElementById('add-param-form');
const notification = document.getElementById('notification-message');

// --- Lógica da Aplicação ---

/**
 * Abre a modal para adicionar um novo parâmetro.
 */
function openModal() {
    modal.style.display = 'block';
}

/**
 * Fecha a modal.
 */
function closeModal() {
    modal.style.display = 'none';
    form.reset(); // Limpa o formulário
}

/**
 * Exibe uma notificação no canto superior direito por 3 segundos.
 */
function showNotification() {
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000); // Remove a notificação após 3 segundos
}

/**
 * Renderiza a tabela com os dados fornecidos.
 * @param {Array<Object>} params - Array de objetos com os parâmetros.
 */
function renderTable(params) {
    tableBody.innerHTML = ''; // Limpa o corpo da tabela
    if (params.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Nenhum parâmetro encontrado.</td></tr>';
        return;
    }

    params.forEach(param => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${param.chave}</td>
            <td>${param.valor}</td>
            <td>${param.descricao}</td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Lida com o filtro da tabela ao digitar na caixa de busca.
 */
function handleSearch() {
    const searchTerm = searchBox.value.toLowerCase();
    const rows = tableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const rowText = row.textContent.toLowerCase();
        if (rowText.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// --- Event Listeners ---

// Abre a modal
addParamBtn.addEventListener('click', openModal);

// Fecha a modal ao clicar no botão 'x'
closeBtn.addEventListener('click', closeModal);

// Fecha a modal ao clicar fora dela
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Lida com o envio do formulário para adicionar um novo parâmetro
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const chave = form.chave.value;
    const valor = form.valor.value;
    const descricao = form.descricao.value;

    try {
        await addDoc(collection(db, "parametros"), {
            chave,
            valor,
            descricao,
            createdAt: new Date() // Adiciona um timestamp para ordenação
        });
        showNotification("Parâmetro adicionado com sucesso!");
        closeModal();
    } catch (e) {
        console.error("Erro ao adicionar documento: ", e);
        // Em um app real, você mostraria um erro para o usuário
    }
});

// Lida com a cópia para a área de transferência ao clicar na linha da tabela
tableBody.addEventListener('click', async (e) => {
    const row = e.target.closest('tr');
    if (row) {
        const firstCell = row.querySelector('td');
        if (firstCell) {
            const textToCopy = firstCell.textContent;
            try {
                await navigator.clipboard.writeText(textToCopy);
                showNotification();
            } catch (err) {
                console.error('Falha ao copiar texto: ', err);
            }
        }
    }
});

// Adiciona listener para o campo de busca
searchBox.addEventListener('keyup', handleSearch);

// --- Leitura em tempo real do Firestore (onSnapshot) ---
const q = query(collection(db, "parametros"));
onSnapshot(q, (querySnapshot) => {
    const params = [];
    querySnapshot.forEach((doc) => {
        params.push({ id: doc.id, ...doc.data() });
    });
    // Opcional: ordenar os dados localmente
    params.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
    renderTable(params);
});
