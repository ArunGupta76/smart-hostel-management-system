let allPayments = [];
let allStudents = [];

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadPayments(), loadStudentsForPayment()]);
  setupEventListeners();

  // If redirected with ?studentId=..., open add payment modal with that student preselected
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedStudentId = urlParams.get('studentId');
  if (preselectedStudentId) {
    openAddPaymentModal(preselectedStudentId);
  }
});

function setupEventListeners() {
  // Search payments
  const searchInput = document.getElementById('payment-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      filterPayments();
    });
  }

  // Student dropdown selection listener in Add Payment Modal
  const studentSelect = document.getElementById('payment-student-select');
  if (studentSelect) {
    studentSelect.addEventListener('change', () => {
      const selectedId = studentSelect.value;
      updateStudentFeePreview(selectedId);
    });
  }

  // Payment Form Submit
  const paymentForm = document.getElementById('payment-form');
  if (paymentForm) {
    paymentForm.addEventListener('submit', handlePaymentSubmit);
  }

  // Export CSV
  const exportBtn = document.getElementById('btn-export-payments');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportTableToCSV('payments-table', 'Fee_Payment_Report.csv');
    });
  }

  // Print Receipt Button inside modal
  const printReceiptBtn = document.getElementById('btn-print-receipt');
  if (printReceiptBtn) {
    printReceiptBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

async function loadStudentsForPayment() {
  try {
    const res = await fetchWithAuth('/api/students');
    if (!res) return;

    const data = await res.json();
    if (data.success) {
      allStudents = data.data;
      const studentSelect = document.getElementById('payment-student-select');
      if (studentSelect) {
        studentSelect.innerHTML = '<option value="">-- Choose Student --</option>';
        allStudents.forEach((s) => {
          const option = document.createElement('option');
          option.value = s._id;
          option.textContent = `${s.name} (Room ${s.roomNumber}) - Due: ₹${s.dueFee}`;
          studentSelect.appendChild(option);
        });
      }
    }
  } catch (err) {
    console.error('Error loading students for payments:', err);
  }
}

function updateStudentFeePreview(studentId) {
  const previewBox = document.getElementById('student-fee-preview');
  const amountInput = document.getElementById('payment-amount');

  if (!studentId) {
    if (previewBox) previewBox.classList.remove('show');
    return;
  }

  const student = allStudents.find((s) => s._id === studentId);
  if (student && previewBox) {
    document.getElementById('preview-total-fee').textContent = formatCurrency(student.totalFee);
    document.getElementById('preview-paid-fee').textContent = formatCurrency(student.paidFee);
    document.getElementById('preview-due-fee').textContent = formatCurrency(student.dueFee);
    previewBox.classList.add('show');

    // Auto populate amount with pending balance if greater than 0
    if (amountInput && (!amountInput.value || amountInput.value === '0') && student.dueFee > 0) {
      amountInput.value = student.dueFee;
    }
  }
}

async function loadPayments() {
  try {
    const res = await fetchWithAuth('/api/payments');
    if (!res) return;

    const result = await res.json();
    if (result.success) {
      allPayments = result.data;
      updatePaymentSummaries(allPayments);
      renderPayments(allPayments);
    }
  } catch (error) {
    console.error('Error fetching payments:', error);
    showToast('Failed to fetch payments list', 'error');
  }
}

function updatePaymentSummaries(payments) {
  const totalAmount = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalCollectedEl = document.getElementById('total-payments-collected');
  if (totalCollectedEl) totalCollectedEl.textContent = formatCurrency(totalAmount);

  // Calculate pending from students
  const pendingTotal = allStudents.reduce((acc, s) => acc + (s.dueFee || 0), 0);
  const totalPendingEl = document.getElementById('total-payments-pending');
  if (totalPendingEl) totalPendingEl.textContent = formatCurrency(pendingTotal);
}

function filterPayments() {
  const query = document.getElementById('payment-search-input').value.toLowerCase().trim();

  let filtered = allPayments.filter((p) => {
    const studentName = p.student ? p.student.name.toLowerCase() : '';
    const receipt = p.receiptNumber.toLowerCase();
    const mode = p.paymentMode.toLowerCase();
    const room = p.student && p.student.roomNumber ? p.student.roomNumber.toLowerCase() : '';

    return studentName.includes(query) || receipt.includes(query) || mode.includes(query) || room.includes(query);
  });

  renderPayments(filtered);
}

function renderPayments(payments) {
  const tbody = document.getElementById('payments-table-tbody');
  const countEl = document.getElementById('payment-total-count');
  if (countEl) countEl.textContent = `Showing ${payments.length} Transactions`;

  if (!tbody) return;

  if (payments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--gray-400); padding: 36px;">No payment transactions found.</td></tr>`;
    return;
  }

  tbody.innerHTML = payments
    .map(
      (p) => `
    <tr>
      <td><strong>${p.receiptNumber}</strong></td>
      <td>
        <strong>${p.student ? p.student.name : 'N/A'}</strong>
        <div style="font-size: 11px; color: var(--gray-500);">${p.student ? p.student.email : ''}</div>
      </td>
      <td><span class="badge badge-info">Room ${p.student ? p.student.roomNumber : 'N/A'}</span></td>
      <td><strong style="color: var(--success); font-size: 14px;">${formatCurrency(p.amount)}</strong></td>
      <td>${formatDate(p.paymentDate)}</td>
      <td><span class="badge badge-success">${p.paymentMode}</span></td>
      <td>
        <div class="action-btn-group">
          <button class="btn-icon view" onclick="viewPaymentReceipt('${p._id}')" title="Print / View Receipt">
            <i class="fa-solid fa-receipt"></i>
          </button>
          <button class="btn-icon delete" onclick="confirmDeletePayment('${p._id}', '${p.receiptNumber}')" title="Delete Payment Record">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  `
    )
    .join('');
}

function openAddPaymentModal(preselectedStudentId = null) {
  document.getElementById('payment-form').reset();
  const previewBox = document.getElementById('student-fee-preview');
  if (previewBox) previewBox.classList.remove('show');

  // Set today's date in payment date input
  const dateInput = document.getElementById('payment-date');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  if (preselectedStudentId) {
    const studentSelect = document.getElementById('payment-student-select');
    if (studentSelect) {
      studentSelect.value = preselectedStudentId;
      updateStudentFeePreview(preselectedStudentId);
    }
  }

  openModal('payment-modal');
}

async function handlePaymentSubmit(e) {
  e.preventDefault();

  const payload = {
    student: document.getElementById('payment-student-select').value,
    amount: document.getElementById('payment-amount').value,
    paymentDate: document.getElementById('payment-date').value,
    paymentMode: document.getElementById('payment-mode').value,
    remarks: document.getElementById('payment-remarks').value.trim()
  };

  if (!payload.student || !payload.amount) {
    showToast('Please choose a student and enter an amount', 'error');
    return;
  }

  try {
    const saveBtn = document.getElementById('btn-save-payment');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    const res = await fetchWithAuth('/api/payments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    saveBtn.disabled = false;
    saveBtn.innerHTML = 'Confirm Payment';

    if (res.ok && data.success) {
      showToast('Payment recorded successfully!', 'success');
      closeModal('payment-modal');
      await Promise.all([loadPayments(), loadStudentsForPayment()]);

      // Automatically offer to view the generated receipt!
      if (data.data && data.data._id) {
        viewPaymentReceipt(data.data._id);
      }
    } else {
      showToast(data.message || 'Failed to record payment', 'error');
    }
  } catch (error) {
    console.error('Payment submit error:', error);
    showToast('Failed to record payment', 'error');
  }
}

async function viewPaymentReceipt(paymentId) {
  try {
    const res = await fetchWithAuth(`/api/payments/${paymentId}`);
    if (!res) return;

    const result = await res.json();
    if (!result.success) {
      showToast('Failed to load receipt details', 'error');
      return;
    }

    const p = result.data;
    const s = p.student || {};

    document.getElementById('receipt-number-text').textContent = p.receiptNumber;
    document.getElementById('receipt-date-text').textContent = formatDate(p.paymentDate);
    document.getElementById('receipt-student-name').textContent = s.name || 'N/A';
    document.getElementById('receipt-student-course').textContent = s.course || 'N/A';
    document.getElementById('receipt-student-room').textContent = `Room ${s.roomNumber || 'N/A'}`;
    document.getElementById('receipt-student-mobile').textContent = s.mobile || 'N/A';
    document.getElementById('receipt-amount-text').textContent = formatCurrency(p.amount);
    document.getElementById('receipt-mode-text').textContent = p.paymentMode;
    document.getElementById('receipt-remarks-text').textContent = p.remarks || 'Semester Fee Installment';

    document.getElementById('receipt-total-fee').textContent = formatCurrency(s.totalFee);
    document.getElementById('receipt-paid-fee').textContent = formatCurrency(s.paidFee);
    document.getElementById('receipt-due-fee').textContent = formatCurrency(s.dueFee);

    openModal('receipt-modal');
  } catch (error) {
    console.error('Receipt error:', error);
    showToast('Could not display receipt', 'error');
  }
}

async function confirmDeletePayment(id, receiptNumber) {
  if (confirm(`Are you sure you want to delete receipt "${receiptNumber}"? The student's fee balance will be automatically reversed.`)) {
    try {
      const res = await fetchWithAuth(`/api/payments/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Payment deleted and student fee adjusted', 'success');
        await Promise.all([loadPayments(), loadStudentsForPayment()]);
      } else {
        showToast(data.message || 'Failed to delete payment', 'error');
      }
    } catch (error) {
      console.error('Delete payment error:', error);
      showToast('Error deleting payment', 'error');
    }
  }
}
