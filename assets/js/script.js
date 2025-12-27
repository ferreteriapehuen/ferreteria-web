import { db, collection, onSnapshot, query } from './firebase-config.js';

// State
let products = [];
let cart = JSON.parse(localStorage.getItem('pehuen_cart')) || [];

// Initial Data Load (Real-time listener for Products)
const productsCol = collection(db, 'products');

// Listen for updates
onSnapshot(productsCol, (snapshot) => {
    products = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    // Initial Render
    // Check for URL params to see if we need to search immediately
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    const catParam = urlParams.get('cat');

    if (searchParam && productsContainer) {
        if (searchInput) searchInput.value = searchParam;
        renderProducts('all', searchParam);
    } else if (catParam && productsContainer) {
        renderProducts(catParam);
        const btn = Array.from(filterButtons).find(b => b.dataset.filter === catParam);
        if (btn) {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        // Scroll to products on load if category is present
        setTimeout(() => {
            const productsSection = document.getElementById('productos');
            if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth' });
        }, 500);
    } else {
        renderProducts();
    }

    renderAridosProducts();
    initHeroSlider();
});

/* Hero Slider Logic */
const initHeroSlider = () => {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.slider-btn.prev');
    const nextBtn = document.querySelector('.slider-btn.next');

    if (!slides.length) return;

    let currentSlide = 0;
    let slideInterval;

    const showSlide = (n) => {
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));

        currentSlide = (n + slides.length) % slides.length;

        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    };

    const nextSlide = () => showSlide(currentSlide + 1);
    const prevSlide = () => showSlide(currentSlide - 1);

    const startAutoPlay = () => {
        stopAutoPlay();
        slideInterval = setInterval(nextSlide, 6000); // 6 seconds
    };

    const stopAutoPlay = () => {
        if (slideInterval) clearInterval(slideInterval);
    };

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            startAutoPlay();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            startAutoPlay();
        });
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            startAutoPlay();
        });
    });

    // Pause on hover
    const slider = document.querySelector('.hero-slider');
    if (slider) {
        slider.addEventListener('mouseenter', stopAutoPlay);
        slider.addEventListener('mouseleave', startAutoPlay);
    }

    startAutoPlay();
};

// Helper to save cart to storage
const saveCart = () => {
    localStorage.setItem('pehuen_cart', JSON.stringify(cart));
};

// Aridos Calculator Logic
window.calculateAridos = () => {
    const length = parseFloat(document.getElementById('calc-length').value) || 0;
    const width = parseFloat(document.getElementById('calc-width').value) || 0;
    const depthCm = parseFloat(document.getElementById('calc-depth').value) || 0;

    if (length <= 0 || width <= 0 || depthCm <= 0) {
        alert('Por favor ingresa medidas válidas (mayores a 0).');
        return;
    }

    // Convert depth to meters
    const depthM = depthCm / 100;

    // Calculate m3
    const m3 = length * width * depthM;

    // Calculate estimate in 25kg sacks (Approx 1m3 sand = 1500-1600kg. Let's use 1600kg ~ 64 sacks)
    // This is an estimation.
    const sacks = Math.ceil((m3 * 1600) / 25);

    // Display
    document.getElementById('result-m3').textContent = m3.toFixed(2) + ' m³';
    document.getElementById('result-sacos').textContent = sacks;
    document.getElementById('calc-result').style.display = 'block';
};

// DOM Elements
const productsContainer = document.getElementById('products-container');
const cartCountElement = document.getElementById('cart-count');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navList = document.getElementById('nav-list');
const navLinks = document.querySelectorAll('.nav-list a:not(#mobile-menu-btn)'); // Exclude toggle button

// Format Currency
const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price);
};

// Create Product Card HTML
const createProductCard = (product) => {
    const hasDiscount = product.oldPrice != null;
    const discountPercentage = hasDiscount
        ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
        : 0;

    // Check for multiple images
    const images = product.images && product.images.length > 0 ? product.images : [product.image];
    const isCarousel = images.length > 1;

    let carouselHTML = '';
    if (isCarousel) {
        carouselHTML = `
            <div class="carousel-container" id="carousel-${product.id}">
                ${images.map((img, idx) => `
                    <div class="carousel-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}">
                        <img src="${img}" alt="${product.name} - ${idx + 1}">
                    </div>
                `).join('')}
                <button class="carousel-btn prev" onclick="changeSlide('${product.id}', -1, event)"><i class="fa-solid fa-chevron-left"></i></button>
                <button class="carousel-btn next" onclick="changeSlide('${product.id}', 1, event)"><i class="fa-solid fa-chevron-right"></i></button>
                <div class="carousel-dots">
                    ${images.map((_, idx) => `
                        <span class="dot ${idx === 0 ? 'active' : ''}" onclick="setSlide('${product.id}', ${idx}, event)"></span>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        carouselHTML = `<img src="${images[0]}" alt="${product.name}">`;
    }

    return `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                ${hasDiscount ? `<span class="discount-badge">-${discountPercentage}%</span>` : ''}
                <div onclick="openProductDetails('${product.id}')" style="cursor:pointer">${carouselHTML}</div>
            </div>
            <div class="product-info">
                <span class="product-cat">${product.category}</span>
                <h3 class="product-title" onclick="openProductDetails('${product.id}')" style="cursor:pointer">${product.name}</h3>
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
                    <button class="btn btn-add" onclick="addToCart('${product.id}', this)">
                        <i class="fa-solid fa-cart-shopping"></i> Agregar
                    </button>
                </div>
            </div>
        </div>
    `;
};

// Carousel Logic
const carouselStates = {};

window.changeSlide = (productId, delta, event) => {
    if (event) event.stopPropagation();
    const product = products.find(p => p.id == productId);
    if (!product) return;

    const images = product.images && product.images.length > 0 ? product.images : [product.image];
    if (images.length <= 1) return;

    if (!carouselStates[productId]) carouselStates[productId] = 0;

    let newIndex = carouselStates[productId] + delta;
    if (newIndex >= images.length) newIndex = 0;
    if (newIndex < 0) newIndex = images.length - 1;

    setSlide(productId, newIndex);
};

window.setSlide = (productId, index, event) => {
    if (event) event.stopPropagation();
    carouselStates[productId] = index;

    const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
    if (!card) return;

    const slides = card.querySelectorAll('.carousel-slide');
    const dots = card.querySelectorAll('.dot');

    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    slides[index].classList.add('active');
    dots[index].classList.add('active');

    // Reset auto-rotate timer if it exists
    resetAutoRotate(productId);
};

const autoRotateTimers = {};
const startAutoRotate = () => {
    products.forEach(product => {
        if (product.images && product.images.length > 1) {
            resetAutoRotate(product.id);
        }
    });
};

const resetAutoRotate = (productId) => {
    if (autoRotateTimers[productId]) clearInterval(autoRotateTimers[productId]);
    autoRotateTimers[productId] = setInterval(() => {
        changeSlide(productId, 1);
    }, 4000); // Change image every 4 seconds
};

// Render Products
const renderProducts = (category = 'all', searchTerm = '') => {
    if (!productsContainer) return;

    productsContainer.innerHTML = '';
    productsContainer.style.opacity = '0.5';

    setTimeout(() => {
        let filteredProducts = products;

        if (category !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.category === category || (category === 'materiales' && p.category !== 'herramientas' && p.category !== 'aridos' && p.category !== 'jardin'));
        } else if (!searchTerm) {
            filteredProducts = filteredProducts.filter(p => p.category !== 'aridos');
        }

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
            productsContainer.insertAdjacentHTML('beforeend', createProductCard(product));
        });

        productsContainer.style.opacity = '1';
        startAutoRotate();
    }, 300);
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
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();

        if (val.length < 2) {
            searchResults.classList.remove('active');
            if (productsContainer) renderProducts('all', val);
            return;
        }

        const matches = products.filter(p =>
            p.name.toLowerCase().includes(val) ||
            p.category.toLowerCase().includes(val) ||
            p.id.toString().includes(val)
        ).slice(0, 8); // Limit to 8 results

        if (matches.length > 0) {
            searchResults.innerHTML = '';
            matches.forEach(p => {
                const div = document.createElement('div');
                div.className = 'search-item';
                div.innerHTML = `
                    <div class="info">
                        <div class="name">${p.name}</div>
                        <div class="stock-info">${p.category} | SKU: ${p.id}</div>
                    </div>
                    <div class="price">${formatPrice(p.price)}</div>
                `;
                div.addEventListener('click', () => {
                    if (productsContainer) {
                        searchInput.value = p.name;
                        renderProducts('all', p.name);
                        searchResults.classList.remove('active');
                    } else {
                        window.location.href = `index.html?search=${encodeURIComponent(p.name)}`;
                    }
                });
                searchResults.appendChild(div);
            });
            searchResults.classList.add('active');
        } else {
            searchResults.classList.remove('active');
        }
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const term = searchInput.value;
            searchResults.classList.remove('active');
            if (productsContainer) {
                renderProducts('all', term);
            } else {
                window.location.href = `index.html?search=${encodeURIComponent(term)}`;
            }
        }
    });

    // Close search if clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });

    const searchBtn = searchInput.nextElementSibling.nextElementSibling; // The button next to results-dropdown
    if (searchBtn && searchBtn.tagName === 'BUTTON') {
        searchBtn.addEventListener('click', () => {
            const term = searchInput.value;
            if (productsContainer) {
                renderProducts('all', term);
            } else {
                window.location.href = `index.html?search=${encodeURIComponent(term)}`;
            }
        });
    }
}

// Mobile Menu Toggle
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        navList.classList.toggle('show');
    });
}

// Nav Links as Filters
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');

        // Intercept category links if we are already on index.html
        if (isHomePage && href.includes('?cat=')) {
            e.preventDefault();
            const urlParams = new URLSearchParams(href.split('?')[1]);
            const category = urlParams.get('cat');
            if (category) {
                renderProducts(category);
                // Update active button In UI
                filterButtons.forEach(b => {
                    b.classList.remove('active');
                    if (b.dataset.filter === category) b.classList.add('active');
                });
                // Scroll
                const productsSection = document.getElementById('productos');
                if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth' });
                // Close mobile menu
                if (navList) navList.classList.remove('show');
            }
            return;
        }

        // Do not intercept if it's a real link (not #) and not an in-page anchor
        if (href && href !== '#' && !href.startsWith('#')) return;

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
            aridosContainer.insertAdjacentHTML('beforeend', createProductCard(product));
        });

        aridosContainer.style.opacity = '1';
        startAutoRotate();
    }, 300);
};

// Initial Render handled by onSnapshot above

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
                    <button class="mini-qty-btn" onclick="updateCartQty('${item.id}', ${item.qty - 1})"><i class="fa-solid fa-minus"></i></button>
                    <span class="cart-qty-display">${item.qty}</span>
                    <button class="mini-qty-btn" onclick="updateCartQty('${item.id}', ${item.qty + 1})"><i class="fa-solid fa-plus"></i></button>
                </div>
                <button class="remove-item" onclick="removeFromCart('${item.id}')">Eliminar</button>
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

    const item = cart.find(p => p.id == id);
    if (item) {
        item.qty = newQty;
        updateCartCount();
        saveCart();
        renderCartItems();
    }
};

// Remove from Cart
window.removeFromCart = (id) => {
    const index = cart.findIndex(item => item.id == id);
    if (index > -1) {
        cart.splice(index, 1);
        updateCartCount();
        saveCart();
        renderCartItems();
    }
};

// Add to Cart
window.addToCart = (id, btnElement) => {
    const product = products.find(p => p.id == id);
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
    const existingItem = cart.find(item => item.id == id);
    if (existingItem) {
        existingItem.qty += qtyToAdd;
    } else {
        cart.push({ ...product, qty: qtyToAdd });
    }

    updateCartCount();
    saveCart();
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

// Checkout Modal Logic
let checkoutModalCreated = false;

const createCheckoutModal = () => {
    if (checkoutModalCreated) return;

    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('pehuen_currentUser'));
    const prefillName = currentUser ? currentUser.name : '';
    const prefillEmail = currentUser ? currentUser.email : ''; // Not used in form currently but good to have context

    const modalHTML = `
        <div id="checkout-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Finalizar Pedido</h3>
                    <button class="close-modal" onclick="closeCheckoutModal()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="modal-body">
                    <p>Ingresa tus datos para agilizar el despacho.</p>
                    <div class="form-group">
                        <label>Nombre</label>
                        <input type="text" id="cust-name" placeholder="Tu nombre" value="${prefillName}">
                    </div>
                    <div class="form-group">
                        <label>Dirección de Despacho</label>
                        <input type="text" id="cust-address" placeholder="Calle, Número, Comuna">
                    </div>
                    <div class="form-group">
                        <label>Comentarios (Opcional)</label>
                        <textarea id="cust-notes" placeholder="Referencia, horario, etc."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary btn-block" onclick="submitOrder()">
                        <i class="fa-brands fa-whatsapp"></i> Enviar Pedido por WhatsApp
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    checkoutModalCreated = true;
};

window.closeCheckoutModal = () => {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.remove('open');
};

window.submitOrder = () => {
    const name = document.getElementById('cust-name').value;
    const address = document.getElementById('cust-address').value;
    const notes = document.getElementById('cust-notes').value;

    if (!name || !address) {
        alert('Por favor ingresa tu nombre y dirección.');
        return;
    }

    const phoneNumber = "56978589090";
    let message = `Hola *Ferretería Pehuen*, soy *${name}*.\nMe gustaría realizar el siguiente pedido con despacho a: *${address}*.\n\n`;

    let total = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        message += `▪️ ${item.qty}x ${item.name} (${formatPrice(itemTotal)})\n`;
    });

    message += `\n*Total a pagar: ${formatPrice(total)}*`;

    if (notes) {
        message += `\n\n📝 Nota: ${notes}`;
    }

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    closeCheckoutModal();
};

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Tu carro está vacío. Agrega productos antes de comprar.');
            return;
        }
        createCheckoutModal();
        // Recalculate prefill if modal was just hidden and not destroyed? 
        // Actually createCheckouModal returns if created. 
        // We should update the value if currentUser changed.
        const currentUser = JSON.parse(localStorage.getItem('ferreteria_currentUser'));
        if (currentUser && document.getElementById('cust-name')) {
            if (!document.getElementById('cust-name').value) {
                document.getElementById('cust-name').value = currentUser.name;
            }
        }

        setTimeout(() => {
            document.getElementById('checkout-modal').classList.add('open');
        }, 10);
    });
}

/* AUTH LOGIC */
window.handleRegister = (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden.');
        return;
    }

    let users = JSON.parse(localStorage.getItem('ferreteria_users')) || [];

    // Check if email exists
    if (users.find(u => u.email === email)) {
        alert('Este correo ya está registrado.');
        return;
    }

    const newUser = { name, email, password }; // Note: In production never store passwords in plain text!
    users.push(newUser);
    localStorage.setItem('ferreteria_users', JSON.stringify(users));

    alert('Registro exitoso. Ahora puedes iniciar sesión.');
    switchTab('login');
};

window.handleLogin = (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    let users = JSON.parse(localStorage.getItem('ferreteria_users')) || [];
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        // Login success
        const sessionUser = { name: user.name, email: user.email };
        localStorage.setItem('ferreteria_currentUser', JSON.stringify(sessionUser));
        alert(`Bienvenido, ${user.name}!`);
        window.location.href = 'index.html';
    } else {
        alert('Correo o contraseña incorrectos.');
    }
};

window.logout = () => {
    localStorage.removeItem('ferreteria_currentUser');
    window.location.reload();
};

const checkSession = () => {
    const currentUser = JSON.parse(localStorage.getItem('ferreteria_currentUser'));
    const userActionLinks = document.querySelectorAll('#user-action'); // Use class or ID if unique? I used ID but repeated in diff files. 
    // Actually ID must be unique per page, but querySelectorAll works if multiple accidental IDs or I change to class.

    if (currentUser) {
        userActionLinks.forEach(link => {
            link.innerHTML = `
                <i class="fa-solid fa-user-check"></i>
                <span>${currentUser.name.split(' ')[0]}</span>
            `;
            link.href = "#";
            link.onclick = (e) => {
                e.preventDefault();
                if (confirm('¿Deseas cerrar sesión?')) {
                    logout();
                }
            };
        });
    }
};

// Run check session on load
checkSession();

/* Product Details Modal */
let detailsModalCreated = false;

window.openProductDetails = (id) => {
    const product = products.find(p => p.id == id);
    if (!product) return;

    if (!document.getElementById('product-details-modal')) {
        const modalHTML = `
            <div id="product-details-modal" class="modal-overlay">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h3>Detalle del Producto</h3>
                        <button class="close-modal" onclick="closeProductDetails()"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="modal-body" id="details-modal-body">
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    const body = document.getElementById('details-modal-body');
    const images = product.images && product.images.length > 0 ? product.images : [product.image];

    body.innerHTML = `
        <div class="product-details-grid">
            <div class="details-images">
                <img src="${images[0]}" alt="${product.name}" id="main-detail-img">
                <div class="details-thumbnails">
                    ${images.map(img => `<img src="${img}" onclick="document.getElementById('main-detail-img').src='${img}'">`).join('')}
                </div>
            </div>
            <div class="details-info">
                <span class="badge">${product.category.toUpperCase()}</span>
                <h1>${product.name}</h1>
                <div class="price-box">
                    <span class="current-price">${formatPrice(product.price)}</span>
                    ${product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ''}
                </div>
                <p class="description">${product.description || 'Este producto es de alta calidad, diseñado para ofrecer durabilidad y un rendimiento excepcional en todas sus aplicaciones de construcción y ferretería.'}</p>
                <div class="stock-info">
                    <i class="fa-solid fa-check-circle"></i> En Stock: <strong>${product.stock} unidades</strong>
                </div>
                <hr>
                <div class="product-actions">
                    <div class="qty-selector">
                        <button class="qty-btn minus" onclick="adjustCardQty(this, -1)">-</button>
                        <input type="number" class="qty-input" value="1" min="1" readonly>
                        <button class="qty-btn plus" onclick="adjustCardQty(this, 1)">+</button>
                    </div>
                    <button class="btn btn-primary" onclick="addToCart('${product.id}', this)">
                        <i class="fa-solid fa-cart-shopping"></i> Agregar al Carro
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('product-details-modal').classList.add('open');
};

window.closeProductDetails = () => {
    const modal = document.getElementById('product-details-modal');
    if (modal) modal.classList.remove('open');
};
