// Configure API base: set `window.__API_BASE__` via config.js when frontend
// is deployed separately. Default is '' (same-origin relative paths).
let API_BASE = (window && window.__API_BASE__) || '';
// Normalize API_BASE: if user provided only a hostname, prefix https://
if (API_BASE) {
    API_BASE = String(API_BASE).trim();
    if (!API_BASE.match(/^https?:\/\//)) {
        API_BASE = 'https://' + API_BASE.replace(/^\/+|\/+$/g, '');
    } else {
        API_BASE = API_BASE.replace(/\/+$/, '');
    }
}
// Make API_BASE globally accessible for admin.js
window.API_BASE = API_BASE;


// Sample product data (used as fallback if API unavailable)
let products = [
    {
        id: 1,
        name: 'Women Printed Kurta',
        price: 1299,
        image: 'images/shopping (1).webp',
        variants: [
            { size: 'S', color: 'White', stock: 10 },
            { size: 'M', color: 'White', stock: 15 },
            { size: 'L', color: 'White', stock: 8 },
            { size: 'XL', color: 'White', stock: 5 }
        ]
    },
    {
        id: 2,
        name: 'Men Solid Polo T-Shirt',
        price: 2499,
        image: 'images/shopping (2).webp',
        variants: [
            { size: '30', color: 'Blue', stock: 5 },
            { size: '32', color: 'Blue', stock: 8 },
            { size: '34', color: 'Blue', stock: 3 },
            { size: '30', color: 'Black', stock: 7 },
            { size: '32', color: 'Black', stock: 4 }
        ]
    },
    {
        id: 3,
        name: 'Women Wide-Leg Trousers',
        price: 4999,
        image: 'images/shopping (3).webp',
        variants: [
            { size: 'M', color: 'Navy', stock: 4 },
            { size: 'L', color: 'Navy', stock: 6 },
            { size: 'XL', color: 'Navy', stock: 3 },
            { size: 'M', color: 'Charcoal', stock: 2 },
            { size: 'L', color: 'Charcoal', stock: 5 }
        ]
    },
    {
        id: 4,
        name: 'Men White Casual Blazer',
        price: 3299,
        image: 'images/shopping.webp',
        variants: [
            { size: 'XS', color: 'Multi', stock: 7 },
            { size: 'S', color: 'Multi', stock: 5 },
            { size: 'M', color: 'Multi', stock: 3 },
            { size: 'L', color: 'Multi', stock: 4 }
        ]
    }
];

const productGrid = document.querySelector('.product-grid');
const productDetails = document.getElementById('productDetails');
const detailImage = document.getElementById('detailImage');
const detailName = document.getElementById('detailName');
const detailPrice = document.getElementById('detailPrice');
const sizeOptions = document.getElementById('sizeOptions');
const colorOptions = document.getElementById('colorOptions');
const quantityDisplay = document.getElementById('quantity');
const stockInfo = document.getElementById('stockInfo');
const decreaseQty = document.getElementById('decreaseQty');
const increaseQty = document.getElementById('increaseQty');
const checkoutBtn = document.getElementById('checkoutBtn');
const closeDetails = document.getElementById('closeDetails');
const checkoutModal = document.getElementById('checkoutModal');
const closeModal = document.getElementById('closeModal');
const checkoutForm = document.getElementById('checkoutForm');

let currentProduct = null;
let selectedSize = null;
let selectedColor = null;
let selectedVariant = null;
let quantity = 1;

function initializeProductGrid() {
    productGrid.innerHTML = '';
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">₹${product.price.toLocaleString('en-IN')}</p>
            </div>
        `;
        productCard.addEventListener('click', () => showProductDetails(product));
        productGrid.appendChild(productCard);
    });
}

// Load products from backend before rendering
async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE}/api/products`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok && Array.isArray(data.products)) {
                products = data.products;
            }
        }
    } catch (e) {
        console.warn('Failed to fetch products from API, using fallback.', e);
    } finally {
        initializeProductGrid();
    }
}

function showProductDetails(product) {
    currentProduct = product;
    detailImage.src = product.image;
    detailImage.alt = product.name;
    detailName.textContent = product.name;
    detailPrice.textContent = `₹${product.price.toLocaleString('en-IN')}`;

    selectedSize = null;
    selectedColor = null;
    selectedVariant = null;
    quantity = 1;
    quantityDisplay.textContent = '1';

    const sizes = [...new Set(product.variants.map(v => v.size))];
    const colors = [...new Set(product.variants.map(v => v.color))];

    sizeOptions.innerHTML = '';
    sizes.forEach(size => {
        const sizeBtn = document.createElement('button');
        sizeBtn.className = 'size-option';
        sizeBtn.textContent = size;
        sizeBtn.addEventListener('click', () => selectSize(size));
        sizeOptions.appendChild(sizeBtn);
    });

    colorOptions.innerHTML = '';
    colors.forEach(color => {
        const colorBtn = document.createElement('button');
        colorBtn.className = 'color-option';
        colorBtn.textContent = color;
        // Minimal style: no inline swatch colors, same look-and-feel as size buttons
        colorBtn.addEventListener('click', () => selectColor(color));
        colorOptions.appendChild(colorBtn);
    });

    productDetails.classList.add('active');
    updateStockInfo();
}

function selectSize(size) {
    selectedSize = size;
    document.querySelectorAll('.size-option').forEach(btn => {
        btn.classList.toggle('selected', btn.textContent === size);
    });
    updateSelectedVariant();
}

function selectColor(color) {
    selectedColor = color;
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.toggle('selected', btn.textContent === color);
    });
    updateSelectedVariant();
}

function updateSelectedVariant() {
    if (!selectedSize || !selectedColor) return;
    selectedVariant = currentProduct.variants.find(v => v.size === selectedSize && v.color === selectedColor);
    if (selectedVariant) {
        quantity = 1;
        quantityDisplay.textContent = quantity;
        updateStockInfo();
    }
}

function updateStockInfo() {
    if (!selectedVariant) {
        stockInfo.textContent = 'Select size and color';
        return;
    }
    stockInfo.textContent = `${selectedVariant.stock} in stock`;
    if (selectedVariant.stock === 0) {
        increaseQty.disabled = true;
        decreaseQty.disabled = true;
        quantityDisplay.textContent = '0';
    } else {
        increaseQty.disabled = quantity >= selectedVariant.stock;
        decreaseQty.disabled = quantity <= 1;
    }
}

closeDetails.addEventListener('click', () => { productDetails.classList.remove('active'); });
closeModal.addEventListener('click', () => { checkoutModal.style.display = 'none'; });
window.addEventListener('click', (e) => { if (e.target === checkoutModal) checkoutModal.style.display = 'none'; });

increaseQty.addEventListener('click', () => {
    if (selectedVariant && quantity < selectedVariant.stock) {
        quantity++;
        quantityDisplay.textContent = quantity;
        updateStockInfo();
    }
});

decreaseQty.addEventListener('click', () => {
    if (quantity > 1) {
        quantity--;
        quantityDisplay.textContent = quantity;
        updateStockInfo();
    }
});

checkoutBtn.addEventListener('click', () => {
    if (!selectedVariant) { alert('Please select size and color'); return; }
    if (selectedVariant.stock === 0) { alert('This item is out of stock'); return; }
    checkoutModal.style.display = 'flex';
});

checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const employeeCode = document.getElementById('employeeCode').value;
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;

    const payload = { productId: currentProduct.id, productName: currentProduct.name, size: selectedSize, color: selectedColor, quantity, price: currentProduct.price, employeeCode, name, email, phone };

    const submitBtn = checkoutForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent; submitBtn.disabled = true; submitBtn.textContent = 'Submitting...';

    try {
        const res = await fetch(`${API_BASE}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        let data = null;
        try { data = await res.json(); } catch (e) { /* non-json response */ }
        if (!res.ok || !data || !data.ok) {
            console.error('Order submission response', { status: res.status, body: data });
            throw new Error((data && data.error) || `Failed to submit order (status ${res.status})`);
        }
        // Update stock from server response when available, otherwise decrement locally
        if (selectedVariant) {
            if (typeof data.newStock === 'number') {
                selectedVariant.stock = data.newStock;
            } else {
                selectedVariant.stock = Math.max(0, Number(selectedVariant.stock) - Number(quantity));
            }
            quantity = 1;
            quantityDisplay.textContent = '1';
            updateStockInfo();
        }

        alert('Order submitted successfully. Confirmation email has been sent.');
        checkoutForm.reset();
        checkoutModal.style.display = 'none';
    } catch (err) {
        console.error('Order submission failed:', err);
        alert('Failed to submit order. Please try again or contact support.');
    } finally {
        submitBtn.disabled = false; submitBtn.textContent = originalText;
    }
});

document.addEventListener('DOMContentLoaded', () => { loadProducts(); });
