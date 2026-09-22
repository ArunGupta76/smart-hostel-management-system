document.addEventListener('DOMContentLoaded', async () => {
  await loadDashboardData();
});

async function loadDashboardData() {
  try {
    const res = await fetchWithAuth('/api/dashboard/stats');
    if (!res) return;

    const result = await res.json();
    if (!result.success) {
      showToast(result.message || 'Failed to load dashboard metrics', 'error');
      return;
    }

    const { stats, recentStudents, recentPayments } = result;

    // Update Stat Cards
    document.getElementById('stat-total-students').textContent = stats.totalStudents || 0;
    document.getElementById('stat-total-rooms').textContent = stats.totalRooms || 0;
    document.getElementById('stat-occupied-beds').textContent = stats.occupiedBeds || 0;
    document.getElementById('stat-available-beds').textContent = stats.availableBeds || 0;
    document.getElementById('stat-fee-collected').textContent = formatCurrency(stats.totalFeeCollection);
    document.getElementById('stat-fee-pending').textContent = formatCurrency(stats.totalPendingFees);

    // Bed Occupancy Progress Bar
    const totalBeds = stats.totalCapacity || 1;
    const occPercentage = Math.round(((stats.occupiedBeds || 0) / totalBeds) * 100);
    const occBar = document.getElementById('occupancy-progress-bar');
    const occText = document.getElementById('occupancy-progress-text');
    if (occBar) occBar.style.width = `${occPercentage}%`;
    if (occText) occText.textContent = `${occPercentage}% Occupied (${stats.occupiedBeds}/${stats.totalCapacity} Beds)`;

    // Fee Collection Progress Bar
    const totalExpected = stats.totalExpectedFee || 1;
    const feePercentage = Math.round(((stats.totalFeeCollection || 0) / totalExpected) * 100);
    const feeBar = document.getElementById('fee-progress-bar');
    const feeText = document.getElementById('fee-progress-text');
    if (feeBar) feeBar.style.width = `${feePercentage}%`;
    if (feeText) feeText.textContent = `${feePercentage}% Collected (${formatCurrency(stats.totalFeeCollection)} / ${formatCurrency(stats.totalExpectedFee)})`;

    // Render Recent Students
    renderRecentStudents(recentStudents);

    // Render Recent Payments
    renderRecentPayments(recentPayments);

  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    showToast('Failed to load dashboard statistics', 'error');
  }
}

function renderRecentStudents(students) {
  const tbody = document.getElementById('recent-students-tbody');
  if (!tbody) return;

  if (!students || students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--gray-400); padding: 24px;">No students enrolled yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(student => `
    <tr>
      <td>
        <div class="student-cell">
          <img src="${student.photo || '/uploads/default-avatar.svg'}" class="student-avatar-sm" alt="${student.name}" onerror="this.src='/uploads/default-avatar.svg'">
          <div class="student-meta">
            <span class="name">${student.name}</span>
            <span class="sub">${student.email}</span>
          </div>
        </div>
      </td>
      <td><strong>${student.course}</strong></td>
      <td><span class="badge badge-info">Room ${student.roomNumber}</span></td>
      <td>
        ${student.dueFee > 0 
          ? `<span class="badge badge-warning">Due: ${formatCurrency(student.dueFee)}</span>` 
          : `<span class="badge badge-success"><i class="fa-solid fa-check"></i> Paid</span>`}
      </td>
      <td>
        <a href="/pages/student-profile.html?id=${student._id}" class="btn-icon view" title="View Full Profile">
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
      </td>
    </tr>
  `).join('');
}

function renderRecentPayments(payments) {
  const tbody = document.getElementById('recent-payments-tbody');
  if (!tbody) return;

  if (!payments || payments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--gray-400); padding: 20px;">No fee receipts recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = payments.map(p => `
    <tr>
      <td>
        <strong>${p.student ? p.student.name : 'Unknown'}</strong>
        <div style="font-size: 11px; color: var(--gray-500);">${p.receiptNumber}</div>
      </td>
      <td><strong style="color: var(--success);">${formatCurrency(p.amount)}</strong></td>
      <td>${p.paymentMode}</td>
      <td>${formatDate(p.paymentDate)}</td>
    </tr>
  `).join('');
}
