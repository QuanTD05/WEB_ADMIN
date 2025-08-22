import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  DoughnutController,
  ArcElement
} from 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/+esm';

Chart.register(
  BarController, BarElement, CategoryScale, LinearScale,
  Title, Tooltip, Legend,
  LineElement, PointElement,
  DoughnutController, ArcElement
);

// Firebase core
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// Firebase Database
import {
 getDatabase, ref, set, update, remove, onValue, push 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Firebase Storage
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// === Firebase Config ===
const firebaseConfig = {
  apiKey: "AIzaSyBsf_IgEEci-NbSXDGLB7mQZvP_SRGMD6o",
  authDomain: "appmobile-c561a.firebaseapp.com",
  databaseURL: "https://appmobile-c561a-default-rtdb.firebaseio.com",
  projectId: "appmobile-c561a",
  storageBucket: "appmobile-c561a.appspot.com",
  messagingSenderId: "75581709372",
  appId: "1:75581709372:web:484cde5c4141fc7aef3739"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);
const storage = getStorage(app);

// === ADMIN LOGIN / LOGOUT ===
let staffId = localStorage.getItem("staffId");
if (!staffId) {
  staffId = prompt("Nhập ID admin:");
  if (!staffId) {
    alert("Bạn cần nhập ID admin để tiếp tục.");
    throw new Error("No staffId");
  }
  localStorage.setItem("staffId", staffId);
}
const userRef = ref(db, `users/${staffId}`);

onValue(userRef, (snap) => {
  if (!snap.exists()) {
    alert("Không tìm thấy tài khoản.");
    return;
  }
  const user = snap.val();
  document.getElementById("staffName").textContent =
    user.fullName || "Admin";
  document.getElementById("staffAvatar").src =
    user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || "Admin")}`;

  if (user.role !== "admin") {
    alert("Bạn không có quyền truy cập trang quản trị.");
    document.querySelectorAll("section").forEach(s => s.classList.add("d-none"));
    return;
  }

  // ✅ Sau khi xác thực, vào Tổng quan
  activateNav(document.querySelector('.sidebar .nav-link[onclick*="dashboard"]'));
  showSection("dashboard");
}, { onlyOnce: true });

// logout
window.logoutAdmin = function () {
  if (!confirm("Bạn có chắc chắn muốn đăng xuất?")) return;

  // Xoá thông tin đăng nhập cục bộ
  localStorage.removeItem("staffId");

  // Nếu dùng Firebase Auth (nếu sau này gắn thêm), bỏ comment phần dưới:
  // import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
  // const auth = getAuth(app);
  // signOut(auth).catch(e => console.warn("Sign out error:", e));

  // Tải lại để prompt lại ID hoặc chuyển về trang login nếu có
  location.reload();
 window.location.href = "login.html"
};

// === SECTION SWITCH & NAV ACTIVE ===
function hideAllSections() {
  document.querySelectorAll("section").forEach(s => s.classList.add("d-none"));
}
window.activateNav = function(el) {
  document.querySelectorAll(".sidebar .nav-link").forEach(n => n.classList.remove("active"));
  el?.classList?.add("active");
};
window.showSection = function (id) {
  hideAllSections();
  const sec = document.getElementById(id);
  if (sec) sec.classList.remove("d-none");

  // Gọi loader theo tab nếu có
  if (id === "dashboard"  && typeof loadDashboard   === "function") loadDashboard();
  if (id === "users"      && typeof loadUsers       === "function") loadUsers();
  if (id === "products"   && typeof loadProducts    === "function") loadProducts();
  if (id === "promotions" && typeof loadPromotions  === "function") loadPromotions();
  if (id === "orders"     && typeof loadAllOrders   === "function") loadAllOrders(); // nếu bạn có
};

// === SIDEBAR ORDER SUBMENU ===
window.toggleOrderSubmenu = function () {
  const submenu = document.getElementById("orderSubmenu");
  const arrow = document.getElementById("orderMenuArrow");
  if (!submenu || !arrow) return;
  submenu.classList.toggle("d-none");
  arrow.textContent = submenu.classList.contains("d-none") ? "▾" : "▴";
};

const orderGroupIds = [
  "pending",
  "ondelivery",
  "completed",
  "return_requested",
  "returned",
  "cancelled",
];

window.showOrderCategory = function (status) {
  // Hiển thị trang đơn hàng (hoặc dashboard tuỳ bạn)
  showSection("orders");

  orderGroupIds.forEach((s) => {
    const group = document.getElementById(`group_${s}`);
    if (!group) return;
    if (status === "all") group.classList.remove("d-none");
    else group.classList.toggle("d-none", s !== status);
  });

  // Active style cho submenu
  document.querySelectorAll("#orderSubmenu button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === status);
  });
};

// === FILTER ORDER ===
window.applyAdminFilter = function () {
  const keyword = document.getElementById("orderSearchInput")?.value.trim().toLowerCase() || "";
  const allRows = document.querySelectorAll("tbody tr");
  allRows.forEach(row => {
    const orderId = (row.children[0]?.textContent || "").toLowerCase();
    const receiverName = (row.children[1]?.textContent || "").toLowerCase();
    row.style.display = (orderId.includes(keyword) || receiverName.includes(keyword)) ? "" : "none";
  });
};

// ✅ Mặc định khi vừa load trang (trước khi onValue xong), cho hiện Tổng quan để tránh màn hình trống
window.addEventListener("DOMContentLoaded", () => {
  activateNav(document.querySelector('.sidebar .nav-link[onclick*="dashboard"]'));
  showSection("dashboard");
});

// === FILTER ORDER ===
window.applyAdminFilter = function () {
  const keyword = document.getElementById("orderSearchInput").value.trim().toLowerCase();
  const allRows = document.querySelectorAll("tbody tr");
  allRows.forEach(row => {
    const orderId = (row.children[0]?.textContent || "").toLowerCase();
    const receiverName = (row.children[1]?.textContent || "").toLowerCase();
    if (orderId.includes(keyword) || receiverName.includes(keyword)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
};

// === QUẢN LÝ NHÂN VIÊN (staff) ===
window.loadUsers = function () {
  const userTable = document.getElementById("userTableBody");
  onValue(ref(db, "users"), (snapshot) => {
    userTable.innerHTML = "";
    snapshot.forEach(child => {
      const user = child.val();
      if (user.role !== "staff") return; // chỉ lấy staff
      if (user.deleted) return; // đã xoá (đánh dấu) thì ẩn
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><img src="${user.avatar || 'https://ui-avatars.com/api/?name='+encodeURIComponent(user.fullName||'S')}" class="rounded-circle" width="40" height="40" /></td>
        <td>${escapeHtml(user.fullName || "")}</td>
        <td>${escapeHtml(user.email || "")}</td>
        <td>${escapeHtml(user.phone || "")}</td>
        <td>${escapeHtml(user.role || "")}</td>
        <td>
          <button class="btn btn-sm btn-warning me-1" onclick="editUser('${child.key}')">Sửa</button>
          <button class="btn btn-sm btn-danger" onclick="deleteUser('${child.key}')">Xoá</button>
        </td>
      `;
      userTable.appendChild(tr);
    });
  });
};

window.filterStaff = function () {
  const keyword = document.getElementById("userSearchInput").value.trim().toLowerCase();
  const rows = document.querySelectorAll("#userTableBody tr");
  rows.forEach(row => {
    const name = (row.children[1]?.textContent || "").toLowerCase();
    const email = (row.children[2]?.textContent || "").toLowerCase();
    row.style.display = (name.includes(keyword) || email.includes(keyword)) ? "" : "none";
  });
};

// Thêm nhân viên mới (role = staff)
document.getElementById("addStaffForm")?.addEventListener("submit", function (e) {
  e.preventDefault();
  const fullName = document.getElementById("newFullName").value.trim();
  const email = document.getElementById("newEmail").value.trim();
  const phone = document.getElementById("newPhone").value.trim();
  const password = document.getElementById("newPassword").value;

  if (!fullName || !email || !password) {
    alert("Họ tên, email và mật khẩu bắt buộc.");
    return;
  }
  if (!validateEmail(email)) {
    alert("Email không hợp lệ.");
    return;
  }

  // tạo ID mới
  const newRef = ref(db, "users").push();
  const userId = newRef.key;

  const newUser = {
    fullName,
    email,
    phone: phone || "",
    role: "staff",
    avatar: "", // để trống hoặc gắn mặc định
    password, // **lưu thô, nên băm / chuyển sang auth sau**
    createdAt: Date.now()
  };

  update(ref(db, `users/${userId}`), newUser)
    .then(() => {
      alert("Đã thêm nhân viên.");
      const addModal = bootstrap.Modal.getInstance(document.getElementById("addStaffModal"));
      if (addModal) addModal.hide();
      document.getElementById("addStaffForm").reset();
    })
    .catch(err => {
      alert("Lỗi: " + err.message);
    });
});

window.editUser = function (id) {
  const userRefObj = ref(db, `users/${id}`);
  onValue(userRefObj, (snapshot) => {
    if (!snapshot.exists()) {
      alert("Không tìm thấy nhân viên.");
      return;
    }
    const user = snapshot.val();
    if (user.role !== "staff") {
      alert("Chỉ có thể chỉnh sửa nhân viên (staff).");
      return;
    }
    showUserEditModal(id, user);
  }, { onlyOnce: true });
};

function showUserEditModal(userId, user) {
  // xoá modal cũ nếu có
  const existing = document.getElementById("editUserModal");
  if (existing) existing.remove();

  const html = `
  <div class="modal fade" id="editUserModal" tabindex="-1" aria-labelledby="editUserLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <form id="editUserForm">
          <div class="modal-header">
            <h5 class="modal-title" id="editUserLabel">Sửa nhân viên</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>
          </div>
          <div class="modal-body">
            <div class="mb-2">
              <label class="form-label">Họ và tên</label>
              <input type="text" id="editFullName" class="form-control" value="${escapeHtml(user.fullName || "")}" required />
            </div>
            <div class="mb-2">
              <label class="form-label">Email</label>
              <input type="email" id="editEmail" class="form-control" value="${escapeHtml(user.email || "")}" required />
            </div>
            <div class="mb-2">
              <label class="form-label">Số điện thoại</label>
              <input type="text" id="editPhone" class="form-control" value="${escapeHtml(user.phone || "")}" />
            </div>
            <div class="mb-2">
              <label class="form-label">Vai trò</label>
              <input type="text" class="form-control" value="staff" disabled />
              <input type="hidden" id="editRole" value="staff" />
            </div>
            <!-- không cho đổi mật khẩu tại đây, nếu cần tách modal riêng -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
            <button type="submit" class="btn btn-primary">Lưu thay đổi</button>
          </div>
        </form>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", html);

  const modalEl = document.getElementById("editUserModal");
  const bsModal = new bootstrap.Modal(modalEl, { backdrop: "static" });
  modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove());

  const form = document.getElementById("editUserForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fullName = document.getElementById("editFullName").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const phone = document.getElementById("editPhone").value.trim();
    const role = document.getElementById("editRole").value; // luôn staff

    if (!fullName || !email) {
      alert("Họ tên và email không được để trống.");
      return;
    }
    if (!validateEmail(email)) {
      alert("Email không hợp lệ.");
      return;
    }

    update(ref(db, `users/${userId}`), {
      fullName,
      email,
      phone,
      role
    })
      .then(() => {
        alert("Cập nhật thành công.");
        bsModal.hide();
      })
      .catch(err => {
        alert("Lỗi khi cập nhật: " + err.message);
      });
  });

  bsModal.show();
}

// validate email
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// escape HTML
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// xoá (đánh dấu) nhân viên
window.deleteUser = function (id) {
  if (!confirm("Xác nhận xoá nhân viên này?")) return;
  update(ref(db, `users/${id}`), { deleted: true })
    .then(() => alert("Đã xoá (đánh dấu)."))
    .catch(e => alert("Lỗi: " + e.message));
};

// === QUẢN LÝ SẢN PHẨM ===
// helper: tạo HTML sao theo rating (ví dụ 4.3 -> ★★★★☆ (4.3))
function renderStars(rating) {
  if (rating == null || isNaN(rating) || rating <= 0) {
    return `<span class="text-muted">Chưa có</span>`;
  }
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;
  let stars = "";
  for (let i = 0; i < fullStars; i++) stars += "★";
  if (halfStar) stars += "½"; // đơn giản: hiển thị nửa sao bằng ký tự ½
  const empty = 5 - fullStars - (halfStar ? 1 : 0);
  for (let i = 0; i < empty; i++) stars += "☆";
  return `<span style="color:#f5c518; font-weight:600;">${stars}</span> <small>(${rating.toFixed(1)})</small>`;
}
// ===== LỌC KÝ TỰ ĐẶC BIỆT TRONG ĐƯỜNG DẪN STORAGE =====
function safePath(str) {
  return (str || "").replace(/[\/\\#?%*:|"<>]/g, "_").trim();
}

// ===== UPLOAD ẢNH AN TOÀN LÊN FIREBASE STORAGE =====
async function uploadImageToStorage(file, path) {
  if (!file) throw new Error("Không có file để upload");
  const cleanPath = safePath(path);
  const storageReference = storageRef(storage, cleanPath);
  try {
    await uploadBytes(storageReference, file);
    return await getDownloadURL(storageReference);
  } catch (err) {
    console.error("Upload ảnh thất bại:", err);
    throw new Error(err.message || "Lỗi không xác định khi upload ảnh");
  }
}

// ===== LẤY ẢNH HIỂN THỊ SẢN PHẨM =====
function getDisplayImage(p) {
  if (p.imageUrl) return p.imageUrl;
  if (p.variants) {
    for (const groupKey in p.variants) {
      const group = p.variants[groupKey];
      for (const color in group) {
        if (group[color]?.image) return group[color].image;
      }
    }
  }
  return "";
}

// ===== HIỂN THỊ DANH SÁCH SẢN PHẨM + ĐÁNH GIÁ =====
window.manageProducts = function () {
  const tbody = document.getElementById("productTableBody");
  if (!tbody) return;

  const reviewRef = ref(db, "reviews");
  onValue(reviewRef, (reviewSnap) => {
    const ratingMap = {};
    if (reviewSnap.exists()) {
      reviewSnap.forEach(prodSnap => {
        const productId = prodSnap.key;
        let sum = 0, count = 0;
        prodSnap.forEach(rSnap => {
          const r = rSnap.val();
          if (r.rating != null) {
            const parsed = parseFloat(r.rating);
            if (!isNaN(parsed)) {
              sum += parsed;
              count++;
            }
          }
        });
        ratingMap[productId] = {
          avg: count > 0 ? sum / count : 0,
          count
        };
      });
    }

    onValue(ref(db, "product"), (snapshot) => {
      tbody.innerHTML = "";
      if (!snapshot.exists()) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">Không có sản phẩm.</td></tr>`;
        return;
      }
      snapshot.forEach(child => {
        const p = child.val();
        const productId = child.key;
        const variantGroupCount = p.variants ? Object.keys(p.variants).length : 0;
        const displayImg = getDisplayImage(p) || '#';
        const ratingInfo = ratingMap[productId] || { avg: 0, count: 0 };
        const starHtml = ratingInfo.count > 0 ? renderStars(ratingInfo.avg) : `<span class="text-muted">Chưa có</span>`;
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><img src="${escapeHtml(displayImg)}" width="50" height="50" style="object-fit: cover; border-radius:6px;" /></td>
          <td>${escapeHtml(p.name || "")}</td>
          <td>${escapeHtml(p.categoryId || "")}</td>
          <td>${variantGroupCount} nhóm biến thể</td>
          <td>${starHtml}</td>
          <td>
            <button class="btn btn-sm btn-warning me-1" onclick="editProduct('${productId}')">Sửa</button>
            <button class="btn btn-sm btn-danger" onclick="deleteProduct('${productId}')">Xoá</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    });
  });
};

// ===== NÚT SỬA SẢN PHẨM =====
window.editProduct = function (id) {
  const productRef = ref(db, `product/${id}`);
  onValue(productRef, (snapshot) => {
    if (!snapshot.exists()) {
      alert("Không tìm thấy sản phẩm.");
      return;
    }
    const product = snapshot.val();
    showEditProductModal(id, product);
  }, { onlyOnce: true });
};

// ===== TẠO HÀNG MÀU TRONG NHÓM BIẾN THỂ =====
function createColorRow(productId, groupKey, colorName, colorData, mainImageSetter) {
  const row = document.createElement("div");
  row.className = "d-flex gap-2 align-items-start mb-2 color-row";
  row.dataset.colorName = colorName;

  const img = document.createElement("img");
  img.src = colorData.image || "";
  img.width = 60;
  img.height = 60;
  img.style.objectFit = "cover";
  img.style.borderRadius = "6px";
  img.style.border = "1px solid #ccc";

  const colorInput = document.createElement("input");
  colorInput.type = "text";
  colorInput.value = colorName;
  colorInput.className = "form-control";
  colorInput.style.minWidth = "100px";

  const priceInput = document.createElement("input");
  priceInput.type = "number";
  priceInput.value = colorData.price || 0;
  priceInput.className = "form-control";
  priceInput.style.width = "120px";

  const qtyInput = document.createElement("input");
  qtyInput.type = "number";
  qtyInput.value = colorData.quantity || 0;
  qtyInput.className = "form-control";
  qtyInput.style.width = "120px";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.className = "form-control form-control-sm";
  fileInput.style.maxWidth = "160px";

  const setMainBtn = document.createElement("button");
  setMainBtn.type = "button";
  setMainBtn.className = "btn btn-outline-primary btn-sm";
  setMainBtn.textContent = "Đặt làm ảnh chính";
  setMainBtn.onclick = () => {
    if (colorData.image) mainImageSetter(colorData.image);
    else alert("Chưa có ảnh để đặt làm ảnh chính.");
  };

  const removeColorBtn = document.createElement("button");
  removeColorBtn.type = "button";
  removeColorBtn.className = "btn btn-outline-danger btn-sm";
  removeColorBtn.textContent = "Xóa màu";
  removeColorBtn.onclick = () => row.remove();

  const imageHolder = document.createElement("input");
  imageHolder.type = "hidden";
  imageHolder.value = colorData.image || "";

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    img.src = URL.createObjectURL(file);
    try {
      const path = `product_variants/${safePath(productId)}/${safePath(groupKey)}/${safePath(colorInput.value)}/${Date.now()}_${safePath(file.name)}`;
      const uploadedUrl = await uploadImageToStorage(file, path);
      imageHolder.value = uploadedUrl;
      img.src = uploadedUrl;
    } catch (err) {
      alert("Upload ảnh màu thất bại: " + err.message);
    }
  });

  const infoWrapper = document.createElement("div");
  infoWrapper.className = "d-flex gap-2 flex-wrap";
  infoWrapper.style.flex = "1";
  infoWrapper.append(colorInput, priceInput, qtyInput, fileInput);

  const actionWrapper = document.createElement("div");
  actionWrapper.className = "d-flex flex-column gap-1";
  actionWrapper.append(setMainBtn, removeColorBtn);

  row.append(img, infoWrapper, actionWrapper, imageHolder);
  return row;
}

// ===== TẠO NHÓM BIẾN THỂ =====
function createVariantGroupRow(productId, groupKey, groupData, mainImageSetter) {
  const container = document.createElement("div");
  container.className = "border p-3 mb-3 variant-group";
  container.dataset.groupKey = groupKey;

  const header = document.createElement("div");
  header.className = "d-flex gap-2 align-items-center mb-2";
  const groupInput = document.createElement("input");
  groupInput.type = "text";
  groupInput.value = groupKey;
  groupInput.className = "form-control";
  groupInput.style.flex = "1";

  const removeGroupBtn = document.createElement("button");
  removeGroupBtn.type = "button";
  removeGroupBtn.className = "btn btn-outline-danger btn-sm";
  removeGroupBtn.textContent = "Xóa nhóm";
  removeGroupBtn.onclick = () => container.remove();

  header.append(groupInput, removeGroupBtn);

  const colorHeader = document.createElement("div");
  colorHeader.className = "d-flex gap-2 align-items-center mb-1";
  const colorTitle = document.createElement("div");
  colorTitle.textContent = "Màu:";
  colorTitle.style.fontWeight = "600";
  const addColorBtn = document.createElement("button");
  addColorBtn.type = "button";
  addColorBtn.className = "btn btn-sm btn-success";
  addColorBtn.textContent = "+ Thêm màu";
  colorHeader.append(colorTitle, addColorBtn);

  const colorContainer = document.createElement("div");
  Object.entries(groupData || {}).forEach(([colorName, colorData]) => {
    const colorRow = createColorRow(productId, groupKey, colorName, colorData, mainImageSetter);
    colorContainer.appendChild(colorRow);
  });

  addColorBtn.addEventListener("click", () => {
    const defaultColorName = "Màu mới";
    const newColorRow = createColorRow(productId, groupKey, defaultColorName, { image: "", price: 0, quantity: 0 }, mainImageSetter);
    colorContainer.appendChild(newColorRow);
  });

  container.append(header, colorHeader, colorContainer);
  return container;
}

// ===== MODAL SỬA SẢN PHẨM =====
function showEditProductModal(productId, product) {
  const existing = document.getElementById("editProductModal");
  if (existing) existing.remove();

  const html = `
    <div class="modal fade" id="editProductModal" tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <form id="editProductForm">
            <div class="modal-header">
              <h5 class="modal-title">Sửa sản phẩm</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <input type="text" id="editProductName" class="form-control mb-2" value="${escapeHtml(product.name || "")}" placeholder="Tên sản phẩm">
              <input type="text" id="editProductCategory" class="form-control mb-2" value="${escapeHtml(product.categoryId || "")}" placeholder="Danh mục">
              <div class="mb-3">
                <img id="mainImagePreview" src="${escapeHtml(product.imageUrl || getDisplayImage(product) || '')}" width="80" height="80" style="object-fit: cover; border-radius:6px; border:1px solid #ccc;">
                <input type="file" id="mainImageInput" accept="image/*" class="form-control mt-1">
                <input type="hidden" id="mainImageUrl" value="${escapeHtml(product.imageUrl || '')}">
              </div>
              <div id="variantGroupsContainer"></div>
              <button type="button" id="addVariantGroupBtn" class="btn btn-success btn-sm mt-2">+ Thêm nhóm</button>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
              <button type="submit" class="btn btn-primary">Lưu</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);
  const modalEl = document.getElementById("editProductModal");
  const bsModal = new bootstrap.Modal(modalEl);

  const mainImageInput = document.getElementById("mainImageInput");
  const mainImagePreview = document.getElementById("mainImagePreview");
  const mainImageUrlHolder = document.getElementById("mainImageUrl");

  mainImageInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    mainImagePreview.src = URL.createObjectURL(file);
    try {
      const uploaded = await uploadImageToStorage(file, `product_main/${safePath(productId)}/${Date.now()}_${safePath(file.name)}`);
      mainImageUrlHolder.value = uploaded;
      mainImagePreview.src = uploaded;
    } catch (err) {
      alert("Upload ảnh chính thất bại: " + err.message);
    }
  });

  const variantGroupsContainer = document.getElementById("variantGroupsContainer");
  if (product.variants) {
    Object.entries(product.variants).forEach(([groupKey, groupData]) => {
      const groupRow = createVariantGroupRow(productId, groupKey, groupData, (url) => {
        mainImageUrlHolder.value = url;
        mainImagePreview.src = url;
      });
      variantGroupsContainer.appendChild(groupRow);
    });
  }

  document.getElementById("addVariantGroupBtn").addEventListener("click", () => {
    const groupRow = createVariantGroupRow(productId, "Nhóm mới", {}, (url) => {
      mainImageUrlHolder.value = url;
      mainImagePreview.src = url;
    });
    variantGroupsContainer.appendChild(groupRow);
  });

  document.getElementById("editProductForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("editProductName").value.trim();
    const categoryId = document.getElementById("editProductCategory").value.trim();
    const mainImageUrl = mainImageUrlHolder.value.trim();

    const newVariants = {};
    const groups = variantGroupsContainer.querySelectorAll(".variant-group");
    for (const groupEl of groups) {
      const groupKey = groupEl.querySelector('input[type="text"]').value.trim();
      newVariants[groupKey] = {};
      const colorRows = groupEl.querySelectorAll(".color-row");
      for (const row of colorRows) {
        const colorName = row.querySelector('input[type="text"]').value.trim();
        const price = parseFloat(row.querySelectorAll('input[type="number"]')[0].value) || 0;
        const qty = parseInt(row.querySelectorAll('input[type="number"]')[1].value) || 0;
        const imageUrl = row.querySelector('input[type="hidden"]').value;
        newVariants[groupKey][colorName] = { image: imageUrl, price, quantity: qty };
      }
    }

    try {
      await update(ref(db, `product/${productId}`), { name, categoryId, imageUrl: mainImageUrl, variants: newVariants });
      alert("Cập nhật thành công");
      bsModal.hide();
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  });

  bsModal.show();
}

// ===== XÓA SẢN PHẨM =====
window.deleteProduct = function (id) {
  if (!confirm("Xác nhận xoá sản phẩm?")) return;
  remove(ref(db, `product/${id}`))
    .then(() => alert("Đã xoá."))
    .catch(e => alert("Lỗi: " + e.message));
};

// escape helper
// function escapeHtml(str) {
//   return String(str || "")
//     .replaceAll("&", "&amp;")
//     .replaceAll("<", "&lt;")
//     .replaceAll(">", "&gt;")
//     .replaceAll('"', "&quot;")
//     .replaceAll("'", "&#39;");
// }


// === ĐƠN HÀNG & DOANH THU ===
let ordersListener = null;

function formatTimestamp(ts) {
  if (!ts) return "";
  const d = new Date(Number(ts));
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function humanStatusLabel(st) {
  switch (st) {
    case "pending":
      return { text: "Chờ xử lý", class: "status-pending" };
    case "ondelivery":
      return { text: "Đang giao", class: "status-ondelivery" };
    case "completed":
      return { text: "Đã giao", class: "status-completed" };
    case "return_requested":
      return { text: "Yêu cầu hoàn trả", class: "status-return_requested" };
    case "returned":
      return { text: "Hoàn trả thành công", class: "status-returned" };
    case "cancelled":
      return { text: "Đã huỷ", class: "status-cancelled" };
    default:
      return { text: st, class: "" };
  }
}

function createOrderRow(entry) {
  const { order, orderId, userId } = entry;
  const tr = document.createElement("tr");
  const totalFormatted =
    typeof order.totalAmount === "number"
      ? order.totalAmount.toLocaleString()
      : Number(order.totalAmount || 0).toLocaleString();
  const timeStr = formatTimestamp(order.timestamp || order.createdAt || 0);
  const status = (order.status || "").toLowerCase();
  const statusObj = humanStatusLabel(status);

  let actionHtml = "";
  if (status === "pending") {
    actionHtml = `
      <button class="btn btn-sm btn-success me-1" onclick="updateOrderStatus('${userId}','${orderId}','ondelivery')">Xác nhận</button>
      <button class="btn btn-sm btn-danger" onclick="cancelOrder('${userId}','${orderId}')">Huỷ</button>
    `;
  } else if (status === "ondelivery") {
    actionHtml = `
      <button class="btn btn-sm btn-primary me-1" onclick="updateOrderStatus('${userId}','${orderId}','completed')">Xác nhận nhận hàng</button>
      <button class="btn btn-sm btn-danger" onclick="cancelOrder('${userId}','${orderId}')">Huỷ</button>
    `;
  } else if (status === "completed") {
    actionHtml = `
      <button class="btn btn-sm btn-secondary me-1" onclick="showOrderDetail('${orderId}','${userId}')">Chi tiết</button>
      <button class="btn btn-sm btn-warning" onclick="requestReturnOrder('${userId}','${orderId}')">Yêu cầu hoàn trả</button>
    `;
  } else if (status === "return_requested") {
    actionHtml = `
      <button class="btn btn-sm btn-outline-warning me-1" onclick="cancelReturnRequest('${userId}','${orderId}')">Huỷ yêu cầu</button>
      <button class="btn btn-sm btn-success" onclick="markReturned('${userId}','${orderId}')">Đã hoàn trả</button>
    `;
  } else if (status === "returned") {
    actionHtml = `<span class="text-muted">—</span>`;
  } else if (status === "cancelled") {
    actionHtml = `<span class="text-muted">—</span>`;
  }

  tr.innerHTML = `
    <td>${order.orderId || orderId}</td>
    <td>${order.receiverName || ""}</td>
    <td>${order.receiverAddress || ""}</td>
    <td>${totalFormatted} VND</td>
    <td>${timeStr}</td>
    <td><button class="btn btn-sm btn-info" onclick="showOrderDetail('${orderId}','${userId}')">Xem</button></td>
    <td>${actionHtml}</td>
    <td><span class="badge badge-status ${statusObj.class}">${statusObj.text}</span></td>
  `;
  return tr;
}

function loadOrdersByStatus() {
  const pendingBody = document.getElementById("pendingTableBody");
  const shippingBody = document.getElementById("shippingTableBody");
  const completedBody = document.getElementById("completedTableBody");
  const cancelledBody = document.getElementById("canceledTableBody");
  const returnRequestedBody = document.getElementById("returnRequestedTableBody");
  const returnedBody = document.getElementById("returnedTableBody");

  onValue(ref(db, "orders"), snapshot => {
    if (pendingBody) pendingBody.innerHTML = "";
    if (shippingBody) shippingBody.innerHTML = "";
    if (completedBody) completedBody.innerHTML = "";
    if (cancelledBody) cancelledBody.innerHTML = "";
    if (returnRequestedBody) returnRequestedBody.innerHTML = "";
    if (returnedBody) returnedBody.innerHTML = "";

    const pending = [], ondelivery = [], completed = [], returnRequested = [], returned = [], cancelled = [];
    snapshot.forEach(userSnap => {
      const userId = userSnap.key;
      userSnap.forEach(orderSnap => {
        const order = orderSnap.val();
        const orderId = orderSnap.key;
        const entry = { order, orderId, userId };
        const st = (order.status || "").toLowerCase();
        switch (st) {
          case "pending":
            pending.push(entry);
            break;
          case "ondelivery":
            ondelivery.push(entry);
            break;
          case "completed":
            completed.push(entry);
            break;
          case "return_requested":
            returnRequested.push(entry);
            break;
          case "returned":
            returned.push(entry);
            break;
          case "cancelled":
            cancelled.push(entry);
            break;
          default:
            break;
        }
      });
    });

    const sortDesc = arr => arr.sort((a,b) => {
      const ta = Number(a.order.timestamp || a.order.createdAt || 0);
      const tb = Number(b.order.timestamp || b.order.createdAt || 0);
      return tb - ta;
    });

    sortDesc(pending);
    sortDesc(ondelivery);
    sortDesc(completed);
    sortDesc(returnRequested);
    sortDesc(returned);
    sortDesc(cancelled);

    pending.forEach(e => pendingBody && pendingBody.appendChild(createOrderRow(e)));
    ondelivery.forEach(e => shippingBody && shippingBody.appendChild(createOrderRow(e)));
    completed.forEach(e => completedBody && completedBody.appendChild(createOrderRow(e)));
    returnRequested.forEach(e => returnRequestedBody && returnRequestedBody.appendChild(createOrderRow(e)));
    returned.forEach(e => returnedBody && returnedBody.appendChild(createOrderRow(e)));
    cancelled.forEach(e => cancelledBody && cancelledBody.appendChild(createOrderRow(e)));
    
    // cập nhật doanh thu/tổng trong dashboard sau khi có orders
    computeRevenueSummary(pending.concat(ondelivery, completed, returnRequested, returned, cancelled));
  });
}

// cập nhật số liệu doanh thu từ các đơn đã hoàn thành
function computeRevenueSummary(allOrders) {
  const completedOrders = allOrders.filter(o => (o.order.status || "").toLowerCase() === "completed");
  let totalOrders = 0;
  let totalRevenue = 0;
  const productMap = {};

  completedOrders.forEach(entry => {
    const order = entry.order;
    totalOrders++;
    totalRevenue += Number(order.totalAmount || 0);
    if (Array.isArray(order.items)) {
      order.items.forEach(item => {
        const key = `${item.productName}-${item.variant || "default"}`;
        const revenue = (item.price || 0) * (item.quantity || 0);
        if (!productMap[key]) {
          productMap[key] = {
            name: item.productName,
            variant: item.variant || "Mặc định",
            image: item.productImage || "https://via.placeholder.com/40",
            quantity: 0,
            revenue: 0
          };
        }
        productMap[key].quantity += item.quantity || 0;
        productMap[key].revenue += revenue;
      });
    }
  });

  document.getElementById("totalOrders").textContent = totalOrders;
  document.getElementById("totalRevenue").textContent = totalRevenue.toLocaleString();

  const sortedProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const topProductsEl = document.getElementById("topProducts");
  topProductsEl.innerHTML = "";
  sortedProducts.forEach(data => {
    const div = document.createElement("div");
    div.className = "product-item";
    const percent = totalRevenue ? ((data.revenue / totalRevenue) * 100).toFixed(1) : 0;
    div.innerHTML = `
      <img src="${data.image}" alt="Ảnh">
      <div class="info">
        <strong>${data.name}</strong>
        <div class="variant">Biến thể: ${data.variant}</div>
      </div>
      <div class="text-end">
        <div class="revenue fw-bold">${data.revenue.toLocaleString()} đ</div>
        <div class="small text-muted">${percent}%</div>
      </div>
    `;
    topProductsEl.appendChild(div);
  });

  // vẽ các biểu đồ
  renderRevenueCharts(allOrders);
}

// xử lý biểu đồ
function formatDataByPeriod(orders, period) {
  const grouped = {};
  const now = new Date();

  if (period === "week") {
    const weekdays = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Chủ nhật

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const label = `${weekdays[d.getDay()]} ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
      grouped[label] = 0;
    }

    orders.forEach(entry => {
      const order = entry.order;
      if ((order.status || "").toLowerCase() !== "completed") return;
      const d = new Date(order.timestamp);
      const weekday = ["CN","Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7"][d.getDay()];
      const label = `${weekday} ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
      if (grouped[label] !== undefined) grouped[label] += Number(order.totalAmount || 0);
    });
  } else if (period === "month") {
    const year = now.getFullYear();
    for (let i = 1; i <= 12; i++) {
      const key = `${year}-${String(i).padStart(2,'0')}`;
      grouped[key] = 0;
    }
    orders.forEach(entry => {
      const order = entry.order;
      if ((order.status || "").toLowerCase() !== "completed") return;
      const d = new Date(order.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (grouped[key] !== undefined) grouped[key] += Number(order.totalAmount || 0);
    });
  } else if (period === "year") {
    orders.forEach(entry => {
      const order = entry.order;
      if ((order.status || "").toLowerCase() !== "completed") return;
      const d = new Date(order.timestamp);
      const key = `${d.getFullYear()}`;
      if (!grouped[key]) grouped[key] = 0;
      grouped[key] += Number(order.totalAmount || 0);
    });
  }
  return grouped;
}

function renderBarChart(canvasId, label, dataMap) {
  const ctx = document.getElementById(canvasId);
  if (ctx.chartInstance) ctx.chartInstance.destroy();
  ctx.chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(dataMap),
      datasets: [{
        label: label,
        data: Object.values(dataMap),
        backgroundColor: 'rgba(54, 162, 235, 0.6)'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: label }
      },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function renderHorizontalBarChart(canvasId, label, dataMap) {
  const ctx = document.getElementById(canvasId);
  if (ctx.chartInstance) ctx.chartInstance.destroy();
  ctx.chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(dataMap),
      datasets: [{
        label: label,
        data: Object.values(dataMap),
        backgroundColor: 'rgba(255, 159, 64, 0.6)'
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: label }
      },
      scales: { x: { beginAtZero: true } }
    }
  });
}

function renderPieChart(canvasId, label, dataMap) {
  const ctx = document.getElementById(canvasId);
  if (ctx.chartInstance) ctx.chartInstance.destroy();
  ctx.chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(dataMap),
      datasets: [{
        label: label,
        data: Object.values(dataMap),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        title: { display: true, text: label }
      }
    }
  });
}

function renderRevenueCharts(allOrders) {
  const byWeek = formatDataByPeriod(allOrders, "week");
  const byMonth = formatDataByPeriod(allOrders, "month");
  const byYear = formatDataByPeriod(allOrders, "year");

  renderBarChart("weeklyRevenueChart", "Doanh thu theo tuần", byWeek);
  renderHorizontalBarChart("monthlyRevenueChart", "Doanh thu theo tháng", byMonth);
  renderPieChart("yearlyRevenueChart", "Doanh thu theo năm", byYear);
}

// === HÀNH ĐỘNG ĐƠN HÀNG ===
window.cancelOrder = function (userId, orderId) {
  if (!confirm("Bạn có chắc chắn muốn huỷ đơn?")) return;
  update(ref(db, `orders/${userId}/${orderId}`), { status: "cancelled" })
    .then(() => alert("Đã huỷ đơn hàng."))
    .catch(e => alert("Lỗi: " + e.message));
};

window.updateOrderStatus = function (userId, orderId, status) {
  update(ref(db, `orders/${userId}/${orderId}`), { status })
    .then(() => alert(`Đã chuyển sang '${status}'.`))
    .catch(e => alert("Lỗi: " + e.message));
};

window.requestReturnOrder = function (userId, orderId) {
  onValue(ref(db, `orders/${userId}/${orderId}`), snap => {
    if (!snap.exists()) return;
    const order = snap.val();
    if ((order.status || "").toLowerCase() !== "completed") {
      alert("Chỉ yêu cầu hoàn trả khi đơn đã giao.");
      return;
    }
    const RETURN_REASONS = [
      "Sản phẩm lỗi",
      "Giao sai",
      "Không đúng mô tả",
      "Quá lâu",
      "Khác"
    ];
    // tạo modal bootstrap (đơn giản)
    const modalId = 'returnReasonModal';
    let existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const wrapper = document.createElement("div");
    wrapper.id = modalId;
    wrapper.className = "modal fade show";
    wrapper.style.display = "block";
    wrapper.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Yêu cầu hoàn trả</h5>
            <button type="button" class="btn-close" onclick="document.getElementById('${modalId}').remove()"></button>
          </div>
          <div class="modal-body">
            <p>Chọn lý do hoàn trả:</p>
            <div id="reasonList" class="list-group mb-3"></div>
            <div id="customReasonArea" class="mb-3 d-none">
              <label class="form-label">Lý do khác:</label>
              <input type="text" id="customReasonInput" class="form-control" placeholder="Nhập lý do hoàn trả" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('${modalId}').remove()">Huỷ</button>
            <button class="btn btn-warning" id="sendReturnBtn">Gửi yêu cầu</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper);

    let selected = -1;
    const reasonListEl = wrapper.querySelector("#reasonList");
    RETURN_REASONS.forEach((r, idx) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "list-group-item list-group-item-action";
      item.textContent = r;
      item.onclick = () => {
        selected = idx;
        Array.from(reasonListEl.children).forEach(c => {
          c.classList.remove("active", "fw-bold");
        });
        item.classList.add("active", "fw-bold");
        if (r === "Khác") {
          wrapper.querySelector("#customReasonArea").classList.remove("d-none");
        } else {
          wrapper.querySelector("#customReasonArea").classList.add("d-none");
        }
      };
      reasonListEl.appendChild(item);
    });

    wrapper.querySelector("#sendReturnBtn").onclick = () => {
      if (selected === -1) {
        alert("Vui lòng chọn lý do.");
        return;
      }
      let reason = RETURN_REASONS[selected];
      if (reason === "Khác") {
        reason = wrapper.querySelector("#customReasonInput").value.trim();
        if (!reason) {
          alert("Vui lòng nhập lý do.");
          return;
        }
      }
      update(ref(db, `orders/${userId}/${orderId}`), { status: "return_requested" })
        .then(() => {
          return update(ref(db, `orders/${userId}/${orderId}/return`), {
            reason,
            requestedAt: Date.now()
          });
        })
        .then(() => {
          alert("Đã gửi yêu cầu hoàn trả.");
          wrapper.remove();
        })
        .catch(e => alert("Lỗi: " + e.message));
    };
  }, { onlyOnce: true });
};

window.cancelReturnRequest = function (userId, orderId) {
  if (!confirm("Huỷ yêu cầu hoàn trả?")) return;
  update(ref(db, `orders/${userId}/${orderId}`), { status: "completed" })
    .then(() => {
      remove(ref(db, `orders/${userId}/${orderId}/return`));
      alert("Đã huỷ yêu cầu hoàn trả.");
    })
    .catch(e => alert("Lỗi: " + e.message));
};

window.markReturned = function (userId, orderId) {
  if (!confirm("Xác nhận hoàn trả thành công?")) return;
  update(ref(db, `orders/${userId}/${orderId}`), { status: "returned" })
    .then(() => alert("Đã đánh dấu hoàn trả thành công."))
    .catch(e => alert("Lỗi: " + e.message));
};

window.showOrderDetail = function (orderId, userId) {
  onValue(ref(db, `orders/${userId}/${orderId}`), snap => {
    if (!snap.exists()) return;
    const order = snap.val();
    const timeStr = formatTimestamp(order.timestamp || order.createdAt || 0);
    let html = `
      <div class="modal fade show" style="display:block;" id="detailModal">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Chi tiết đơn: ${order.orderId || orderId}</h5>
              <button type="button" class="btn-close" onclick="document.getElementById('detailModal').remove()"></button>
            </div>
            <div class="modal-body">
              <p><strong>Thời gian đặt:</strong> ${timeStr}</p>
              <p><strong>Trạng thái:</strong> ${order.status}</p>
    `;
    if (order.return) {
      const reqAt = new Date(order.return.requestedAt || 0);
      html += `<p class="text-warning"><strong>Yêu cầu hoàn trả:</strong> ${order.return.reason} <br><small>Ngày: ${reqAt.toLocaleString("vi-VN")}</small></p>`;
    }
    if (Array.isArray(order.items)) {
      order.items.forEach(item => {
        html += `
          <div class="d-flex mb-3 border p-2 rounded">
            <div class="me-3">
              <img src="${item.productImage || ''}" width="60" height="60" style="object-fit:cover;border-radius:6px;" />
            </div>
            <div>
              <div><strong>${item.productName || ''}</strong></div>
              <div>Biến thể: ${item.variant || ''}</div>
              <div>Số lượng: ${item.quantity || 0}</div>
              <div>Giá: ${(item.price || 0).toLocaleString()} đ</div>
            </div>
          </div>
        `;
      });
    }
    html += `
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" onclick="document.getElementById('detailModal').remove()">Đóng</button>
            </div>
          </div>
        </div>
      </div>
    `;
    const existing = document.getElementById('detailModal');
    if (existing) existing.remove();
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
  }, { onlyOnce: true });
};

// khởi tạo
window.addEventListener("DOMContentLoaded", () => {
  loadUsers();
  manageProducts();
  loadOrdersByStatus();
  showSection("dashboard");
  showOrderCategory("pending"); // mặc định
});

// lọc doanh thu theo khoảng
document.getElementById("btnSearch").addEventListener("click", () => {
  // gọi lại summary sau khi các đơn đã tải
  // lấy tất cả đơn từ Firebase rồi lọc
  onValue(ref(db, "orders"), snapshot => {
    const all = [];
    snapshot.forEach(userSnap => {
      userSnap.forEach(orderSnap => {
        const order = orderSnap.val();
        const orderId = orderSnap.key;
        const userId = userSnap.key;
        all.push({ order, orderId, userId });
      });
    });
    const fromDateStr = document.getElementById("fromDate").value;
    const toDateStr = document.getElementById("toDate").value;
    if (!fromDateStr || !toDateStr) {
      alert("Vui lòng chọn cả hai ngày.");
      return;
    }
    const fromDate = new Date(fromDateStr);
    const toDate = new Date(toDateStr);
    toDate.setHours(23,59,59,999);
    const filtered = all.filter(e => {
      const ts = Number(e.order.timestamp || e.order.createdAt || 0);
      const d = new Date(ts);
      return d >= fromDate && d <= toDate && (e.order.status || "").toLowerCase() === "completed";
    });
    // vẽ biểu đồ lọc
    const dataMap = {};
    filtered.forEach(e => {
      const date = new Date(Number(e.order.timestamp || e.order.createdAt || 0));
      const label = `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}`;
      if (!dataMap[label]) dataMap[label] = 0;
      dataMap[label] += Number(e.order.totalAmount || 0);
    });
    // vẽ
    const ctx = document.getElementById("filteredRevenueChart");
    if (ctx.chartInstance) ctx.chartInstance.destroy();
    ctx.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(dataMap),
        datasets: [{
          label: 'Doanh thu theo ngày',
          data: Object.values(dataMap),
          backgroundColor: 'rgba(153, 102, 255, 0.6)'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Doanh thu lọc theo ngày' }
        },
        scales: { y: { beginAtZero: true } }
      }
    });
  }, { onlyOnce: true });

});
// === QUẢN LÝ KHUYẾN MÃI (FULL) ===
// Yêu cầu HTML:
// - Bảng danh sách: <tbody id="promoTableBody"></tbody>
// - Ô tìm kiếm: <input id="promoSearchInput">
// - Modal thêm:  #addPromoModal, form #promoForm
//   + input #code, #desc, #discount, #start, #end, checkbox #isActive, #applyAll
//   + container danh sách sp: <div id="addProductList"></div>
// - Modal sửa:  #editPromoModal, form #editPromoForm
//   + input #editCode, #editDesc, #editDiscount, #editStart, #editEnd, checkbox #editActive, #editApplyAll
//   + container danh sách sp: <div id="editProductList"></div>
// === QUẢN LÝ KHUYẾN MÃI (FULL) ===
// === QUẢN LÝ KHUYẾN MÃI (ĐỒNG BỘ VỚI JAVA) ===
// === QUẢN LÝ KHUYẾN MÃI (ĐỒNG BỘ VỚI JAVA) ===
const promoTableBody = document.getElementById("promoTableBody");
const promoSearchInput = document.getElementById("promoSearchInput");

const productsCache = new Map(); // pid -> name

// ----- Load & cache product names -----
async function ensureProductsCache() {
  if (productsCache.size > 0) return;
  await new Promise((resolve) => {
    onValue(ref(db, "product"), (snap) => {
      productsCache.clear();
      snap.forEach((child) => {
        const v = child.val() || {};
        const pid = v.productId ?? child.key;
        const name = v.name ?? pid;
        productsCache.set(pid, name);
      });
      resolve();
    }, { onlyOnce: true });
  });
}

// ----- Helper: render danh sách sản phẩm vào container -----
async function renderProductChooser(containerSelector, checkboxClass, preSelectedIds = []) {
  const wrap = document.querySelector(containerSelector);
  if (!wrap) return;
  wrap.innerHTML = `<div class="text-muted small">Đang tải danh sách sản phẩm...</div>`;

  await ensureProductsCache();

  const pieces = [];
  for (const [pid, name] of productsCache.entries()) {
    const checked = preSelectedIds.includes(pid) ? "checked" : "";
    pieces.push(`
      <label class="form-check d-flex align-items-center gap-2 me-3 mb-2">
        <input type="checkbox" class="form-check-input ${checkboxClass}" value="${pid}" ${checked}>
        <span class="form-check-label">${name}</span>
      </label>
    `);
  }

  wrap.innerHTML = pieces.length
    ? `<div class="d-flex flex-wrap">${pieces.join("")}</div>`
    : `<div class="text-muted">Chưa có sản phẩm.</div>`;
}

// Bật "Áp dụng tất cả" -> chỉ disable checkbox & mờ vùng chọn
function toggleChooserByApplyAll(isApplyAll, containerSelector, checkboxClass) {
  const wrap = document.querySelector(containerSelector);
  if (!wrap) return;
  wrap.querySelectorAll(`input.${checkboxClass}`).forEach((cb) => (cb.disabled = !!isApplyAll));
  wrap.style.opacity = isApplyAll ? 0.5 : 1;
}

// ----- Load danh sách khuyến mãi -----
window.loadPromotions = async function () {
  if (!promoTableBody) return;

  await ensureProductsCache();

  onValue(
    ref(db, "promotions"),
    (snapshot) => {
      promoTableBody.innerHTML = "";
      const keyword = promoSearchInput?.value.trim().toLowerCase() || "";

      snapshot.forEach((child) => {
        const p = child.val() || {};
        if (keyword) {
          const combined = `${p.code ?? ""} ${p.description ?? ""}`.toLowerCase();
          if (!combined.includes(keyword)) return;
        }
        const isActive = p.is_active ? "✅" : "❌";
        const applyAll = p.apply_to_all ? "Tất cả" : "Tùy chọn";
        const timeRange = `${p.start_date ?? ""} → ${p.end_date ?? ""}`;

        // Map ID -> tên cho cột sản phẩm
        let productList = "-";
        if (!p.apply_to_all && Array.isArray(p.apply_to_product_ids) && p.apply_to_product_ids.length > 0) {
          const names = p.apply_to_product_ids.map((id) => productsCache.get(id) || id);
          productList = names.join(", ");
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${p.code ?? ""}</td>
          <td>${p.description ?? ""}</td>
          <td>${Number(p.discount ?? 0)}%</td>
          <td>${timeRange}</td>
          <td>${applyAll}</td>
          <td>${productList}</td>
          <td>${isActive}</td>
          <td class="text-nowrap">
            <button class="btn btn-sm btn-warning me-1" onclick="editPromotion('${p.code}')">Sửa</button>
            <button class="btn btn-sm btn-danger" onclick="deletePromotion('${p.code}')">Xoá</button>
          </td>
        `;
        promoTableBody.appendChild(tr);
      });
    },
    { onlyOnce: true }
  );
};

// tìm kiếm realtime
promoSearchInput?.addEventListener("input", () => loadPromotions());

// ----- THÊM MỚI -----
document.getElementById("promoForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const code = document.getElementById("code").value.trim();
  const description = document.getElementById("desc").value.trim();
  const discount = parseFloat(document.getElementById("discount").value) || 0;
  const start_date = document.getElementById("start").value;
  const end_date = document.getElementById("end").value;
  const is_active = document.getElementById("isActive").checked;
  const apply_to_all = document.getElementById("applyAll").checked;

  if (!code) return alert("Mã không được để trống.");
  if (end_date && start_date && end_date < start_date) {
    return alert("Ngày kết thúc phải >= ngày bắt đầu.");
  }

  let apply_to_product_ids = null;
  if (!apply_to_all) {
    apply_to_product_ids = [];
    document
      .querySelectorAll("#addProductList input.productCheckbox:checked")
      .forEach((cb) => apply_to_product_ids.push(cb.value));
    if (apply_to_product_ids.length === 0) {
      return alert("Hãy chọn ít nhất 1 sản phẩm hoặc bật 'Áp dụng tất cả'.");
    }
  }

  const data = {
    code,
    description,
    discount,
    start_date,
    end_date,
    is_active,
    apply_to_all,
    apply_to_product_ids: apply_to_all ? null : apply_to_product_ids,
  };

  try {
    // Ghi khuyến mãi
    await update(ref(db, `promotions/${code}`), data);

    // ⭐ Đồng bộ với Java: push thông báo
    let product_names_text = "TẤT CẢ sản phẩm";
    if (!apply_to_all && Array.isArray(apply_to_product_ids) && apply_to_product_ids.length > 0) {
      const names = apply_to_product_ids.map((id) => productsCache.get(id) || id);
      if (names.length === 1) {
        product_names_text = names[0];
      } else if (names.length <= 3) {
        product_names_text = names.join(", ");
      } else {
        product_names_text = `${names.slice(0, 2).join(", ")} +${names.length - 2} sản phẩm`;
      }
    }

    const notifRef = push(ref(db, "notifications"));
    await set(notifRef, {
      title: "🎁 Khuyến mãi mới!",
      message: `Mã: ${code} - ${description} (${discount}%)\nÁp dụng: ${product_names_text}\nHiệu lực: ${start_date} → ${end_date}`,
      type: "promo",
      timestamp: Date.now(),
      code,
      discount,
      apply_to_all,
      apply_to_product_ids: apply_to_all ? null : apply_to_product_ids,
      start_date,
      end_date,
      product_names: apply_to_all ? null : apply_to_product_ids.map((id) => productsCache.get(id) || id),
      product_names_text
    });

    alert("✅ Thêm khuyến mãi thành công!");
    e.target.reset();

    // reset vùng chọn
    const applyAllEl = document.getElementById("applyAll");
    toggleChooserByApplyAll(applyAllEl?.checked, "#addProductList", "productCheckbox");

    bootstrap.Modal.getInstance(document.getElementById("addPromoModal"))?.hide();
    loadPromotions();
  } catch (err) {
    alert("Lỗi khi thêm khuyến mãi: " + err.message);
  }
});

// Khởi tạo vùng chọn sản phẩm trong modal Thêm
(async function initAddChooser() {
  if (!document.getElementById("addProductList")) return;
  await renderProductChooser("#addProductList", "productCheckbox", []);
  const el = document.getElementById("applyAll");
  const sync = () => toggleChooserByApplyAll(el.checked, "#addProductList", "productCheckbox");
  el?.addEventListener("change", sync);
  sync();
})();

// ----- SỬA -----
window.editPromotion = function (code) {
  onValue(
    ref(db, `promotions/${code}`),
    async (snapshot) => {
      if (!snapshot.exists()) return alert("Không tìm thấy khuyến mãi.");
      const p = snapshot.val() || {};

      document.getElementById("editCode").value = p.code ?? "";
      document.getElementById("editDesc").value = p.description ?? "";
      document.getElementById("editDiscount").value = Number(p.discount ?? 0);
      document.getElementById("editStart").value = p.start_date ?? "";
      document.getElementById("editEnd").value = p.end_date ?? "";
      document.getElementById("editActive").checked = !!p.is_active;

      const editApplyAllEl = document.getElementById("editApplyAll");
      editApplyAllEl.checked = !!p.apply_to_all;

      // render chooser với pre-checked theo danh sách cũ
      const pre = Array.isArray(p.apply_to_product_ids) ? p.apply_to_product_ids : [];
      await renderProductChooser("#editProductList", "editProductCheckbox", pre);

      const sync = () =>
        toggleChooserByApplyAll(editApplyAllEl.checked, "#editProductList", "editProductCheckbox");
      editApplyAllEl.onchange = sync;
      sync();

      new bootstrap.Modal(document.getElementById("editPromoModal")).show();
    },
    { onlyOnce: true }
  );
};

// Lưu chỉnh sửa
document.getElementById("editPromoForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const code = document.getElementById("editCode").value.trim();
  const description = document.getElementById("editDesc").value.trim();
  const discount = parseFloat(document.getElementById("editDiscount").value) || 0;
  const start_date = document.getElementById("editStart").value;
  const end_date = document.getElementById("editEnd").value;
  const is_active = document.getElementById("editActive").checked;
  const apply_to_all = document.getElementById("editApplyAll").checked;

  if (end_date && start_date && end_date < start_date) {
    return alert("Ngày kết thúc phải >= ngày bắt đầu.");
  }

  let apply_to_product_ids = null;
  if (!apply_to_all) {
    apply_to_product_ids = [];
    document
      .querySelectorAll("#editProductList input.editProductCheckbox:checked")
      .forEach((cb) => apply_to_product_ids.push(cb.value));
    if (apply_to_product_ids.length === 0) {
      return alert("Hãy chọn ít nhất 1 sản phẩm hoặc bật 'Áp dụng tất cả'.");
    }
  }

  const data = {
    code,
    description,
    discount,
    start_date,
    end_date,
    is_active,
    apply_to_all,
    apply_to_product_ids: apply_to_all ? null : apply_to_product_ids,
  };

  update(ref(db, `promotions/${code}`), data)
    .then(() => {
      alert("✅ Cập nhật khuyến mãi thành công!");
      bootstrap.Modal.getInstance(document.getElementById("editPromoModal"))?.hide();
      loadPromotions();
    })
    .catch((err) => alert("Lỗi khi cập nhật: " + err.message));
});

// ----- Xoá -----
window.deletePromotion = function (code) {
  if (!confirm(`Bạn có chắc chắn xoá mã "${code}"?`)) return;
  remove(ref(db, `promotions/${code}`))
    .then(() => {
      alert("🗑️ Đã xoá khuyến mãi.");
      loadPromotions();
    })
    .catch((err) => alert("Lỗi khi xoá: " + err.message));
};

// Tự load lần đầu
window.addEventListener("DOMContentLoaded", () => loadPromotions());

// ==========================
// Quản lý Banner
// ==========================

// Thêm banner mới
window.addBanner = async function () {
  const file = document.getElementById("bannerImageFile").files[0];
  if (!file) {
    return alert("📌 Vui lòng chọn ảnh banner!");
  }

  const storageRef = sRef(storage, `banners/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  await set(push(ref(db, "banners")), { imageUrl: url });
  resetBannerForm();
};

// Hiển thị danh sách banner
function loadBanners() {
  onValue(ref(db, "banners"), (snapshot) => {
    const list = document.getElementById("bannerList");
    list.innerHTML = "";

    if (!snapshot.exists()) {
      list.innerHTML = `
        <tr>
          <td colspan="2" class="text-center text-gray-500 p-4">Chưa có banner nào</td>
        </tr>
      `;
      return;
    }

    snapshot.forEach((child) => {
      const { imageUrl } = child.val();
      list.innerHTML += `
        <tr class="hover:bg-gray-50">
          <td class="border p-2 text-center">
            <img src="${imageUrl}" alt="Banner" class="w-32 h-auto rounded shadow">
          </td>
          <td class="border p-2 text-center">
            <button onclick="deleteBanner('${child.key}', '${imageUrl}')"
              class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded shadow">
              🗑 Xóa
            </button>
          </td>
        </tr>
      `;
    });
  });
}

// Xóa banner
window.deleteBanner = async function (id, imageUrl) {
  if (!confirm("❗ Bạn có chắc muốn xóa banner này?")) return;

  try {
    const imgRef = sRef(storage, imageUrl);
    await deleteObject(imgRef);
  } catch (err) {
    console.warn("⚠ Không thể xóa ảnh:", err);
  }

  await remove(ref(db, `banners/${id}`));
};

// Reset form
function resetBannerForm() {
  document.getElementById("bannerImageFile").value = "";
}

// Tải danh sách khi load trang
loadBanners();

