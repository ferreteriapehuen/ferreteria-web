// CORRECCIONES PARA FUNCIONES DEL POS

// Render POS Cart - VERSIÓN CORREGIDA
const renderPosCart = () => {
    posTicketItems.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const subtotal = item.price * item.qty;
        total += subtotal;

        const row = document.createElement('div');
        row.className = 'ticket-item';
        // FIX: Usar comillas en el ID para evitar problemas
        row.innerHTML = `
            <h4>${item.name}</h4>
            <input type="number" class="pos-qty-input" value="${item.qty}" min="1" onchange="updatePosQty('${item.id}', this)">
            <span>${formatPrice(subtotal)}</span>
            <button class="btn-remove-item" onclick="removePosItem('${item.id}')"><i class="fa-solid fa-trash"></i></button>
        `;
        posTicketItems.appendChild(row);
    });

    posTotalAmount.textContent = formatPrice(total);
    posTicketItems.scrollTop = posTicketItems.scrollHeight;
};

// Update Qty - VERSIÓN CORREGIDA
window.updatePosQty = (id, input) => {
    const newQty = parseInt(input.value);
    // FIX: Comparación flexible para manejar string y number
    const item = cart.find(i => i.id == id);
    const product = products.find(p => p.id == id);

    console.log('updatePosQty llamado:', { id, newQty, item, product });

    if (item && product) {
        if (newQty > 0 && newQty <= product.stock) {
            item.qty = newQty;
            renderPosCart();
        } else {
            alert(`Stock insuficiente (Max: ${product.stock}) o cantidad inválida`);
            input.value = item.qty;
        }
    } else {
        console.error('No se encontró item o producto:', { id, item, product });
    }
};

// Remove Item - VERSIÓN CORREGIDA
window.removePosItem = (id) => {
    console.log('removePosItem llamado:', id);
    // FIX: Comparación flexible
    cart = cart.filter(i => i.id != id);
    renderPosCart();
    posInput.focus();
};
