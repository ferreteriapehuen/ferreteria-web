/* Admin JS Logic */
import { db, collection, getDocs, doc, updateDoc, onSnapshot, setDoc, deleteDoc, query, orderBy, where } from './firebase-config.js';

// State
let products = [];
let cart = []; // Local cart for POS
let movementsHistory = [];
let admins = [];

const STORAGE_PREFIX = 'pehuen_';

// Initial Data Load (Real-time listener for Products)
const productsCol = collection(db, 'products');
onSnapshot(productsCol, (snapshot) => {
    products = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    console.log("Productos actualizados desde Firebase:", products.length);
    // If we are in the Inventory tab, re-render
    if (document.getElementById('inventory').classList.contains('active')) {
        renderInventory();
    }
});

// Load Admins
const adminsCol = collection(db, 'admins');
onSnapshot(adminsCol, (snapshot) => {
    admins = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    console.log("Admins loaded from Firebase:", admins);
    populateUserSelect();

    if (document.getElementById('users').classList.contains('active')) {
        renderAdminUsers();
    }
}, (error) => {
    console.error("Error getting admins:", error);
    alert("Error cargando usuarios: " + error.message);
});

// Load Movements (Ordered by date desc ideally)
const movementsCol = collection(db, 'movements');
const movementsQuery = query(movementsCol, orderBy('id', 'desc')); // Assuming 'id' is timestamp-like or valid for sorting
onSnapshot(movementsQuery, (snapshot) => {
    movementsHistory = snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id }));
    if (document.getElementById('movements').classList.contains('active')) {
        renderMovementsHistory();
    }
});


// DOM Elements
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('admin-login-form');
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const logoutBtn = document.getElementById('logout-btn');

const posInput = document.getElementById('barcode-input');
const posTicketItems = document.getElementById('pos-ticket-items');
const posTotalAmount = document.getElementById('pos-total-amount');
const posCheckoutBtn = document.getElementById('pos-checkout-btn');
const posSearchResults = document.getElementById('pos-search-results');

const invSearch = document.getElementById('inv-search');
const invFilter = document.getElementById('inv-filter');
const invBody = document.getElementById('inventory-body');

// Login Check
const checkAuth = () => {
    const isAuth = sessionStorage.getItem(STORAGE_PREFIX + 'admin_auth');
    if (isAuth) {
        loginModal.classList.remove('open');
        posInput.focus();

        // Update seller name in POS
        const currentUser = JSON.parse(sessionStorage.getItem(STORAGE_PREFIX + 'current_admin'));
        if (currentUser) {
            document.querySelector('.sidebar-header p').textContent = `Hola, ${currentUser.name}`;
        }
    } else {
        loginModal.classList.add('open');
    }
};

const populateUserSelect = () => {
    const select = document.getElementById('admin-user-select');
    console.log("Populating User Select. Admins found:", admins.length);
    if (!select) {
        console.error("Select element 'admin-user-select' not found!");
        return;
    }
    select.innerHTML = '<option value="" disabled selected>Seleccione Usuario</option>';

    const activeAdmins = admins.filter(u => u.status === 'active');
    console.log("Active admins:", activeAdmins);

    activeAdmins.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.name} (${user.role ? user.role.toUpperCase() : 'ADMIN'})`;
        select.appendChild(option);
    });
};

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const userId = document.getElementById('admin-user-select').value; // Usually the ID or doc ID
    const password = document.getElementById('admin-password').value;

    // Find user by the selected ID (which matches doc.id or the id field)
    // Note: admins array is now populated from Firestore
    const user = admins.find(a => a.id === userId && a.password === password);

    if (user) {
        if (user.status === 'inactive') return alert('Usuario desactivado. Contacte al administrador.');

        sessionStorage.setItem(STORAGE_PREFIX + 'admin_auth', 'true');
        sessionStorage.setItem(STORAGE_PREFIX + 'current_admin', JSON.stringify(user));
        checkAuth();
    } else {
        alert('Contraseña incorrecta');
    }
});

logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem(STORAGE_PREFIX + 'admin_auth');
    sessionStorage.removeItem(STORAGE_PREFIX + 'current_admin');
    window.location.reload();
});


// Tab Switching
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        if (!item.dataset.tab) return;
        e.preventDefault();

        // UI
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        tabContents.forEach(t => t.classList.remove('active'));
        document.getElementById(item.dataset.tab).classList.add('active');

        // Logic
        if (item.dataset.tab === 'inventory') renderInventory();
        if (item.dataset.tab === 'movements') renderMovementsHistory();
        if (item.dataset.tab === 'users') renderAdminUsers();
        if (item.dataset.tab === 'pos') posInput.focus();
    });
});


/* --- POS Module --- */

const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price);
};

// Add to Cart Logic
const addToPosCart = (term) => {
    // Try find by ID first, then loose match by name
    let product = products.find(p => p.id == term);

    if (!product) {
        // Simple predictive search if not ID
        const termLower = term.toLowerCase();
        product = products.find(p => p.name.toLowerCase().includes(termLower));
    }

    if (product) {
        // Check stock
        if (product.stock <= 0) {
            alert('Producto sin stock!');
            return;
        }

        const existingItem = cart.find(i => i.id === product.id);
        if (existingItem) {
            if (existingItem.qty < product.stock) {
                existingItem.qty++;
            } else {
                alert('No hay suficiente stock');
            }
        } else {
            cart.push({ ...product, qty: 1 });
        }
        renderPosCart();
        posInput.value = '';
        posSearchResults.classList.remove('active');
    } else {
        alert('Producto no encontrado');
    }
};

// Render POS Cart
const renderPosCart = () => {
    posTicketItems.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const subtotal = item.price * item.qty;
        total += subtotal;

        const row = document.createElement('div');
        row.className = 'ticket-item';
        row.innerHTML = `
            <h4>${item.name}</h4>
            <input type="number" class="pos-qty-input" value="${item.qty}" min="1" onchange="updatePosQty('${item.id}', this)">
            <span>${formatPrice(subtotal)}</span>
            <button class="btn-remove-item" onclick="removePosItem('${item.id}')"><i class="fa-solid fa-trash"></i></button>
        `;
        posTicketItems.appendChild(row);
    });

    posTotalAmount.textContent = formatPrice(total);
    posTicketItems.scrollTop = posTicketItems.scrollHeight; // Auto scroll to bottom
};

// Update Qty
window.updatePosQty = (id, input) => {
    const newQty = parseInt(input.value);
    const item = cart.find(i => i.id == id);
    const product = products.find(p => p.id == id);

    if (item && product) {
        if (newQty > 0 && newQty <= product.stock) {
            item.qty = newQty;
            renderPosCart();
        } else {
            alert(`Stock insuficiente (Max: ${product.stock}) o cantidad inválida`);
            input.value = item.qty;
        }
    }
};

// Remove Item
window.removePosItem = (id) => {
    cart = cart.filter(i => i.id != id);
    renderPosCart();
    posInput.focus(); // Return focus
};

// Scanner Input
posInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const val = posInput.value.trim();
        if (val) addToPosCart(val);
    }
});

posInput.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase().trim();
    if (val.length < 2) {
        posSearchResults.classList.remove('active');
        return;
    }

    const matches = products.filter(p =>
        p.name.toLowerCase().includes(val) ||
        p.id.toString().includes(val)
    ).slice(0, 5); // Limit to 5 results

    if (matches.length > 0) {
        posSearchResults.innerHTML = '';
        matches.forEach(p => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.innerHTML = `
                <div class="info">
                    <div class="name">${p.name}</div>
                    <div class="stock-info">Stock: ${p.stock} | ID: ${p.id}</div>
                </div>
                <div class="price">${formatPrice(p.price)}</div>
            `;
            div.addEventListener('click', () => {
                addToPosCart(p.id);
                posInput.focus();
            });
            posSearchResults.appendChild(div);
        });
        posSearchResults.classList.add('active');
    } else {
        posSearchResults.classList.remove('active');
    }
});

// Close search if clicking outside
document.addEventListener('click', (e) => {
    if (!posInput.contains(e.target) && !posSearchResults.contains(e.target)) {
        posSearchResults.classList.remove('active');
    }
});

// Checkout
posCheckoutBtn.addEventListener('click', () => {
    if (cart.length === 0) return alert('Por favor, agregue productos al carro.');

    // Validate Invoice Data if selected
    if (currentDocType === 'factura') {
        const rut = document.getElementById('cli-rut').value;
        const name = document.getElementById('cli-name').value;
        if (!rut || !name) {
            alert("Para emitir una Factura, el RUT y la Razón Social son obligatorios.");
            return;
        }
    }

    // Deduct stock in Firebase
    cart.forEach(async (item) => {
        // item.id is the document ID in Firestore (or we use a query if IDs are custom numbers)
        // With the current setup, we kept `id` inside the document. 
        // We need to properly reference the document.
        // Assuming products are mapped with `id` being the Firestore doc ID for simplicity, 
        // OR we filter the `products` array to find the document ID if they are different.

        // In the initial load, we did: products = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        // So item.id IS the Firestore Document ID.

        const productRef = doc(db, 'products', item.id);
        const newStock = item.stock - item.qty;

        try {
            await updateDoc(productRef, { stock: newStock });
        } catch (error) {
            console.error("Error updating stock for", item.name, error);
            alert("Error actualizando stock. Revise consola.");
        }
    });

    // Save locally just in case? No, Firestore is the source of truth.

    // Simulate SII API Service Call
    console.log("Enviando datos al SII...");
    generateDTE();
});

// Keyboard Shortcut for Checkout (F12)
document.addEventListener('keydown', (e) => {
    if (e.key === 'F12') {
        e.preventDefault();
        posCheckoutBtn.click();
    }
});

/* --- DTE & Document Module (SII Chile) --- */
let currentDocType = 'boleta';

window.setDocType = (type) => {
    currentDocType = type;

    // Update UI toggle buttons
    document.querySelectorAll('.doc-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(type)) {
            btn.classList.add('active');
        }
    });

    const invForm = document.getElementById('invoice-form');
    if (type === 'factura') {
        invForm.style.display = 'block';
    } else {
        invForm.style.display = 'none';
    }
};

window.formatRut = (input) => {
    let rut = input.value.replace(/[^0-9kK]/g, '');
    if (rut.length > 1) {
        const body = rut.slice(0, -1);
        const dv = rut.slice(-1).toUpperCase();
        input.value = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + '-' + dv;
    }
};

const dteModal = document.getElementById('dte-modal');

const generateDTE = () => {
    // Totals calculation
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const dteNumber = Math.floor(Math.random() * 900000) + 100000; // Simulated Folio

    // Update DTE Visualization Content
    document.getElementById('dte-title').textContent = currentDocType === 'factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA ELECTRÓNICA';
    document.getElementById('dte-number').textContent = 'Nº FOLIO: ' + dteNumber;
    document.getElementById('dte-total').textContent = formatPrice(total);

    // Client Info Section (for Facturas)
    const clientInfoDiv = document.getElementById('dte-client-info');
    if (currentDocType === 'factura') {
        const rut = document.getElementById('cli-rut').value;
        const name = document.getElementById('cli-name').value;
        const address = document.getElementById('cli-address').value || 'SANTIAGO, CHILE';
        const giro = document.getElementById('cli-giro').value || 'COMERCIO AL POR MENOR';

        clientInfoDiv.innerHTML = `
            <div style="text-align: left; margin: 10px 0; font-size: 0.8rem;">
                <p><strong>RUT:</strong> ${rut}</p>
                <p><strong>RAZÓN SOCIAL:</strong> ${name.toUpperCase()}</p>
                <p><strong>GIRO:</strong> ${giro.toUpperCase()}</p>
                <p><strong>DIRECCIÓN:</strong> ${address.toUpperCase()}</p>
            </div>
        `;
        clientInfoDiv.style.display = 'block';
    } else {
        clientInfoDiv.style.display = 'none';
    }

    // Detail Rows
    const dteItemsDiv = document.getElementById('dte-items');
    dteItemsDiv.innerHTML = '';
    cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'dte-item-row';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.fontSize = '0.8rem';
        row.innerHTML = `
            <span>${item.qty} x ${item.name.substring(0, 20)}</span>
            <span>${formatPrice(item.price * item.qty)}</span>
        `;
        dteItemsDiv.appendChild(row);
    });

    // Show the visual receipt
    dteModal.classList.add('open');

    // Record into History
    const currentUser = JSON.parse(sessionStorage.getItem(STORAGE_PREFIX + 'current_admin')) || { name: 'Admin Principal' };
    recordMovement({
        type: 'sale',
        docType: currentDocType,
        folio: dteNumber,
        items: cart.map(i => `${i.qty}x ${i.name}`),
        total: total,
        seller: currentUser.name
    });
};

const recordMovement = async (data) => {
    const entry = {
        id: Date.now(), // timestamp for sorting
        productId: data.productId || null,
        date: new Date().toLocaleString(),
        type: data.type, // 'sale' or 'entry'
        docType: data.docType || 'INGRESO',
        folio: data.folio || '---',
        items: data.items || [],
        total: data.total || 0,
        seller: data.seller || "Sistema",
        justification: data.justification || ''
    };

    try {
        await setDoc(doc(db, 'movements', entry.id.toString()), entry);
    } catch (e) {
        console.error("Error adding movement: ", e);
    }
};

window.openHistory = (productId) => {
    const product = products.find(p => p.id == productId);
    if (!product) return;

    document.getElementById('history-modal-title').textContent = `Historial: ${product.name}`;
    const historyBody = document.getElementById('history-table-body');
    historyBody.innerHTML = '';

    const history = movementsHistory.filter(m =>
        m.productId === productId ||
        (m.items && m.items.some(item => item.includes(product.name)))
    );

    if (history.length === 0) {
        historyBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay movimientos registrados para este producto.</td></tr>';
    } else {
        history.forEach(m => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${m.date}</td>
                <td><span class="badge ${m.type === 'entry' ? 'ingreso' : m.docType}">${m.docType.toUpperCase()}</span></td>
                <td>${m.folio}</td>
                <td>${m.justification || (m.items ? m.items.join(', ') : '---')}</td>
                <td>${m.type === 'entry' ? '+' : '-'}${m.items ? parseInt(m.items[0]) || '' : ''}</td>
                <td>${m.seller}</td>
            `;
            historyBody.appendChild(row);
        });
    }

    document.getElementById('history-modal').classList.add('open');
};

const closeHistoryModal = document.getElementById('close-history-modal');
if (closeHistoryModal) {
    closeHistoryModal.addEventListener('click', () => {
        document.getElementById('history-modal').classList.remove('open');
    });
}

window.closeDteModal = () => {
    dteModal.classList.remove('open');
    cart = [];
    renderPosCart();
    posInput.focus();

    // Reset inputs
    document.getElementById('cli-rut').value = '';
    document.getElementById('cli-name').value = '';
    document.getElementById('cli-giro').value = '';
    document.getElementById('cli-address').value = '';
    setDocType('boleta');
};


/* --- Inventory Module --- */

const renderInventory = () => {
    const searchTerm = invSearch.value.toLowerCase();
    const filterCat = invFilter.value;

    let filtered = products;

    if (filterCat !== 'all') {
        filtered = filtered.filter(p => p.category === filterCat);
    }

    if (searchTerm) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm) || p.id.toString().includes(searchTerm));
    }

    invBody.innerHTML = '';

    filtered.forEach(p => {
        const row = document.createElement('tr');
        if (p.stock <= 5) row.classList.add('stock-low'); // Red highlight

        row.innerHTML = `
            <td>${p.id}</td>
            <td>${p.name}</td>
            <td>${p.category}</td>
            <td>${formatPrice(p.price)}</td>
            <td style="${p.stock <= 5 ? 'color: var(--admin-danger); font-weight: bold;' : ''}">${p.stock}</td>
            <td>
                <button class="btn-action btn-history" onclick="openHistory('${p.id}')" title="Ver Historial" style="background-color: #607D8B; color: white;">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                </button>
            </td>
            <td>
                <button class="btn-action btn-edit" onclick="editStock('${p.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-action btn-delete" onclick="deleteProduct('${p.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        invBody.appendChild(row);
    });
};

window.editStock = async (id) => {
    const product = products.find(p => p.id == id);
    if (!product) return;

    const newStock = prompt(`Editar Stock para: ${product.name}\nActual: ${product.stock}`, product.stock);
    if (newStock !== null) {
        const stockInt = parseInt(newStock);
        if (!isNaN(stockInt) && stockInt >= 0) {
            const diff = stockInt - product.stock;
            if (diff !== 0) {
                // Update Firestore
                try {
                    const productRef = doc(db, 'products', id);
                    await updateDoc(productRef, { stock: stockInt });

                    // Record Movement
                    recordMovement({
                        productId: id,
                        type: 'entry',
                        docType: diff > 0 ? 'INGRESO' : 'AJUSTE',
                        items: [`${Math.abs(diff)}x ${product.name} (${diff > 0 ? 'Aumento' : 'Baja'})`],
                        total: 0,
                        seller: "Admin (Manual)"
                    });
                } catch (e) {
                    console.error("Error actualizando stock:", e);
                    alert("Error al actualizar stock.");
                }
            }
        } else {
            alert('Valor inválido');
        }
    }
};

invSearch.addEventListener('input', renderInventory);
invFilter.addEventListener('change', renderInventory);

/* --- Stock Management Module --- */
const btnManageStock = document.getElementById('btn-manage-stock');
const stockModal = document.getElementById('stock-modal');
const closeStockModal = document.getElementById('close-stock-modal');
const stockForm = document.getElementById('stock-form');
const stockProductSelect = document.getElementById('stock-product-select');
const stockCurrentDisplay = document.getElementById('stock-current-display');
const stockTypeSelect = document.getElementById('stock-type-select');
const stockDocGroup = document.getElementById('stock-doc-group');
const stockJustificationGroup = document.getElementById('stock-justification-group');

if (btnManageStock) {
    btnManageStock.addEventListener('click', () => {
        // Populate Select
        stockProductSelect.innerHTML = '<option value="" disabled selected>Seleccione Producto</option>';
        products.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = `${p.name} (Actual: ${p.stock})`;
            stockProductSelect.appendChild(option);
        });

        // Reset Form
        stockForm.reset();
        stockCurrentDisplay.textContent = '-';
        stockDocGroup.style.display = 'block';
        stockJustificationGroup.style.display = 'none';

        stockModal.classList.add('open');
    });
}

if (closeStockModal) {
    closeStockModal.addEventListener('click', () => {
        stockModal.classList.remove('open');
    });
}

if (stockProductSelect) {
    stockProductSelect.addEventListener('change', (e) => {
        const id = parseInt(e.target.value);
        const product = products.find(p => p.id === id);
        if (product) {
            stockCurrentDisplay.textContent = product.stock;
        }
    });
}

if (stockTypeSelect) {
    stockTypeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'entry') {
            stockDocGroup.style.display = 'block';
            stockJustificationGroup.style.display = 'none';
        } else {
            stockDocGroup.style.display = 'none';
            stockJustificationGroup.style.display = 'block';
        }
    });
}

if (stockForm) {
    stockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const productId = parseInt(stockProductSelect.value);
        const type = stockTypeSelect.value;
        const qty = parseInt(document.getElementById('stock-qty').value);
        const doc = document.getElementById('stock-doc').value;
        const justification = document.getElementById('stock-justification').value;

        const product = products.find(p => p.id === productId);
        if (!product) return alert('Producto no seleccionado');

        if (type === 'exit' && product.stock < qty) {
            return alert('Error: No hay suficiente stock para realizar la salida.');
        }

        const currentUser = JSON.parse(sessionStorage.getItem(STORAGE_PREFIX + 'current_admin')) || { name: 'Admin' };

        // Update Stock
        const productRef = doc(db, 'products', productId.toString()); // Assuming ID is string in our local list from Firestore map
        const newStock = (type === 'entry') ? (product.stock + qty) : (product.stock - qty);

        try {
            updateDoc(productRef, { stock: newStock });

            // Record
            recordMovement({
                productId: productId,
                type: type,
                docType: type === 'entry' ? 'INGRESO' : 'AJUSTE',
                folio: doc || '---',
                items: [`${qty}x ${product.name}`],
                total: 0,
                seller: currentUser.name,
                justification: justification || (type === 'entry' ? `Ingreso vía documento ${doc}` : `Ajuste manual: ${justification}`)
            });

            alert('Movimiento registrado con éxito');
            stockModal.classList.remove('open');
            // renderInventory is auto-called by onSnapshot
        } catch (e) {
            console.error("Error managing stock:", e);
            alert("Error al gestionar stock");
        }
        stockModal.classList.remove('open');
        renderInventory();
    });
}

/* --- Product Entry Module --- */
const btnAddProduct = document.getElementById('btn-add-product');
const addProductModal = document.getElementById('add-product-modal');
const closeAddModal = document.getElementById('close-add-modal');
const addProductForm = document.getElementById('add-product-form');

if (btnAddProduct) {
    btnAddProduct.addEventListener('click', () => {
        addProductModal.classList.add('open');
    });
}

if (closeAddModal) {
    closeAddModal.addEventListener('click', () => {
        addProductModal.classList.remove('open');
    });
}

// Global variable for multiple images storage (base64)
let uploadedImagesList = [];

// Helper to render previews
const renderImagePreviews = () => {
    const container = document.getElementById('image-preview-container');
    if (!container) return;

    container.innerHTML = '';

    if (uploadedImagesList.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';

    uploadedImagesList.forEach((base64, index) => {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';

        const img = document.createElement('img');
        img.src = base64;
        img.style.width = '80px';
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '4px';
        img.style.border = '1px solid #ccc';

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '×';
        deleteBtn.style.position = 'absolute';
        deleteBtn.style.top = '-5px';
        deleteBtn.style.right = '-5px';
        deleteBtn.style.background = 'red';
        deleteBtn.style.color = 'white';
        deleteBtn.style.border = 'none';
        deleteBtn.style.borderRadius = '50%';
        deleteBtn.style.width = '20px';
        deleteBtn.style.height = '20px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.type = 'button';

        deleteBtn.onclick = () => {
            uploadedImagesList.splice(index, 1);
            renderImagePreviews();
        };

        wrapper.appendChild(img);
        wrapper.appendChild(deleteBtn);
        container.appendChild(wrapper);
    });
};

if (addProductForm) {
    const fileInput = document.getElementById('new-prod-image-file');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    uploadedImagesList.push(event.target.result);
                    renderImagePreviews();
                };
                reader.readAsDataURL(file);
            });
            fileInput.value = ''; // Reset to allow same file selection
        });
    }

    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('new-prod-name').value;
        const category = document.getElementById('new-prod-category').value;
        const price = parseInt(document.getElementById('new-prod-price').value);
        const stock = parseInt(document.getElementById('new-prod-stock').value);
        let idInput = document.getElementById('new-prod-id').value;
        const imageUrl = document.getElementById('new-prod-image').value;
        const docRef = document.getElementById('new-prod-doc').value;

        let finalImages = [...uploadedImagesList];
        if (imageUrl) finalImages.push(imageUrl);
        if (finalImages.length === 0) finalImages.push('assets/images/prod_set.jpg');

        if (!name || isNaN(price) || isNaN(stock)) {
            alert("Por favor complete todos los campos requeridos correctamente.");
            return;
        }

        // Generate ID or use provided
        // With Firestore, we can use the provided ID as the Doc ID.
        // It's safer to use a string ID for Firestore documents.

        let newId;
        if (idInput) {
            if (products.some(p => p.id === idInput)) {
                alert("El ID ya existe. Por favor elija otro.");
                return;
            }
            newId = idInput.toString();
        } else {
            // Find max numeric ID if possible, or just generate a timestamp one to simple usage
            // Since the user might rely on short IDs for barcode, let's try to mimic the old auto-increment behavior based on existing products
            // Filter for numeric-looking IDs
            const maxId = products.reduce((max, p) => {
                const numId = parseInt(p.id);
                return (!isNaN(numId) && numId > max) ? numId : max;
            }, 1000); // Start high to avoid conflicts with static data
            newId = (maxId + 1).toString();
        }

        const newProduct = {
            id: newId,  // Campo id necesario
            name: name,
            category: category,
            price: price,
            oldPrice: null,
            image: finalImages[0],
            images: finalImages,
            stock: stock,
            document: docRef || '---'
        };

        try {
            await setDoc(doc(db, 'products', newId), newProduct);

            recordMovement({
                productId: newId,
                type: 'entry',
                docType: 'NUEVO',
                items: [`Ingreso inicial: ${stock}x ${name}`],
                total: 0,
                seller: "Admin",
                folio: docRef || '---'
            });

            alert(`Producto "${name}" agregado correctamente!`);
            addProductForm.reset();
            uploadedImagesList = [];
            renderImagePreviews();
            addProductModal.classList.remove('open');
        } catch (e) {
            console.error("Error adding product:", e);
            alert("Error al guardar producto.");
        }
    });
}


/* --- Movements & Reports Module --- */
const movementsBody = document.getElementById('movements-body');
const btnDailyReport = document.getElementById('btn-daily-report');

const renderMovementsHistory = () => {
    movementsBody.innerHTML = '';

    movementsHistory.forEach(m => {
        const row = document.createElement('tr');
        const badgeClass = m.type === 'entry' ? 'ingreso' : m.docType;

        row.innerHTML = `
            <td>${m.date}</td>
            <td>${m.folio}</td>
            <td><span class="badge ${badgeClass}">${m.docType.toUpperCase()}</span></td>
            <td><small>${m.items.join(', ').substring(0, 50)}${m.items.join(', ').length > 50 ? '...' : ''}</small></td>
            <td><strong class="${m.type === 'sale' ? 'text-success' : 'text-neutral'}">${m.total > 0 ? formatPrice(m.total) : '---'}</strong></td>
            <td>${m.seller}</td>
        `;
        movementsBody.appendChild(row);
    });
};

if (btnDailyReport) {
    btnDailyReport.addEventListener('click', () => {
        const today = new Date().toLocaleDateString();
        const todaysMovements = movementsHistory.filter(m => new Date(m.date).toLocaleDateString() === today);

        const sales = todaysMovements.filter(m => m.type === 'sale');
        const totalSales = sales.reduce((sum, s) => sum + s.total, 0);

        const entries = todaysMovements.filter(m => m.type === 'entry');
        const totalEntries = entries.length;

        alert(`--- REPORTE GENERAL (${today}) ---\n\n` +
            `VENTAS:\n` +
            `- Total Recaudado: ${formatPrice(totalSales)}\n` +
            `- Documentos: ${sales.length}\n\n` +
            `INVENTARIO:\n` +
            `- Movimientos de Ingreso: ${totalEntries}\n\n` +
            `¡Resumen actualizado!`);
    });
}

/* --- Users Module --- */
const btnAddUser = document.getElementById('btn-add-user');
const userModal = document.getElementById('user-modal');
const closeUserModalBtn = document.getElementById('close-user-modal');
const userForm = document.getElementById('user-form');
const usersBody = document.getElementById('users-body');

if (btnAddUser) {
    btnAddUser.addEventListener('click', () => {
        document.getElementById('user-modal-title').textContent = 'Nuevo Usuario';
        userForm.reset();
        document.getElementById('user-idx').value = '';
        userModal.classList.add('open');
    });
}

if (closeUserModalBtn) {
    closeUserModalBtn.addEventListener('click', () => {
        userModal.classList.remove('open');
    });
}

const renderAdminUsers = () => {
    if (!usersBody) return;
    usersBody.innerHTML = '';
    admins.forEach((user, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email || user.username}</td>
            <td><span class="badge ${user.role}">${user.role.toUpperCase()}</span></td>
            <td><span class="badge ${user.status}">${user.status.toUpperCase()}</span></td>
            <td>
                <button class="btn-action btn-edit" title="Editar" onclick="editUser(${user.id})"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="btn-action btn-edit" title="Cambiar Estado" onclick="toggleUserStatus(${user.id})"><i class="fa-solid fa-${user.status === 'active' ? 'user-slash' : 'user-check'}"></i></button>
                ${user.id !== 1 ? `<button class="btn-action btn-delete" title="Eliminar" onclick="deleteUser(${user.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
            </td>
        `;
        usersBody.appendChild(row);
    });
};

if (userForm) {
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullname = document.getElementById('user-fullname').value;
        const email = document.getElementById('user-email').value;
        const password = document.getElementById('user-password').value;
        const role = document.getElementById('user-role').value;
        const userId = document.getElementById('user-idx').value;

        try {
            if (userId) {
                // Edit
                const userRef = doc(db, 'admins', userId);
                await updateDoc(userRef, {
                    name: fullname,
                    email: email,
                    password: password,
                    role: role
                });
            } else {
                // New
                const newUserId = Date.now().toString();
                const newUser = {
                    name: fullname,
                    username: email.split('@')[0],
                    email: email,
                    password: password,
                    role: role,
                    status: 'active'
                };
                await setDoc(doc(db, 'admins', newUserId), newUser);
            }
            alert('Usuario guardado con éxito');
            userModal.classList.remove('open');
        } catch (e) {
            console.error("Error saving user:", e);
            alert("Error al guardar usuario");
        }
    });
}

window.editUser = (id) => {
    const user = admins.find(a => a.id === id);
    if (!user) return;

    document.getElementById('user-modal-title').textContent = 'Editar Usuario';
    document.getElementById('user-fullname').value = user.name;
    document.getElementById('user-email').value = user.email || user.username;
    document.getElementById('user-password').value = user.password;
    document.getElementById('user-role').value = user.role;
    document.getElementById('user-idx').value = user.id;

    userModal.classList.add('open');
};

window.toggleUserStatus = async (id) => {
    // Note: id passed here is string because it comes from doc ID map
    if (id === 1 || id === '1') return alert('No se puede desactivar al administrador principal.');
    const user = admins.find(a => a.id === id);
    if (user) {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        try {
            const userRef = doc(db, 'admins', id);
            await updateDoc(userRef, { status: newStatus });
        } catch (e) {
            console.error(e);
            alert("Error al cambiar estado");
        }
    }
};

window.deleteUser = async (id) => {
    // Check if it is the admin created by default (id 1 or '1'). In Firestore it might be a generated ID.
    // If the user's role is 'admin' and it's the only one, blocking might be complex.
    // We already check for ID '1' legacy
    if (id === 1 || id === '1') return alert('No se puede eliminar al administrador principal.');

    if (confirm('¿Estás seguro de eliminar este usuario?')) {
        try {
            await deleteDoc(doc(db, 'admins', id));
            alert('Usuario eliminado');
        } catch (e) {
            console.error("Error deleting user:", e);
            alert("Error al eliminar usuario.");
        }
    }
};

// Init
checkAuth();
populateUserSelect();
renderPosCart();

// Función para eliminar productos del inventario
window.deleteProduct = async (id) => {
    const product = products.find(p => p.id == id);
    if (!product) {
        alert('Producto no encontrado');
        return;
    }

    if (!confirm(`¿Estás seguro de eliminar "${product.name}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }

    try {
        await deleteDoc(doc(db, 'products', id.toString()));
        
        // Registrar movimiento
        const currentUser = JSON.parse(sessionStorage.getItem(STORAGE_PREFIX + 'current_admin')) || { name: 'Admin' };
        await recordMovement({
            productId: id,
            type: 'entry',
            docType: 'ELIMINADO',
            items: [`Producto eliminado: ${product.name}`],
            total: 0,
            seller: currentUser.name,
            justification: 'Eliminación de producto del inventario'
        });

        alert(`Producto "${product.name}" eliminado correctamente`);
        // No necesitamos renderizar manualmente, el onSnapshot lo hará automáticamente
    } catch (e) {
        console.error('Error eliminando producto:', e);
        alert('Error al eliminar el producto: ' + e.message);
    }
};
