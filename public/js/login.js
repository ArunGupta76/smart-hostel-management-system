document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('toggle-password');
  const submitBtn = document.getElementById('submit-btn');

  // Toggle password visibility
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      const icon = togglePasswordBtn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
      }
    });
  }

  // Handle Login submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        showToast('Please enter both email and password', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Store token and admin info
          localStorage.setItem('hostel_token', data.token);
          localStorage.setItem('hostel_admin', JSON.stringify(data.admin));

          showToast('Login successful! Redirecting...', 'success');

          setTimeout(() => {
            window.location.href = '/pages/dashboard.html';
          }, 800);
        } else {
          showToast(data.message || 'Login failed', 'error');
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In to Dashboard';
        }
      } catch (err) {
        console.error('Login error:', err);
        showToast('Unable to connect to the server. Make sure server is running.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In to Dashboard';
      }
    });
  }
});
