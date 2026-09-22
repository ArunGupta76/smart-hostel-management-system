let allStudents = [];
let allRooms = [];
let isEditing = false;
let currentEditId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadStudents(), loadRoomsForDropdown()]);
  setupEventListeners();
});

function setupEventListeners() {
  // Search input live filtering
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterStudents();
    });
  }

  // Course dropdown filtering
  const courseFilter = document.getElementById('course-filter');
  if (courseFilter) {
    courseFilter.addEventListener('change', () => {
      filterStudents();
    });
  }

  // Photo input preview
  const photoInput = document.getElementById('student-photo-input');
  const photoPreview = document.getElementById('photo-preview-img');
  if (photoInput && photoPreview) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          photoPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Auto calculate due fee on fee inputs
  const totalFeeInput = document.getElementById('total-fee');
  const paidFeeInput = document.getElementById('paid-fee');
  const dueFeeDisplay = document.getElementById('due-fee-display');

  const updateDueCalculation = () => {
    const total = parseFloat(totalFeeInput.value) || 0;
    const paid = parseFloat(paidFeeInput.value) || 0;
    const due = Math.max(0, total - paid);
    if (dueFeeDisplay) {
      dueFeeDisplay.value = formatCurrency(due);
    }
  };

  if (totalFeeInput && paidFeeInput) {
    totalFeeInput.addEventListener('input', updateDueCalculation);
    paidFeeInput.addEventListener('input', updateDueCalculation);
  }

  // When room is selected in modal, auto-fill default semester price
  const roomSelect = document.getElementById('student-room-select');
  if (roomSelect) {
    roomSelect.addEventListener('change', () => {
      const selectedOption = roomSelect.options[roomSelect.selectedIndex];
      const price = selectedOption.getAttribute('data-price');
      if (price && (!totalFeeInput.value || totalFeeInput.value === '0')) {
        totalFeeInput.value = price;
        updateDueCalculation();
      }
    });
  }

  // Student Form Submit
  const studentForm = document.getElementById('student-form');
  if (studentForm) {
    studentForm.addEventListener('submit', handleStudentSubmit);
  }

  // Export CSV button
  const exportBtn = document.getElementById('btn-export-students');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportTableToCSV('students-table', 'Students_List_Report.csv');
    });
  }
}

async function loadRoomsForDropdown() {
  try {
    const res = await fetchWithAuth('/api/rooms');
    if (!res) return;
    const data = await res.json();
    if (data.success) {
      allRooms = data.data;
      populateRoomDropdown(allRooms);
    }
  } catch (err) {
    console.error('Failed to load rooms:', err);
  }
}

function populateRoomDropdown(rooms, selectedRoomId = null) {
  const roomSelect = document.getElementById('student-room-select');
  if (!roomSelect) return;

  roomSelect.innerHTML = '<option value="">-- Select Available Room --</option>';

  rooms.forEach((r) => {
    const available = Math.max(0, r.capacity - r.occupiedBeds);
    // Allow selecting room if it has available beds OR if it's currently assigned to the student being edited
    const isCurrent = selectedRoomId && selectedRoomId.toString() === r._id.toString();
    
    if (available > 0 || isCurrent) {
      const option = document.createElement('option');
      option.value = r._id;
      option.textContent = `Room ${r.roomNumber} (${r.roomType}) - ${available} beds left`;
      option.setAttribute('data-price', r.pricePerSemester || 20000);
      if (isCurrent) option.selected = true;
      roomSelect.appendChild(option);
    }
  });
}

async function loadStudents() {
  try {
    const res = await fetchWithAuth('/api/students');
    if (!res) return;
    const data = await res.json();
    if (data.success) {
      allStudents = data.data;
      renderStudentsTable(allStudents);
    }
  } catch (err) {
    console.error('Error fetching students:', err);
    showToast('Failed to fetch students list', 'error');
  }
}

function filterStudents() {
  const query = document.getElementById('search-input').value.toLowerCase().trim();
  const course = document.getElementById('course-filter').value;

  let filtered = allStudents.filter((student) => {
    const matchQuery =
      student.name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      student.mobile.toLowerCase().includes(query) ||
      student.roomNumber.toLowerCase().includes(query);

    const matchCourse = course === 'all' || !course || student.course.includes(course);

    return matchQuery && matchCourse;
  });

  renderStudentsTable(filtered);
}

function renderStudentsTable(students) {
  const tbody = document.getElementById('students-tbody');
  const countEl = document.getElementById('student-total-count');
  if (countEl) countEl.textContent = `Showing ${students.length} Student(s)`;

  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--gray-400); padding: 32px;">No matching students found.</td></tr>`;
    return;
  }

  tbody.innerHTML = students
    .map(
      (s) => `
    <tr>
      <td>
        <div class="student-cell">
          <img src="${s.photo || '/uploads/default-avatar.svg'}" class="student-avatar-sm" alt="${s.name}" onerror="this.src='/uploads/default-avatar.svg'">
          <div class="student-meta">
            <span class="name">${s.name}</span>
            <span class="sub">${s.email}</span>
          </div>
        </div>
      </td>
      <td><strong>${s.mobile}</strong></td>
      <td><span class="badge badge-info">${s.course}</span></td>
      <td><strong>Room ${s.roomNumber}</strong></td>
      <td>${formatCurrency(s.totalFee)}</td>
      <td><span style="color: var(--success); font-weight: 600;">${formatCurrency(s.paidFee)}</span></td>
      <td>
        ${
          s.dueFee > 0
            ? `<span class="badge badge-warning">Due: ${formatCurrency(s.dueFee)}</span>`
            : `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Paid</span>`
        }
      </td>
      <td>
        <div class="action-btn-group">
          <a href="/pages/student-profile.html?id=${s._id}" class="btn-icon view" title="View Full Profile">
            <i class="fa-solid fa-eye"></i>
          </a>
          <button class="btn-icon edit" onclick="openEditStudentModal('${s._id}')" title="Edit Student">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn-icon delete" onclick="confirmDeleteStudent('${s._id}', '${s.name}')" title="Delete Student">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  `
    )
    .join('');
}

function openAddStudentModal() {
  isEditing = false;
  currentEditId = null;

  document.getElementById('student-modal-title').textContent = 'Register New Student';
  document.getElementById('student-form').reset();
  document.getElementById('photo-preview-img').src = '/uploads/default-avatar.svg';
  document.getElementById('due-fee-display').value = '₹0';
  document.getElementById('paid-fee-group').style.display = 'block';

  // Refresh room dropdown
  populateRoomDropdown(allRooms);

  openModal('student-modal');
}

function openEditStudentModal(id) {
  const student = allStudents.find((s) => s._id === id);
  if (!student) return;

  isEditing = true;
  currentEditId = id;

  document.getElementById('student-modal-title').textContent = 'Edit Student Details';
  document.getElementById('student-name').value = student.name;
  document.getElementById('student-email').value = student.email;
  document.getElementById('student-mobile').value = student.mobile;
  document.getElementById('student-course').value = student.course;
  document.getElementById('student-address').value = student.address;
  document.getElementById('guardian-name').value = student.guardianName || '';
  document.getElementById('guardian-mobile').value = student.guardianMobile || '';
  document.getElementById('total-fee').value = student.totalFee;
  document.getElementById('paid-fee').value = student.paidFee;
  document.getElementById('due-fee-display').value = formatCurrency(student.dueFee);
  document.getElementById('photo-preview-img').src = student.photo || '/uploads/default-avatar.svg';

  // Hide initial paid fee during edit (fees are updated via payments)
  document.getElementById('paid-fee-group').style.display = 'none';

  // Populate room dropdown with current student room selected
  populateRoomDropdown(allRooms, student.room ? student.room._id || student.room : null);

  openModal('student-modal');
}

async function handleStudentSubmit(e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append('name', document.getElementById('student-name').value.trim());
  formData.append('email', document.getElementById('student-email').value.trim());
  formData.append('mobile', document.getElementById('student-mobile').value.trim());
  formData.append('course', document.getElementById('student-course').value.trim());
  formData.append('room', document.getElementById('student-room-select').value);
  formData.append('address', document.getElementById('student-address').value.trim());
  formData.append('guardianName', document.getElementById('guardian-name').value.trim());
  formData.append('guardianMobile', document.getElementById('guardian-mobile').value.trim());
  formData.append('totalFee', document.getElementById('total-fee').value);

  if (!isEditing) {
    formData.append('paidFee', document.getElementById('paid-fee').value || 0);
  }

  const photoFile = document.getElementById('student-photo-input').files[0];
  if (photoFile) {
    formData.append('photo', photoFile);
  }

  const url = isEditing ? `/api/students/${currentEditId}` : '/api/students';
  const method = isEditing ? 'PUT' : 'POST';

  try {
    const saveBtn = document.getElementById('btn-save-student');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    const res = await fetchWithAuth(url, {
      method: method,
      body: formData
    });

    const data = await res.json();

    saveBtn.disabled = false;
    saveBtn.innerHTML = 'Save Student';

    if (res.ok && data.success) {
      showToast(isEditing ? 'Student updated successfully' : 'Student registered successfully', 'success');
      closeModal('student-modal');
      await Promise.all([loadStudents(), loadRoomsForDropdown()]);
    } else {
      showToast(data.message || 'Failed to save student', 'error');
    }
  } catch (err) {
    console.error('Error saving student:', err);
    showToast('Failed to save student details', 'error');
  }
}

async function confirmDeleteStudent(id, name) {
  if (confirm(`Are you sure you want to delete student "${name}"? This will free their room bed and remove their fee records.`)) {
    try {
      const res = await fetchWithAuth(`/api/students/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Student deleted successfully', 'success');
        await Promise.all([loadStudents(), loadRoomsForDropdown()]);
      } else {
        showToast(data.message || 'Failed to delete student', 'error');
      }
    } catch (err) {
      console.error('Delete student error:', err);
      showToast('Error deleting student', 'error');
    }
  }
}
