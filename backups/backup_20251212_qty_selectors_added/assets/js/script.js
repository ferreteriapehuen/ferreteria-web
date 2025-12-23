const products = [
    {
        id: 1,
        name: "Taladro Percutor Inalámbrico 18V",
        category: "herramientas",
        price: 89990,
        oldPrice: 120000,
        image: "assets/images/prod_taladro.jpg"
    },
    {
        id: 2,
        name: "Set de Herramientas 120 Piezas",
        category: "herramientas",
        price: 45990,
        oldPrice: null,
        image: "assets/images/prod_set.jpg"
    },
    {
        id: 3,
        name: "Pintura Latex Interior Blanco 1GL",
        category: "materiales",
        price: 15990,
        oldPrice: 22990,
        image: "assets/images/prod_pintura.jpg"
    },
    {
        id: 4,
        name: "Casco de Seguridad Industrial",
        category: "seguridad",
        price: 5990,
        oldPrice: null,
        image: "assets/images/prod_casco.png"
    },
    {
        id: 5,
        name: "Esmeril Angular 4 1/2'' 800W",
        category: "herramientas",
        price: 32990,
        oldPrice: 39990,
        image: "assets/images/prod_esmeril.jpg"
    },
    {
        id: 6,
        name: "Cemento Portland 25kg",
        category: "materiales",
        price: 4500,
        oldPrice: null,
        image: "assets/images/prod_cemento.png"
    },
    {
        id: 7,
        name: "Escalera de Aluminio Tijera 5 Peldaños",
        category: "herramientas",
        price: 34990,
        oldPrice: 42990,
        image: "assets/images/prod_escalera.png"
    },
    {
        id: 8,
        name: "Guantes de Seguridad Multiflex",
        category: "seguridad",
        price: 1990,
        oldPrice: null,
        image: "assets/images/prod_guantes.png"
    },
    {
        id: 103,
        name: "Arena Rubia (Metro Cúbico)",
        category: "aridos",
        price: 32000,
        oldPrice: 35000,
        image: "assets/images/prod_arena.png"
    },
    {
        id: 104,
        name: "Ripio 3/4 (Metro Cúbico)",
        category: "aridos",
        price: 34000,
        oldPrice: null,
        image: "assets/images/prod_ripio.jpg"
    },
    {
        id: 105,
        name: "Gravilla (Metro Cúbico)",
        category: "aridos",
        price: 36000,
        oldPrice: null,
        image: "assets/images/prod_gravilla.jpg"
    }
];

// State
let cart = [];

// DOM Elements
const productsContainer = document.getElementById('products-container');
const cartCountElement = document.getElementById('cart-count');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('search-input');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navList = document.getElementById('nav-list');
const navLinks = document.querySelectorAll('.nav-list a:not(#mobile-menu-btn)'); // Exclude toggle button

// Format Currency
const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price);
};

// Render Products
const renderProducts = (category = 'all', searchTerm = '') => {
    productsContainer.innerHTML = '';

    // Simulating loading state
    productsContainer.style.opacity = '0.5';

    setTimeout(() => {
        let filteredProducts = products;

        // Filter by Category
        if (category !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.category === category || (category === 'materiales' && p.category !== 'herramientas' && p.category !== 'aridos'));
        } else {
            // If 'all' (default view), exclude 'aridos' so they have their exclusive space
            filteredProducts = filteredProducts.filter(p => p.category !== 'aridos');
        }

        // Filter by Search Term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredProducts = filteredProducts.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.category.toLowerCase().includes(term)
            );
        }

        if (filteredProducts.length === 0) {
            productsContainer.innerHTML = '<div class="no-results"><p>No encontramos productos con esa descripción.</p></div>';
            productsContainer.style.opacity = '1';
            return;
        }

        filteredProducts.forEach(product => {
            const hasDiscount = product.oldPrice != null;
            const discountPercentage = hasDiscount
                ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
                : 0;

            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-image">
                    ${hasDiscount ? `<span class="discount-badge">-${discountPercentage}%</span>` : ''}
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <span class="product-cat">${product.category}</span>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">
                        <span class="current-price">${formatPrice(product.price)}</span>
                        ${hasDiscount ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ''}
                    </div>
                    
                    <div class="product-actions">
                        <div class="qty-selector">
                            <button class="qty-btn minus" onclick="adjustCardQty(this, -1)">-</button>
                            <input type="number" class="qty-input" value="1" min="1" readonly>
                            <button class="qty-btn plus" onclick="adjustCardQty(this, 1)">+</button>
                        </div>
                        <button class="btn btn-add" onclick="addToCart(${product.id}, this)">
                            <i class="fa-solid fa-cart-shopping"></i> Agregar
                        </button>
                    </div>
                </div>
            `;
            productsContainer.appendChild(card);
        });

        productsContainer.style.opacity = '1';
    }, 300); // Small delay for effect
};

// Add to Cart Function
window.addToCart = (id) => {
    const product = products.find(p => p.id === id);
    if (product) {
        cart.push(product);
        updateCartCount();

        // Visual feedback
        const btn = event.target.closest('.btn-add');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Agregado';
        btn.style.backgroundColor = 'var(--success)';

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.backgroundColor = '';
        }, 1500);
    }
};




// Event Listeners for Filters
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        filterButtons.forEach(b => b.classList.remove('active'));
        // Add active to clicked
        btn.classList.add('active');
        // Render
        renderProducts(btn.dataset.filter);
    });
});

// Search Functionality
searchInput.addEventListener('input', (e) => {
    const term = e.target.value;
    // Reset category buttons usually, but for now let's just search globally or within current? 
    // Let's Search Globally for simplicity
    renderProducts('all', term);

    // Update active state of buttons to 'Todos' if searching
    if (term.length > 0) {
        filterButtons.forEach(b => b.classList.remove('active'));
    }
});

// Mobile Menu Toggle
mobileMenuBtn.addEventListener('click', (e) => {
    e.preventDefault();
    navList.classList.toggle('show');
});

// Nav Links as Filters
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const text = link.textContent.toLowerCase().trim();

        // Map nav text to standard categories
        let category = 'all';
        if (text.includes('herramientas')) category = 'herramientas';
        else if (text.includes('materiales')) category = 'materiales';
        else if (text.includes('pinturas')) category = 'materiales'; // Mapped to materiales for demo
        else if (text.includes('seguridad')) category = 'seguridad';

        renderProducts(category);

        // Scroll to products
        const productsSection = document.getElementById('productos');
        productsSection.scrollIntoView({ behavior: 'smooth' });

        // Close mobile menu if open
        navList.classList.remove('show');
    });
});

// Render Áridos Products (for the dedicated section)
const renderAridosProducts = () => {
    const aridosContainer = document.getElementById('aridos-products-container');
    if (!aridosContainer) return;

    aridosContainer.innerHTML = '';
    aridosContainer.style.opacity = '0.5';

    setTimeout(() => {
        const aridosProducts = products.filter(p => p.category === 'aridos');

        aridosProducts.forEach(product => {
            const hasDiscount = product.oldPrice != null;
            const discountPercentage = hasDiscount
                ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
                : 0;

            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-image">
                    ${hasDiscount ? `<span class="discount-badge">-${discountPercentage}%</span>` : ''}
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <span class="product-cat">${product.category}</span>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">
                        <span class="current-price">${formatPrice(product.price)}</span>
                        ${hasDiscount ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ''}
                    </div>
                    <div class="product-actions">
                        <div class="qty-selector">
                            <button class="qty-btn minus" onclick="adjustCardQty(this, -1)">-</button>
                            <input type="number" class="qty-input" value="1" min="1" readonly>
                            <button class="qty-btn plus" onclick="adjustCardQty(this, 1)">+</button>
                        </div>
                        <button class="btn btn-add" onclick="addToCart(${product.id}, this)">
                            <i class="fa-solid fa-cart-shopping"></i> Agregar
                        </button>
                    </div>
                </div>
            `;
            aridosContainer.appendChild(card);
        });

        aridosContainer.style.opacity = '1';
    }, 300);
};

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    renderAridosProducts(); // Also render áridos section
});

/* Cart Logic */
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalAmount = document.getElementById('cart-total-amount');
const cartTrigger = document.querySelector('.cart-trigger'); // Trigger in header

// Toggle Cart
const toggleCart = () => {
    cartDrawer.classList.toggle('open');
    cartOverlay.classList.toggle('open');
};

// Open Cart
const openCart = () => {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
};

// Close Cart Events
closeCartBtn.addEventListener('click', toggleCart);
cartOverlay.addEventListener('click', toggleCart);
cartTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    toggleCart();
});

// Update renderCart
// Adjust Quantity on Product Card
window.adjustCardQty = (btn, delta) => {
    const input = btn.parentElement.querySelector('.qty-input');
    let val = parseInt(input.value) || 1;
    val += delta;
    if (val < 1) val = 1;
    input.value = val;
};

// Render Cart Items
const renderCartItems = () => {
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-msg">
                <i class="fa-solid fa-basket-shopping"></i>
                <p>Tu carro está vacío</p>
                <button class="btn btn-primary" onclick="toggleCart(); document.getElementById('productos').scrollIntoView({behavior: 'smooth'})">Ir a comprar</button>
            </div>
        `;
        cartTotalAmount.textContent = formatPrice(0);
        return;
    }

    let total = 0;

    cart.forEach(item => {
        total += item.price * item.qty;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="item-details">
                <h4>${item.name}</h4>
                <div class="cart-qty-controls">
                    <button class="mini-qty-btn" onclick="updateCartQty(${item.id}, ${item.qty - 1})"><i class="fa-solid fa-minus"></i></button>
                    <span class="cart-qty-display">${item.qty}</span>
                    <button class="mini-qty-btn" onclick="updateCartQty(${item.id}, ${item.qty + 1})"><i class="fa-solid fa-plus"></i></button>
                </div>
                <button class="remove-item" onclick="removeFromCart(${item.id})">Eliminar</button>
            </div>
            <div class="item-total">
                ${formatPrice(item.price * item.qty)}
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);
    });

    cartTotalAmount.textContent = formatPrice(total);
};

// Update Cart Quantity
window.updateCartQty = (id, newQty) => {
    if (newQty < 1) {
        // Optional: Ask to remove or just remove
        removeFromCart(id);
        return;
    }

    const item = cart.find(p => p.id === id);
    if (item) {
        item.qty = newQty;
        updateCartCount();
        renderCartItems();
    }
};

// Remove from Cart
window.removeFromCart = (id) => {
    const index = cart.findIndex(item => item.id === id);
    if (index > -1) {
        cart.splice(index, 1);
        updateCartCount();
        renderCartItems();
    }
};

// Add to Cart
window.addToCart = (id, btnElement) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    let qtyToAdd = 1;
    if (btnElement) {
        // Find the input in the same container
        // Traverse up to .product-actions or just sibling search
        const container = btnElement.closest('.product-actions');
        // Note: I will update HTML to have product-actions wrapper. 
        // If wrapper not there (old HTML), fallback to 1.
        if (container) {
            const input = container.querySelector('.qty-input');
            if (input) qtyToAdd = parseInt(input.value) || 1;
        }
    }

    // Check if exists
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.qty += qtyToAdd;
    } else {
        cart.push({ ...product, qty: qtyToAdd });
    }

    updateCartCount();
    renderCartItems();
    openCart();

    // Visual feedback
    if (btnElement) {
        const originalHTML = btnElement.innerHTML;
        btnElement.innerHTML = '<i class="fa-solid fa-check"></i>';
        btnElement.style.backgroundColor = 'var(--success)';
        setTimeout(() => {
            btnElement.innerHTML = originalHTML;
            btnElement.style.backgroundColor = '';
        }, 1500);
    }
};

const updateCartCount = () => {
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCountElement.textContent = totalCount;
    cartCountElement.classList.add('bump');
    setTimeout(() => cartCountElement.classList.remove('bump'), 300);
};

// Checkout via WhatsApp
const checkoutBtn = document.querySelector('.checkout-btn');

checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        alert('Tu carro está vacío. Agrega productos antes de comprar.');
        return;
    }

    const phoneNumber = "56978589090";
    let message = "Hola *Ferretería El Perro*, me gustaría realizar el siguiente pedido:\n\n";

    let total = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        message += `▪️ ${item.qty}x ${item.name} (${formatPrice(itemTotal)})\n`;
    });

    message += `\n*Total a pagar: ${formatPrice(total)}*`;
    message += "\n\nQuedo atento a la confirmación y detalles de pago/envío.";

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
});
