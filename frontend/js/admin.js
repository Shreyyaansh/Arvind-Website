// Admin Panel JavaScript


// Admin password - injected from environment variable at build time via config.js
// If not set, admin panel will not work (security feature)
const ADMIN_PASSWORD = (window && window.ADMIN_PASSWORD);
let adminAuthenticated = false;
let adminToken = null;

// Get API_BASE from script.js (made globally available via window.API_BASE)
// Helper function to get API_BASE safely
function getApiBase() {
    return (window && window.API_BASE) || (window && window.__API_BASE__) || '';
}

// Wait for DOM to be ready
let adminPanel, adminPasswordModal, adminContent, adminPasswordInput, adminPasswordSubmit, adminPasswordCancel, adminPasswordError, adminCloseBtn, adminProducts;

// Global keyboard shortcut listener (works even if initialization hasn't completed)
document.addEventListener('keydown', (e) => {
    // Don't trigger if user is typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
    }
    
    // Check for Ctrl+Alt+A or Cmd+Option+A (Mac)
    const isModifierPressed = (e.ctrlKey || e.metaKey) && e.altKey;
    const isAKey = e.key === 'A' || e.key === 'a' || e.keyCode === 65 || e.which === 65;
    
    if (isModifierPressed && isAKey) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        console.log('🔑 Admin shortcut detected: Ctrl+Alt+A');
        
        // If admin panel not initialized, initialize it first
        if (!adminPanel) {
            console.log('Initializing admin panel...');
            initializeAdmin();
            setTimeout(() => {
                if (adminPanel) {
                    openAdminPanel();
                } else {
                    console.error('❌ Admin panel still not available. Check browser console for errors.');
                }
            }, 200);
        } else {
            openAdminPanel();
        }
    }
}, true);

function initAdminPanel() {
    adminPanel = document.getElementById('adminPanel');
    adminPasswordModal = document.getElementById('adminPasswordModal');
    adminContent = document.getElementById('adminContent');
    adminPasswordInput = document.getElementById('adminPassword');
    adminPasswordSubmit = document.getElementById('adminPasswordSubmit');
    adminPasswordCancel = document.getElementById('adminPasswordCancel');
    adminPasswordError = document.getElementById('adminPasswordError');
    adminCloseBtn = document.getElementById('adminCloseBtn');
    adminProducts = document.getElementById('adminProducts');

    if (!adminPanel) {
        console.error('Admin panel elements not found');
        return;
    }

    // Keyboard shortcut: Ctrl+Alt+A (or Cmd+Option+A on Mac)
    // Use capture phase to ensure we catch it early
    document.addEventListener('keydown', handleKeyboardShortcut, true);
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ Admin panel initialized successfully!');
    console.log('📌 Press Ctrl+Alt+A (or Cmd+Option+A on Mac) to open the admin panel.');
    
    // Test if elements are found
    if (adminPanel && adminPasswordModal && adminContent) {
        console.log('✅ All admin panel elements found');
    } else {
        console.error('❌ Some admin panel elements are missing:', {
            adminPanel: !!adminPanel,
            adminPasswordModal: !!adminPasswordModal,
            adminContent: !!adminContent
        });
    }
}

function handleKeyboardShortcut(e) {
    // Don't trigger if user is typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
    }
    
    // Check for Ctrl+Alt+A or Cmd+Option+A (Mac)
    const isModifierPressed = (e.ctrlKey || e.metaKey) && e.altKey;
    const isAKey = e.key === 'A' || e.key === 'a' || e.keyCode === 65 || e.which === 65;
    
    if (isModifierPressed && isAKey) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Debug log
        console.log('Admin shortcut triggered!');
        
        if (!adminPanel) {
            console.warn('Admin panel not initialized, attempting to initialize...');
            initializeAdmin();
            // Try again after initialization
            setTimeout(() => {
                if (adminPanel) {
                    openAdminPanel();
                } else {
                    console.error('Admin panel still not available after initialization');
                }
            }, 100);
        } else {
            openAdminPanel();
        }
    }
}

function setupEventListeners() {
    // Password submission
    adminPasswordSubmit.addEventListener('click', () => {
        if (!ADMIN_PASSWORD) {
            adminPasswordError.textContent = 'Admin password not configured';
            return;
        }
        const password = adminPasswordInput.value;
        if (password === ADMIN_PASSWORD) {
            adminAuthenticated = true;
            adminToken = btoa(password + Date.now()); // Simple token generation
            adminPasswordModal.style.display = 'none';
            adminContent.style.display = 'flex';
            loadAdminProducts();
        } else {
            adminPasswordError.textContent = 'Incorrect password';
            adminPasswordInput.value = '';
            adminPasswordInput.focus();
        }
    });

    // Cancel password
    adminPasswordCancel.addEventListener('click', closeAdminPanel);

    // Close button
    adminCloseBtn.addEventListener('click', closeAdminPanel);

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && adminPanel.classList.contains('active')) {
            closeAdminPanel();
        }
    });
}

// Open admin panel
function openAdminPanel() {
    adminPanel.classList.add('active');
    if (!adminAuthenticated) {
        adminPasswordModal.style.display = 'flex';
        adminContent.style.display = 'none';
        adminPasswordInput.focus();
    } else {
        adminPasswordModal.style.display = 'none';
        adminContent.style.display = 'flex';
        loadAdminProducts();
    }
}

// Close admin panel
function closeAdminPanel() {
    adminPanel.classList.remove('active');
    adminPasswordInput.value = '';
    adminPasswordError.textContent = '';
}

// Initialize admin panel when DOM is ready
// Use multiple methods to ensure it initializes
function initializeAdmin() {
    try {
        initAdminPanel();
    } catch (error) {
        console.error('Error initializing admin panel:', error);
        // Retry after a short delay
        setTimeout(() => {
            try {
                initAdminPanel();
            } catch (e) {
                console.error('Failed to initialize admin panel after retry:', e);
            }
        }, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdmin);
} else {
    // DOM already loaded, but wait a bit to ensure all scripts are ready
    setTimeout(initializeAdmin, 50);
}

// Also try on window load as a fallback
window.addEventListener('load', () => {
    if (!adminPanel) {
        console.warn('Admin panel not initialized, retrying...');
        initializeAdmin();
    }
});

// Load products for admin
async function loadAdminProducts() {
    try {
        adminProducts.innerHTML = '<p>Loading products...</p>';
        const res = await fetch(`${getApiBase()}/api/admin/products`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (res.status === 401) {
            adminAuthenticated = false;
            adminPasswordModal.style.display = 'flex';
            adminContent.style.display = 'none';
            adminPasswordError.textContent = 'Session expired. Please login again.';
            return;
        }
        
        if (!res.ok) {
            throw new Error('Failed to load products');
        }
        
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.products)) {
            renderAdminProducts(data.products);
        } else {
            adminProducts.innerHTML = '<p>No products found.</p>';
        }
    } catch (error) {
        console.error('Failed to load admin products:', error);
        adminProducts.innerHTML = '<p style="color: #e74c3c;">Error loading products. Please try again.</p>';
    }
}

// Render products in admin panel
function renderAdminProducts(products) {
    if (products.length === 0) {
        adminProducts.innerHTML = '<p>No products found.</p>';
        return;
    }
    
    adminProducts.innerHTML = products.map(product => `
        <div class="admin-product-item" data-product-id="${product.productId}">
            <div class="admin-product-header">
                <h4>${product.name}</h4>
                <span class="admin-product-price">₹${product.price.toLocaleString('en-IN')}</span>
            </div>
            <div class="admin-variants">
                ${product.variants.map(variant => `
                    <div class="admin-variant-item" data-variant-id="${variant._id || `${product.productId}-${variant.size}-${variant.color}`}">
                        <div class="admin-variant-info">
                            <strong>Size:</strong> ${variant.size} | <strong>Color:</strong> ${variant.color}
                        </div>
                        <div class="admin-variant-stock">
                            <label>Stock:</label>
                            <input type="number" 
                                   min="0" 
                                   value="${variant.stock}" 
                                   data-product-id="${product.productId}"
                                   data-size="${variant.size}"
                                   data-color="${variant.color}"
                                   class="admin-stock-input">
                            <button class="admin-save-stock-btn" 
                                    data-product-id="${product.productId}"
                                    data-size="${variant.size}"
                                    data-color="${variant.color}">
                                Save
                            </button>
                            <span class="admin-save-status"></span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    // Add event listeners to save buttons
    document.querySelectorAll('.admin-save-stock-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const productId = parseInt(btn.dataset.productId);
            const size = btn.dataset.size;
            const color = btn.dataset.color;
            const input = btn.previousElementSibling;
            const statusSpan = btn.nextElementSibling;
            const newStock = parseInt(input.value);
            
            if (isNaN(newStock) || newStock < 0) {
                statusSpan.textContent = 'Invalid value';
                statusSpan.className = 'admin-save-status error';
                return;
            }
            
            btn.disabled = true;
            btn.textContent = 'Saving...';
            statusSpan.textContent = '';
            
            try {
                const res = await fetch(`${getApiBase()}/api/admin/products/${productId}/variants`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminToken}`
                    },
                    body: JSON.stringify({
                        size,
                        color,
                        stock: newStock
                    })
                });
                
                if (res.status === 401) {
                    adminAuthenticated = false;
                    adminPasswordModal.style.display = 'flex';
                    adminContent.style.display = 'none';
                    adminPasswordError.textContent = 'Session expired. Please login again.';
                    return;
                }
                
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Failed to update stock');
                }
                
                const data = await res.json();
                if (data && data.ok) {
                    statusSpan.textContent = 'Saved!';
                    statusSpan.className = 'admin-save-status success';
                    setTimeout(() => {
                        statusSpan.textContent = '';
                    }, 2000);
                } else {
                    throw new Error('Update failed');
                }
            } catch (error) {
                console.error('Failed to update stock:', error);
                statusSpan.textContent = 'Error';
                statusSpan.className = 'admin-save-status error';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Save';
            }
        });
    });
}

