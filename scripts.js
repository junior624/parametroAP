// --- Imports do Firebase SDK ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Configuração do Firebase ---
// Usa a configuração do Firebase fornecida pelo usuário ou uma configuração padrão.
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
let db;
let auth;
let allParams = []; // Armazena todos os parâmetros do Firestore

// --- Referências para elementos do DOM ---
const searchBox = document.getElementById('search-box');
const tableBody = document.getElementById('table-body');
const addParamBtn = document.getElementById('add-param-btn');
const modal = document.getElementById('add-param-modal');
const closeBtn = document.querySelector('.close-btn');
const form = document.getElementById('add-param-form');
const modalTitle = document.getElementById('modal-title');
const submitBtn = document.getElementById('submit-btn');
const docIdInput = document.getElementById('doc-id');
const notification = document.getElementById('notification-message');

// --- Lógica da Aplicação ---

/**
 * Abre a modal para adicionar um novo parâmetro ou para editar um existente.
 * @param {Object} [paramToEdit] - O objeto de parâmetro a ser editado.
 */
function openModal(paramToEdit = null) {
    if (paramToEdit) {
        modalTitle.textContent = "Editar Parâmetro";
        submitBtn.textContent = "Atualizar Parâmetro";
        docIdInput.value = paramToEdit.id;
        form.campo.value = paramToEdit.campo;
        form.valor.value = paramToEdit.valor;
        form.descricao.value = paramToEdit.descricao;
    } else {
        modalTitle.textContent = "Adicionar Novo Parâmetro";
        submitBtn.textContent = "Salvar Parâmetro";
        docIdInput.value = ""; // Limpa o ID para um novo cadastro
        form.reset();
    }
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
 * @param {string} message - A mensagem a ser exibida.
 */
function showNotification(message) {
    notification.textContent = message;
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
        const messageRow = document.createElement('tr');
        messageRow.innerHTML = `<td colspan="4" class="text-center py-4 text-gray-500">Nenhum parâmetro encontrado.</td>`;
        tableBody.appendChild(messageRow);
        return;
    }

    params.forEach(param => {
        const row = document.createElement('tr');
        row.dataset.docId = param.id; // Armazena o ID do documento na linha
        row.innerHTML = `
            <td>${param.campo || ''}</td>
            <td>${param.valor || ''}</td>
            <td>${param.descricao || ''}</td>
            <td>
                <button class="edit-btn"><i class="fas fa-edit"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Lida com o filtro da tabela ao digitar na caixa de busca.
 */
function handleSearch() {
    const searchTerm = searchBox.value.toLowerCase();
    const filteredParams = allParams.filter(param => {
        const searchString = `${param.campo} ${param.valor} ${param.descricao}`.toLowerCase();
        return searchString.includes(searchTerm);
    });
    renderTable(filteredParams);
}
        
/**
 * Lida com a cópia de texto para a área de transferência.
 * @param {string} text - O texto a ser copiado.
 */
function copyToClipboard(text) {
    try {
        const tempInput = document.createElement('textarea');
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showNotification('Parâmetro copiado para a área de transferências!');
    } catch (err) {
        console.error('Falha ao copiar texto: ', err);
        showNotification('Falha ao copiar. Tente novamente.');
    }
}

// --- Inicialização do Firebase e Listeners ---
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);

        // A autenticação é feita com o token fornecido, se disponível.
        // Caso contrário, usa autenticação anônima.
        if (typeof __initial_auth_token !== 'undefined') {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }

        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log('Autenticação bem-sucedida.');
                // NOTA IMPORTANTE: Para que a leitura e escrita funcionem, as regras do Firestore
                // precisam permitir acesso para usuários autenticados.
                // Exemplo de regra: allow read, write: if request.auth != null;
                const q = query(collection(db, 'parametros'));
                onSnapshot(q, (querySnapshot) => {
                    allParams = [];
                    querySnapshot.forEach((doc) => {
                        allParams.push({ id: doc.id, ...doc.data() });
                    });
                    
                    const searchTerm = searchBox.value.toLowerCase();
                    if (searchTerm) {
                        handleSearch();
                    } else {
                        renderTable(allParams);
                    }
                });
            } else {
                console.error('Nenhum usuário logado. A aplicação não funcionará.');
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-red-500">Erro na autenticação. A aplicação não pôde ser inicializada.</td></tr>';
            }
        });

    } catch (e) {
        console.error('Erro ao inicializar o Firebase.', e);
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-red-500">Erro ao inicializar. Verifique suas credenciais e a conexão com a internet.</td></tr>';
    }
});

// --- Event Listeners ---

// Abre a modal para adicionar um novo parâmetro
addParamBtn.addEventListener('click', () => openModal());

// Fecha a modal ao clicar no botão 'x'
closeBtn.addEventListener('click', closeModal);

// Fecha a modal ao clicar fora dela
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Lida com o envio do formulário para adicionar ou atualizar um parâmetro
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const docId = docIdInput.value;
    const campo = form.campo.value;
    const valor = form.valor.value;
    const descricao = form.descricao.value;

    try {
        if (docId) {
            // Se o ID existe, atualiza o documento
            const docRef = doc(db, 'parametros', docId);
            await updateDoc(docRef, { campo, valor, descricao });
            showNotification('Parâmetro atualizado com sucesso!');
        } else {
            // Se não, adiciona um novo documento
            await addDoc(collection(db, 'parametros'), {
                campo,
                valor,
                descricao,
                createdAt: new Date()
            });
            showNotification('Parâmetro adicionado com sucesso!');
        }
        closeModal();
    } catch (e) {
        console.error('Erro ao salvar o documento: ', e);
        showNotification('Erro ao salvar o parâmetro. Verifique o console.');
    }
});

// Lida com o clique na tabela para copiar ou editar
tableBody.addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    if (!row) return;
    
    const docId = row.dataset.docId;
    const param = allParams.find(p => p.id === docId);

    // Se clicou no botão de editar
    if (e.target.closest('.edit-btn')) {
        if (param) {
            openModal(param);
        }
    } else {
        // Se clicou na célula, copia o conteúdo
        const firstCell = e.target.closest('td');
        if (firstCell) {
            const textToCopy = firstCell.textContent;
            copyToClipboard(textToCopy);
        }
    }
});

// Adiciona listener para o campo de busca
searchBox.addEventListener('keyup', handleSearch);
