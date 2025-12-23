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
            filteredProducts = filteredProducts.filter(p => p.category === category || (category === 'materiales' && p.category !== 'herramientas'));
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
                    <button class="btn btn-add" onclick="addToCart(${product.id})">
                        <i class="fa-solid fa-cart-shopping"></i> Agregar
                    </button>
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

const updateCartCount = () => {
    cartCountElement.textContent = cart.length;

    // Animation
    cartCountElement.classList.add('bump');
    setTimeout(() => cartCountElement.classList.remove('bump'), 300);
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

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
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

    // Use a map to count quantities? Or just list them? 
    // Let's group duplicates for better UX
    const cartMap = new Map();
    cart.forEach(item => {
        if (cartMap.has(item.id)) {
            cartMap.get(item.id).qty += 1;
        } else {
            cartMap.set(item.id, { ...item, qty: 1 });
        }
    });

    cartMap.forEach(item => {
        total += item.price * item.qty;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="item-details">
                <h4>${item.name}</h4>
                <div class="item-price">${formatPrice(item.price)} x ${item.qty}</div>
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

// Remove from Cart
window.removeFromCart = (id) => {
    // Remove ONE instance of the item or ALL?
    // Let's remove one instance for now
    const index = cart.findIndex(item => item.id === id);
    if (index > -1) {
        cart.splice(index, 1);
        updateCartCount();
        renderCartItems();
    }
};

// Override original addToCart to include opening/rendering
const originalAddToCart = window.addToCart;
window.addToCart = (id) => {
    const product = products.find(p => p.id === id);
    if (product) {
        cart.push(product);
        updateCartCount();
        renderCartItems();
        openCart(); // Auto open cart when adding

        // Visual feedback on button (optional, keeping original behavior too)
    }
};

// Checkout via WhatsApp
const checkoutBtn = document.querySelector('.checkout-btn');

checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        alert('Tu carro está vacío. Agrega productos antes de comprar.');
        return;
    }

    // NÚMERO DE LA FERRETERÍA - ¡CAMBIAR AQUÍ!
    const phoneNumber = "56978589090";

    let message = "Hola *Ferretería El Perro*, me gustaría realizar el siguiente pedido:\n\n";

    // Group items for the message
    const cartMap = new Map();
    cart.forEach(item => {
        if (cartMap.has(item.id)) {
            cartMap.get(item.id).qty += 1;
        } else {
            cartMap.set(item.id, { ...item, qty: 1 });
        }
    });

    let total = 0;
    cartMap.forEach(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        message += `▪️ ${item.qty}x ${item.name} (${formatPrice(itemTotal)})\n`;
    });

    message += `\n*Total a pagar: ${formatPrice(total)}*`;
    message += "\n\nQuedo atento a la confirmación y detalles de pago/envío.";

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
});
