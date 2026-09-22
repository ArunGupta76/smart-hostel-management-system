document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const studentId = urlParams.get('id');

  if (!studentId) {
    showToast('No student selected', 'error');
    setTimeout(() => {
      window.location.href = '/pages/students.html';
    }, 1500);
    return;
  }

  await loadStudentProfile(studentId);

  // Print Profile button handler
  const printBtn = document.getElementById('btn-print-profile');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
});

async function loadStudentProfile(id) {
  try {
    const res = await fetchWithAuth(`/api/students/${id}`);
    if (!res) return;

    const result = await res.json();
    if (!result.success) {
      showToast(result.message || 'Student not found', 'error');
      return;
    }

    const s = result.data;

    // Profile Card Info
    document.getElementById('profile-img').src = s.photo || '/uploads/default-avatar.svg';
    document.getElementById('profile-name').textContent = s.name;
    document.getElementById('profile-course').textContent = s.course;
    document.getElementById('profile-status-badge').className = `badge ${s.status === 'Active' ? 'badge-success' : 'badge-danger'}`;
    document.getElementById('profile-status-badge').textContent = s.status;

    // Contact & Personal Details
    document.getElementById('profile-email').textContent = s.email;
    document.getElementById('profile-mobile').textContent = s.mobile;
    document.getElementById('profile-admission-date').textContent = formatDate(s.admissionDate);
    document.getElementById('profile-guardian-name').textContent = s.guardianName || 'N/A';
    document.getElementById('profile-guardian-mobile').textContent = s.guardianMobile || 'N/A';
    document.getElementById('profile-address').textContent = s.address;

    // Allocated Room Details
    document.getElementById('profile-room-number').textContent = `Room ${s.roomNumber}`;
    if (s.room) {
      document.getElementById('profile-room-type').textContent = s.room.roomType || 'Standard';
      document.getElementById('profile-room-floor').textContent = `Floor ${s.room.floor || 1}`;
    }

    // Fee Statistics
    document.getElementById('profile-total-fee').textContent = formatCurrency(s.totalFee);
    document.getElementById('profile-paid-fee').textContent = formatCurrency(s.paidFee);
    document.getElementById('profile-due-fee').textContent = formatCurrency(s.dueFee);

    const feePct = s.totalFee > 0 ? Math.round((s.paidFee / s.totalFee) * 100) : 100;
    const feeBar = document.getElementById('profile-fee-bar');
    const feePctText = document.getElementById('profile-fee-percentage');
    if (feeBar) feeBar.style.width = `${feePct}%`;
    if (feePctText) feePctText.textContent = `${feePct}% Cleared`;

    // Render Student's Payments
    renderStudentPayments(s.payments);

    // Link "Add Payment" button to payments page with student preselected
    const addPaymentBtn = document.getElementById('btn-add-student-payment');
    if (addPaymentBtn) {
      addPaymentBtn.href = `/pages/payments.html?studentId=${s._id}`;
    }

  } catch (error) {
    console.error('Error loading profile:', error);
    showToast('Failed to load student profile', 'error');
  }
}

function renderStudentPayments(payments) {
  const tbody = document.getElementById('student-payments-tbody');
  if (!tbody) return;

  if (!payments || payments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--gray-400); padding: 24px;">No fee receipts recorded yet for this student.</td></tr>`;
    return;
  }

  tbody.innerHTML = payments.map(p => `
    <tr>
      <td><strong>${p.receiptNumber}</strong></td>
      <td><strong style="color: var(--success);">${formatCurrency(p.amount)}</strong></td>
      <td><span class="badge badge-info">${p.paymentMode}</span></td>
      <td>${formatDate(p.paymentDate)}</td>
      <td>${p.remarks || 'Fee installment'}</td>
    </tr>
  `).join('');
}
