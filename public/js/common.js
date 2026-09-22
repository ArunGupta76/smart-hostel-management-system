/**
 * Common Frontend Utilities & Authentication Guards
 * Smart Hostel Management System - BCA Project
 */

// Check authentication on protected pages
(function checkAuth() {
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath.includes('login.html');
  const token = localStorage.getItem('hostel_token');

  if (!token && !isLoginPage) {
    window.location.href = '/pages/login.html';
  } else if (token && isLoginPage) {
    window.location.href = '/pages/dashboard.html';
  }
})();

// Set active navigation item in sidebar based on current URL
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.sidebar-menu li a');

  navLinks.forEach((link) => {
    const parentLi = link.parentElement;
    if (link.getAttribute('href') && currentPath.includes(link.getAttribute('href'))) {
      parentLi.classList.add('active');
    } else {
      parentLi.classList.remove('active');
    }
  });

  // Populate Admin Name/Role in sidebar
  const adminData = localStorage.getItem('hostel_admin');
  if (adminData) {
    try {
      const admin = JSON.parse(adminData);
      const nameEl = document.getElementById('sidebar-admin-name');
      const avatarEl = document.getElementById('sidebar-admin-avatar');
      if (nameEl) nameEl.textContent = admin.name || 'Admin';
      if (avatarEl) avatarEl.textContent = (admin.name || 'A').charAt(0).toUpperCase();
    } catch (e) {
      console.error('Error parsing admin data', e);
    }
  }

  // Logout button handler
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to log out from the system?')) {
        localStorage.removeItem('hostel_token');
        localStorage.removeItem('hostel_admin');
        window.location.href = '/pages/login.html';
      }
    });
  }

  // Mobile sidebar toggle handler
  const mobileToggle = document.getElementById('mobile-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
});

/**
 * Toast Notification Helper
 */
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Open Modal helper
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Close Modal helper
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

/**
 * Authenticated API Fetch Helper
 */
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('hostel_token');
  
  const headers = options.headers || {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type if FormData is being sent (multer handles boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('hostel_token');
    localStorage.removeItem('hostel_admin');
    window.location.href = '/pages/login.html';
    return null;
  }

  return response;
}

/**
 * Format Currency (INR)
 */
function formatCurrency(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

/**
 * Format Date (e.g. 15 Aug 2026)
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * CSV Export utility for tables (College report generation)
 */
function exportTableToCSV(tableId, filename = 'hostel_report.csv') {
  const table = document.getElementById(tableId);
  if (!table) return;

  let csv = [];
  const rows = table.querySelectorAll('tr');

  for (let i = 0; i < rows.length; i++) {
    const row = [];
    const cols = rows[i].querySelectorAll('th, td');
    
    // Ignore actions column (last column)
    const colLength = cols.length > 1 ? cols.length - 1 : cols.length;

    for (let j = 0; j < colLength; j++) {
      // Clean up text
      let text = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, ' ').replace(/\s+/g, ' ').trim();
      text = text.replace(/"/g, '""');
      row.push('"' + text + '"');
    }
    csv.push(row.join(','));
  }

  const csvFile = new Blob([csv.join('\n')], { type: 'text/csv' });
  const downloadLink = document.createElement('a');
  downloadLink.download = filename;
  downloadLink.href = window.URL.createObjectURL(csvFile);
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  showToast(`Report downloaded as ${filename}`);
}
