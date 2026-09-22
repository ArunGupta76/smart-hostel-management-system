let allRooms = [];
let isEditingRoom = false;
let currentEditRoomId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadRooms();
  setupEventListeners();
});

function setupEventListeners() {
  // Status filter
  const statusFilter = document.getElementById('room-status-filter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      filterRooms();
    });
  }

  // Search input
  const searchInput = document.getElementById('room-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      filterRooms();
    });
  }

  // Room Form Submit
  const roomForm = document.getElementById('room-form');
  if (roomForm) {
    roomForm.addEventListener('submit', handleRoomSubmit);
  }

  // Export CSV
  const exportBtn = document.getElementById('btn-export-rooms');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportTableToCSV('rooms-table', 'Rooms_Report.csv');
    });
  }
}

async function loadRooms() {
  try {
    const res = await fetchWithAuth('/api/rooms');
    if (!res) return;

    const result = await res.json();
    if (result.success) {
      allRooms = result.data;
      updateRoomSummaryMetrics(allRooms);
      renderRooms(allRooms);
    }
  } catch (error) {
    console.error('Error fetching rooms:', error);
    showToast('Failed to fetch rooms', 'error');
  }
}

function updateRoomSummaryMetrics(rooms) {
  const total = rooms.length;
  let full = 0;
  let available = 0;
  let maint = 0;

  rooms.forEach((r) => {
    if (r.status === 'Full') full++;
    else if (r.status === 'Maintenance') maint++;
    else available++;
  });

  const totalEl = document.getElementById('total-rooms-count');
  const availEl = document.getElementById('available-rooms-count');
  const fullEl = document.getElementById('full-rooms-count');

  if (totalEl) totalEl.textContent = total;
  if (availEl) availEl.textContent = available;
  if (fullEl) fullEl.textContent = full;
}

function filterRooms() {
  const query = document.getElementById('room-search-input').value.toUpperCase().trim();
  const status = document.getElementById('room-status-filter').value;

  let filtered = allRooms.filter((r) => {
    const matchQuery = r.roomNumber.toUpperCase().includes(query) || r.roomType.toUpperCase().includes(query);
    const matchStatus = status === 'all' || !status || r.status === status;
    return matchQuery && matchStatus;
  });

  renderRooms(filtered);
}

function renderRooms(rooms) {
  const gridContainer = document.getElementById('rooms-grid-container');
  const tableBody = document.getElementById('rooms-table-tbody');

  // Render Visual Grid
  if (gridContainer) {
    if (rooms.length === 0) {
      gridContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--gray-400); padding: 40px;">No rooms found.</div>`;
    } else {
      gridContainer.innerHTML = rooms
        .map((r) => {
          const availableBeds = Math.max(0, r.capacity - r.occupiedBeds);
          const badgeClass =
            r.status === 'Available'
              ? 'badge-success'
              : r.status === 'Full'
              ? 'badge-danger'
              : 'badge-warning';

          // Generate bed visual indicators
          let bedPills = '';
          for (let i = 0; i < r.capacity; i++) {
            const isOccupied = i < r.occupiedBeds;
            bedPills += `<div class="bed-slot-pill ${isOccupied ? 'occupied' : 'available'}" title="${isOccupied ? 'Occupied Bed' : 'Available Bed'}"></div>`;
          }

          return `
          <div class="room-card">
            <div>
              <div class="room-card-header">
                <div class="room-number-box">
                  <div class="room-icon-badge">
                    <i class="fa-solid fa-door-open"></i>
                  </div>
                  <div class="room-title-info">
                    <h3>Room ${r.roomNumber}</h3>
                    <span>Floor ${r.floor} • ${r.roomType}</span>
                  </div>
                </div>
                <span class="badge ${badgeClass}">${r.status}</span>
              </div>

              <div class="beds-meter">
                <div class="beds-label-row">
                  <span>Bed Capacity: ${r.occupiedBeds} / ${r.capacity} Beds</span>
                  <span>${availableBeds} Available</span>
                </div>
                <div class="beds-slots">
                  ${bedPills}
                </div>
              </div>

              <div class="room-specs">
                <div class="spec-item">
                  <span>Semester Rent</span>
                  <strong>${formatCurrency(r.pricePerSemester)}</strong>
                </div>
                <div class="spec-item">
                  <span>Available Beds</span>
                  <strong style="color: ${availableBeds > 0 ? 'var(--success)' : 'var(--danger)'};">${availableBeds} Beds</strong>
                </div>
              </div>

              <p style="font-size: 12px; color: var(--gray-500); line-height: 1.4; margin-top: 6px;">
                ${r.description || 'Standard hostel accommodation.'}
              </p>
            </div>

            <div class="room-card-footer">
              <button class="btn btn-secondary btn-sm" onclick="viewRoomOccupants('${r._id}')">
                <i class="fa-solid fa-users"></i> Occupants (${r.occupiedBeds})
              </button>
              <div class="action-btn-group">
                <button class="btn-icon edit" onclick="openEditRoomModal('${r._id}')" title="Edit Room">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="btn-icon delete" onclick="confirmDeleteRoom('${r._id}', '${r.roomNumber}')" title="Delete Room">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        `;
        })
        .join('');
    }
  }

  // Also populate hidden/report table for CSV export
  if (tableBody) {
    tableBody.innerHTML = rooms
      .map(
        (r) => `
      <tr>
        <td><strong>Room ${r.roomNumber}</strong></td>
        <td>Floor ${r.floor}</td>
        <td>${r.roomType}</td>
        <td>${r.capacity} Beds</td>
        <td>${r.occupiedBeds} Beds</td>
        <td>${Math.max(0, r.capacity - r.occupiedBeds)} Beds</td>
        <td>${formatCurrency(r.pricePerSemester)}</td>
        <td><span class="badge ${r.status === 'Available' ? 'badge-success' : 'badge-danger'}">${r.status}</span></td>
      </tr>
    `
      )
      .join('');
  }
}

function openAddRoomModal() {
  isEditingRoom = false;
  currentEditRoomId = null;

  document.getElementById('room-modal-title').textContent = 'Add New Room';
  document.getElementById('room-form').reset();
  openModal('room-modal');
}

function openEditRoomModal(id) {
  const room = allRooms.find((r) => r._id === id);
  if (!room) return;

  isEditingRoom = true;
  currentEditRoomId = id;

  document.getElementById('room-modal-title').textContent = `Edit Room ${room.roomNumber}`;
  document.getElementById('room-number').value = room.roomNumber;
  document.getElementById('room-floor').value = room.floor;
  document.getElementById('room-type').value = room.roomType;
  document.getElementById('room-capacity').value = room.capacity;
  document.getElementById('room-price').value = room.pricePerSemester;
  document.getElementById('room-status').value = room.status;
  document.getElementById('room-desc').value = room.description || '';

  openModal('room-modal');
}

async function handleRoomSubmit(e) {
  e.preventDefault();

  const payload = {
    roomNumber: document.getElementById('room-number').value.trim(),
    floor: document.getElementById('room-floor').value,
    roomType: document.getElementById('room-type').value,
    capacity: document.getElementById('room-capacity').value,
    pricePerSemester: document.getElementById('room-price').value,
    status: document.getElementById('room-status').value,
    description: document.getElementById('room-desc').value.trim()
  };

  const url = isEditingRoom ? `/api/rooms/${currentEditRoomId}` : '/api/rooms';
  const method = isEditingRoom ? 'PUT' : 'POST';

  try {
    const res = await fetchWithAuth(url, {
      method: method,
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok && data.success) {
      showToast(isEditingRoom ? 'Room updated successfully' : 'Room added successfully', 'success');
      closeModal('room-modal');
      await loadRooms();
    } else {
      showToast(data.message || 'Failed to save room', 'error');
    }
  } catch (error) {
    console.error('Room save error:', error);
    showToast('Server error while saving room', 'error');
  }
}

async function viewRoomOccupants(id) {
  try {
    const res = await fetchWithAuth(`/api/rooms/${id}`);
    if (!res) return;

    const result = await res.json();
    if (!result.success) {
      showToast(result.message || 'Failed to get room occupants', 'error');
      return;
    }

    const room = result.data;
    document.getElementById('occupants-modal-title').textContent = `Occupants of Room ${room.roomNumber}`;
    const listContainer = document.getElementById('occupants-list-container');

    if (!room.students || room.students.length === 0) {
      listContainer.innerHTML = `<div style="text-align: center; color: var(--gray-400); padding: 30px;">This room has no active occupants right now.</div>`;
    } else {
      listContainer.innerHTML = room.students
        .map(
          (s) => `
        <div class="occupant-item">
          <div class="occupant-info-left">
            <img src="${s.photo || '/uploads/default-avatar.svg'}" alt="${s.name}" onerror="this.src='/uploads/default-avatar.svg'">
            <div>
              <strong style="color: var(--gray-800);">${s.name}</strong>
              <div style="font-size: 11px; color: var(--gray-500);">${s.course} • ${s.mobile}</div>
            </div>
          </div>
          <a href="/pages/student-profile.html?id=${s._id}" class="btn btn-secondary btn-sm">
            View Profile
          </a>
        </div>
      `
        )
        .join('');
    }

    openModal('occupants-modal');
  } catch (error) {
    console.error('Occupants fetch error:', error);
    showToast('Failed to retrieve occupants', 'error');
  }
}

async function confirmDeleteRoom(id, roomNumber) {
  if (confirm(`Are you sure you want to delete Room ${roomNumber}? Note: Rooms with active occupants cannot be deleted.`)) {
    try {
      const res = await fetchWithAuth(`/api/rooms/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Room ${roomNumber} deleted successfully`, 'success');
        await loadRooms();
      } else {
        showToast(data.message || 'Cannot delete room', 'error');
      }
    } catch (error) {
      console.error('Delete room error:', error);
      showToast('Error deleting room', 'error');
    }
  }
}
