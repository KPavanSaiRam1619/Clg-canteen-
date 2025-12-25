/**
 * AI Canteen Application Logic
 * Simulates a full-stack app using LocalStorage and Vanilla JS
 */
const app = {
    state: {
        currentUser: null,
        role: 'customer', // 'owner' or 'customer'
        menu: [],
        cart: [],
        orders: [],
        revenue: 0
    },

    init() {
        // Load data from localStorage or set defaults
        const storedMenu = localStorage.getItem('canteen_menu');
        const storedOrders = localStorage.getItem('canteen_orders');
        
        if (storedMenu) {
            this.state.menu = JSON.parse(storedMenu);
        } else {
            // Seed Initial Menu
            this.state.menu = [
                { id: 1, name: "Veg Fried Rice", price: 5.50, category: "Food", type: "veg", img: "https://picsum.photos/seed/rice/300/200" },
                { id: 2, name: "Chicken Burger", price: 6.00, category: "Snack", type: "non-veg", img: "https://picsum.photos/seed/burger/300/200" },
                { id: 3, name: "Cold Coffee", price: 3.00, category: "Beverage", type: "veg", img: "https://picsum.photos/seed/coffee/300/200" },
                { id: 4, name: "Samosa (2pc)", price: 1.50, category: "Snack", type: "veg", img: "https://picsum.photos/seed/samosa/300/200" }
            ];
            this.saveData();
        }

        if (storedOrders) {
            this.state.orders = JSON.parse(storedOrders);
        }

        // Check if already logged in (simulation)
        const session = sessionStorage.getItem('canteen_session');
        if (session) {
            this.state.currentUser = JSON.parse(session);
            this.state.role = this.state.currentUser.role;
            this.loadDashboard();
        } else {
            this.showView('auth-view');
        }
        
        this.renderCharts();
    },

    saveData() {
        localStorage.setItem('canteen_menu', JSON.stringify(this.state.menu));
        localStorage.setItem('canteen_orders', JSON.stringify(this.state.orders));
    },

    /* --- Authentication --- */
    setAuthRole(role) {
        this.state.role = role;
        document.getElementById('btn-role-customer').classList.toggle('active', role === 'customer');
        document.getElementById('btn-role-owner').classList.toggle('active', role === 'owner');
        document.getElementById('username').value = role === 'owner' ? 'admin' : 'user';
    },

    handleLogin(e) {
        e.preventDefault();
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;

        if ((this.state.role === 'owner' && u === 'admin' && p === '123') ||
            (this.state.role === 'customer' && u === 'user' && p === '123')) {
            
            this.state.currentUser = { name: u, role: this.state.role };
            sessionStorage.setItem('canteen_session', JSON.stringify(this.state.currentUser));
            
            this.showToast(`Welcome back, ${this.state.role === 'owner' ? 'Admin' : 'Student'}!`, 'success');
            this.loadDashboard();
        } else {
            this.showToast('Invalid credentials', 'info');
        }
    },

    logout() {
        this.state.currentUser = null;
        sessionStorage.removeItem('canteen_session');
        location.reload();
    },

    loadDashboard() {
        document.getElementById('app-header').classList.remove('hidden');
        document.getElementById('user-display').textContent = this.state.currentUser.name;

        if (this.state.role === 'owner') {
            this.showView('owner-dashboard');
            this.updateOwnerStats();
            this.renderOrders();
        } else {
            this.showView('customer-view');
            this.renderMenu();
        }
    },

    showView(viewId) {
        document.querySelectorAll('main > section').forEach(el => el.classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');
    },

    /* --- Customer Features --- */
    renderMenu(filterText = '') {
        const grid = document.getElementById('menu-grid');
        grid.innerHTML = '';

        const filtered = this.state.menu.filter(item => 
            item.name.toLowerCase().includes(filterText.toLowerCase())
        );

        filtered.forEach(item => {
            const el = document.createElement('div');
            el.className = 'card menu-item';
            el.innerHTML = `
                <div class="item-img" style="background-image: url('${item.img}')">
                    <span class="badge ${item.type === 'veg' ? 'badge-veg' : 'badge-nonveg'}" style="position:absolute; top:10px; right:10px;">${item.type === 'veg' ? 'VEG' : 'NON-VEG'}</span>
                </div>
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p style="color:#888; font-size:0.8rem;">${item.category}</p>
                    <div class="item-price">
                        $${item.price.toFixed(2)}
                        <button class="btn btn-sm btn-primary" onclick="app.addToCart(${item.id})">Add +</button>
                    </div>
                </div>
            `;
            grid.appendChild(el);
        });
    },

    filterMenu(val) {
        this.renderMenu(val);
    },

    addToCart(id) {
        const item = this.state.menu.find(i => i.id === id);
        const existing = this.state.cart.find(i => i.id === id);
        
        if (existing) {
            existing.qty++;
        } else {
            this.state.cart.push({ ...item, qty: 1 });
        }
        this.updateCartUI();
        this.showToast(`${item.name} added to cart`, 'success');
    },

    toggleCart() {
        const modal = document.getElementById('cart-modal');
        modal.classList.toggle('hidden');
        this.updateCartUI();
    },

    updateCartUI() {
        const container = document.getElementById('cart-items-container');
        document.getElementById('cart-count').innerText = this.state.cart.reduce((a, b) => a + b.qty, 0);
        
        let total = 0;
        container.innerHTML = '';

        this.state.cart.forEach((item, idx) => {
            total += item.price * item.qty;
            const div = document.createElement('div');
            div.className = 'order-row';
            div.innerHTML = `
                <div>
                    <strong>${item.name}</strong><br>
                    <small>$${item.price} x ${item.qty}</small>
                </div>
                <div class="flex items-center gap-10">
                    <span>$${(item.price * item.qty).toFixed(2)}</span>
                    <button class="btn btn-sm btn-outline" style="color:red; border-color:red" onclick="app.removeFromCart(${idx})">&times;</button>
                </div>
            `;
            container.appendChild(div);
        });

        document.getElementById('cart-total').innerText = '$' + total.toFixed(2);
        document.getElementById('pay-amount').innerText = '$' + total.toFixed(2);
    },

    removeFromCart(idx) {
        this.state.cart.splice(idx, 1);
        this.updateCartUI();
    },

    showPayment() {
        if (this.state.cart.length === 0) return this.showToast('Cart is empty', 'info');
        document.getElementById('cart-modal').classList.add('hidden');
        document.getElementById('payment-modal').classList.remove('hidden');
    },

    confirmPayment() {
        // Create Order
        const total = this.state.cart.reduce((a, b) => a + (b.price * b.qty), 0);
        const newOrder = {
            id: 'ORD-' + Math.floor(Math.random() * 10000),
            items: [...this.state.cart],
            total: total,
            status: 'pending', // pending, preparing, ready, completed
            date: new Date().toLocaleString(),
            token: Math.floor(Math.random() * 200) + 1
        };

        this.state.orders.unshift(newOrder); // Add to top
        this.saveData();
        
        // Reset Cart
        this.state.cart = [];
        this.updateCartUI();
        document.getElementById('payment-modal').classList.add('hidden');
        
        this.showToast('Payment Successful! Order Placed.', 'success');
        
        this.showToast(`Token Number: ${newOrder.token}. Please wait.`, 'info');
    },

    /* --- Owner Features --- */
    addMenuItem(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newItem = {
            id: Date.now(),
            name: formData.get('name'),
            price: parseFloat(formData.get('price')),
            category: formData.get('category'),
            type: formData.get('type'),
            img: `https://picsum.photos/seed/${formData.get('name')}/300/200`
        };

        this.state.menu.push(newItem);
        this.saveData();
        this.showToast('Item added successfully', 'success');
        e.target.reset();
        document.getElementById('menu-modal').classList.add('hidden');
    },

    updateOwnerStats() {
        const today = new Date().toDateString();
        // Simple logic assuming orders in this session are "today"
        const revenue = this.state.orders.reduce((sum, o) => sum + o.total, 0);
        const pending = this.state.orders.filter(o => o.status !== 'completed').length;

        document.getElementById('stat-revenue').innerText = '$' + revenue.toFixed(2);
        document.getElementById('stat-orders').innerText = this.state.orders.length;
        document.getElementById('stat-pending').innerText = pending;
    },

    renderOrders() {
        const list = document.getElementById('orders-list');
        list.innerHTML = '';

        if (this.state.orders.length === 0) {
            list.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No orders yet.</p>';
            return;
        }

        this.state.orders.forEach(order => {
            const div = document.createElement('div');
            div.className = 'card';
            div.style.marginBottom = '10px';
            div.style.borderLeft = `5px solid ${this.getStatusColor(order.status)}`;
            
            let itemsHtml = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');

            // Status control buttons
            let actions = '';
            if(order.status === 'pending') actions = `<button class="btn btn-sm btn-primary" onclick="app.updateStatus('${order.id}', 'preparing')">Accept & Prep</button>`;
            else if(order.status === 'preparing') actions = `<button class="btn btn-sm btn-secondary" onclick="app.updateStatus('${order.id}', 'ready')">Mark Ready</button>`;
            else if(order.status === 'ready') actions = `<button class="btn btn-sm btn-outline" onclick="app.updateStatus('${order.id}', 'completed')">Complete</button>`;

            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <strong>#${order.token} (${order.id})</strong> <span class="order-status status-${order.status}">${order.status.toUpperCase()}</span>
                        <p style="font-size:0.9rem; margin-top:5px;">${itemsHtml}</p>
                    </div>
                    <div class="flex flex-col items-end gap-10">
                        <strong>$${order.total.toFixed(2)}</strong>
                        ${actions}
                    </div>
                </div>
            `;
            list.appendChild(div);
        });
    },

    getStatusColor(status) {
        if(status === 'pending') return '#f1c40f';
        if(status === 'preparing') return '#3498db';
        if(status === 'ready') return '#2ecc71';
        return '#95a5a6';
    },

    updateStatus(orderId, status) {
        const order = this.state.orders.find(o => o.id === orderId);
        if (order) {
            order.status = status;
            this.saveData();
            this.renderOrders();
            this.updateOwnerStats();
            this.showToast(`Order #${order.token} updated to ${status}`, 'success');
        }
    },

    /* --- AI Simulation Features --- */
    renderCharts() {
        const container = document.getElementById('sales-chart');
        const data = [40, 65, 30, 85, 55, 90, 70]; // Mock weekly data
        const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        
        let html = '';
        data.forEach((val, i) => {
            html += `
                <div class="bar-group">
                    <div class="bar" style="height: ${val}%;"></div>
                    <span class="bar-label">${days[i]}</span>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    runAIAnalysis() {
        const container = document.getElementById('ai-content');
        container.innerHTML = '<p style="color: var(--secondary);">AI analyzing database...</p>';
        
        setTimeout(() => {
            // Simple logic to generate "Insights"
            const revenue = this.state.orders.reduce((sum, o) => sum + o.total, 0);
            let insight1 = "", insight2 = "", insight3 = "";

            // Insight 1: Revenue Trend
            if (revenue > 50) insight1 = `<div class="ai-insight">Financial Analysis: Current daily revenue is $${revenue.toFixed(2)}. This is 15% higher than the predicted baseline for this time of week.</div>`;
            else insight1 = `<div class="ai-insight">Financial Alert: Revenue is below average. AI suggests launching a "Combo Offer" to boost sales during the next hour.</div>`;

            // Insight 2: Inventory Prediction
            const topItem = this.state.menu[0]; // Just picking first for demo
            insight2 = `<div class="ai-insight">Predictive Inventory: Demand for "${topItem.category}" items is rising. AI recommends stocking +20% inventory for tomorrow.</div>`;

            // Insight 3: Operational
            insight3 = `<div class="ai-insight">Operational Efficiency: Average prep time is optimal. Kitchen staff utilization is at 85%. No adjustments needed.</div>`;

            container.innerHTML = insight1 + insight2 + insight3;
            this.showToast('AI Analysis Complete', 'success');
        }, 1500);
    },

    /* --- Utilities --- */
    toggleModal(id) {
        document.getElementById(id).classList.toggle('hidden');
    },

    showToast(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '';
        if(type === 'success') icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        else icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';

        toast.innerHTML = `${icon} <span>${msg}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});