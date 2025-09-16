/**************************************************
 * ADMIN PANEL – FULL JS (ĐÃ ĐỒNG BỘ VỚI JAVA)
 * - Firebase init
 * - Staff session & presence
 * - Users: load/edit/delete (Modal)
 * - Orders: load by status, detail (Modal), actions
 * - Notifications: push to notifications/{userId}
 **************************************************/

/* ================== FIREBASE INIT ================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  onDisconnect,
  onValue,
  remove,
  update,
  push
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";


const firebaseConfig = {
  apiKey: "AIzaSyBsf_IgEEci-NbSXDGLB7mQZvP_SRGMD6o",
  authDomain: "appmobile-c561a.firebaseapp.com",
  databaseURL: "https://appmobile-c561a-default-rtdb.firebaseio.com",
  projectId: "appmobile-c561a",
  storageBucket: "appmobile-c561a.appspot.com",
  messagingSenderId: "75581709372",
  appId: "1:75581709372:web:484cde5c4141fc7aef3739",
  measurementId: "G-2EPN2ZZM8M",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);
const auth = getAuth();

/* ================== SMALL UTILS ================== */
function $id(id) { return document.getElementById(id); }

function formatTimestamp(ts) {
  if (!ts) return "";
  const d = new Date(Number(ts));
  return d.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function currency(v) {
  const n = typeof v === "number" ? v : Number(v || 0);
  return n.toLocaleString() + " VND";
}

/* ================== LIGHTWEIGHT MODAL ================== */
const Modal = {
  ensureStyles() {
    if ($id("__vanilla_modal_styles")) return;
    const css = `
      .vmask{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:9999}
      .vmodal{background:#fff;border-radius:12px;max-width:640px;width:calc(100% - 32px);box-shadow:0 10px 30px rgba(0,0,0,.2)}
      .vheader{padding:14px 16px;border-bottom:1px solid #eee;font-weight:600;display:flex;justify-content:space-between;align-items:center}
      .vbody{padding:16px;max-height:70vh;overflow:auto}
      .vfooter{padding:12px 16px;border-top:1px solid #eee;display:flex;gap:8px;justify-content:flex-end}
      .vbtn{padding:8px 12px;border-radius:8px;border:0;cursor:pointer}
      .vbtn-primary{background:#2563eb;color:#fff}
      .vbtn-danger{background:#dc2626;color:#fff}
      .vbtn-gray{background:#e5e7eb;color:#111827}
      .vclose{cursor:pointer;font-size:18px;line-height:1}
      .vinput{width:100%;padding:8px 10px;border:1px solid #ddd;border-radius:8px}
      .vlabel{font-size:12px;color:#6b7280;margin-bottom:6px}
      .vfield{margin-bottom:12px}
      table.vtable{width:100%;border-collapse:collapse}
      table.vtable td, table.vtable th{border:1px solid #e5e7eb;padding:6px 8px;font-size:14px}
      .badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px}
      .badge-green{background:#dcfce7;color:#166534}
      .badge-gray{background:#f3f4f6;color:#374151}
      .badge-red{background:#fee2e2;color:#991b1b}
      .badge-blue{background:#dbeafe;color:#1e3a8a}
      .badge-yellow{background:#fef9c3;color:#854d0e}
      .badge-orange{background:#ffedd5;color:#9a3412}
      .badge-purple{background:#efe1ff;color:#5b21b6}
    `.trim();
    const style = document.createElement("style");
    style.id = "__vanilla_modal_styles";
    style.innerHTML = css;
    document.head.appendChild(style);
  },
  show({ id = "__modal", title = "", body = "", footer = "" }) {
    this.ensureStyles();
    this.close(id);
    const mask = document.createElement("div");
    mask.className = "vmask";
    mask.id = id;
    mask.innerHTML = `
      <div class="vmodal">
        <div class="vheader">
          <div>${title || ""}</div>
          <div class="vclose" aria-label="Đóng" onclick="document.getElementById('${id}')?.remove()">✕</div>
        </div>
        <div class="vbody">${body || ""}</div>
        <div class="vfooter">${footer || `<button class="vbtn vbtn-gray" onclick="document.getElementById('${id}')?.remove()">Đóng</button>`}</div>
      </div>
    `;
    document.body.appendChild(mask);
  },
  close(id="__modal") { $id(id)?.remove(); }
};

/* ================== STAFF SESSION & PRESENCE ================== */
let staffId = localStorage.getItem("staffId");
if (!staffId) {
  staffId = prompt("Nhập ID nhân viên/admin:");
  if (!staffId) window.location.href = "login.html";
  localStorage.setItem("staffId", staffId);
}
const statusRef = ref(db, `users/${staffId}/status`);
set(statusRef, true);
onDisconnect(statusRef).set(false);

/* ================== NAVIGATION / UI ================== */
function hideAllSections() {
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
}
window.showSection = function (id) {
  hideAllSections();
  $id(id)?.classList.remove("hidden");
};

window.logout = function () {
  if (!confirm("Bạn có chắc chắn muốn đăng xuất không?")) return;
  set(statusRef, false).finally(() => {
    signOut(auth).finally(() => {
      localStorage.clear();
      sessionStorage.clear();
      alert("Bạn đã đăng xuất!");
      window.location.href = "login.html";
    });
  });
};

// Load thông tin staff
onValue(ref(db, `users/${staffId}`), (snap) => {
  if (!snap.exists()) return alert("Không tìm thấy thông tin tài khoản.");
  const user = snap.val() || {};
  $id("staffName") && ($id("staffName").textContent = user.fullName || "Admin");
  if ($id("staffAvatar")) {
    $id("staffAvatar").src = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || "Admin")}`;
  }
  if (user.role !== "staff" && user.role !== "admin") {
    $id("adminPanelWrapper")?.classList.add("hidden");
    alert("Bạn không có quyền truy cập trang quản trị.");
  } else {
    $id("panelTitle") && ($id("panelTitle").textContent = "Nhân viên - Quản lý đơn hàng");
  }
});

window.toggleOrderSubmenu = function () {
  const submenu = $id("orderSubmenu");
  const arrow = $id("orderMenuArrow");
  if (!submenu || !arrow) return;
  const opened = submenu.classList.contains("hidden");
  submenu.classList.toggle("hidden", !opened);
  arrow.textContent = opened ? "▴" : "▾";
};

const orderGroupIds = ["pending","ondelivery","completed","return_requested","returned","cancelled"];
window.showOrderCategory = function (status) {
  showSection("orders");
  orderGroupIds.forEach(s => {
    const group = $id(`group_${s}`);
    if (!group) return;
    group.classList.toggle("hidden", status !== "all" && s !== status);
  });
  document.querySelectorAll("#orderSubmenu button").forEach(btn => {
    btn.classList.toggle("bg-gray-200", btn.dataset.filter === status);
    btn.classList.toggle("font-semibold", btn.dataset.filter === status);
  });
};

window.applyAdminFilter = function () {
  const keyword = ($id("orderSearchInput")?.value || "").trim().toLowerCase();
  document.querySelectorAll("tbody tr").forEach(row => {
    const orderId = (row.children[0]?.textContent || "").toLowerCase();
    const receiverName = (row.children[1]?.textContent || "").toLowerCase();
    row.style.display = (orderId.includes(keyword) || receiverName.includes(keyword)) ? "" : "none";
  });
};

/* ================== USERS MANAGEMENT ================== */
let editingUserId = null;

window.loadUsers = function () {
  const userTable = document.getElementById("userTableBody");
  if (!userTable) return;

  onValue(ref(db, "users"), (snapshot) => {
    userTable.innerHTML = "";
    snapshot.forEach((child) => {
      const user = child.val() || {};
      if (user.role === "user") { // 👉 chỉ load user role = "user"
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="p-2 border">
            <img src="${user.avatar || "https://via.placeholder.com/40"}" class="w-10 h-10 rounded-full object-cover">
          </td>
          <td class="p-2 border">${user.fullName || ""}</td>
          <td class="p-2 border">${user.email || ""}</td>
          <td class="p-2 border">${user.phone || ""}</td>
          <td class="p-2 border">user</td>
          <td class="p-2 border space-x-2">
            <button onclick="editUser('${child.key}')" class="bg-yellow-400 text-white px-2 py-1 rounded">Sửa</button>
            <button onclick="deleteUser('${child.key}')" class="bg-red-500 text-white px-2 py-1 rounded">Xoá</button>
          </td>`;
        userTable.appendChild(tr);
      }
    });
  });
};

window.openUserForm = function () {
  editingUserId = null;
  const body = `
    <div class="vfield">
      <div class="vlabel">Họ tên</div>
      <input id="eu_name" class="vinput">
    </div>
    <div class="vfield">
      <div class="vlabel">Email</div>
      <input id="eu_email" class="vinput">
    </div>
    <div class="vfield">
      <div class="vlabel">Số điện thoại</div>
      <input id="eu_phone" class="vinput">
    </div>
    <div class="vfield">
      <div class="vlabel">Ảnh đại diện</div>
      <input type="file" id="eu_avatar" accept="image/*" class="vinput">
    </div>
  `;
  const footer = `
    <button class="vbtn vbtn-gray" onclick="document.getElementById('__edit_user')?.remove()">Đóng</button>
    <button class="vbtn vbtn-primary" onclick="saveUser()">Lưu</button>
  `;
  Modal.show({ id: "__edit_user", title: "Thêm người dùng", body, footer });
};

window.editUser = function (id) {
  const userRefObj = ref(db, `users/${id}`);
  onValue(userRefObj, (snapshot) => {
    if (!snapshot.exists()) return alert("Không tìm thấy user!");
    const user = snapshot.val() || {};
    if (user.role !== "user") return alert("Chỉ được sửa user role = 'user'");

    editingUserId = id;

    const body = `
      <div class="vfield">
        <div class="vlabel">Họ tên</div>
        <input id="eu_name" class="vinput" value="${user.fullName || ""}">
      </div>
      <div class="vfield">
        <div class="vlabel">Email</div>
        <input id="eu_email" class="vinput" value="${user.email || ""}">
      </div>
      <div class="vfield">
        <div class="vlabel">Số điện thoại</div>
        <input id="eu_phone" class="vinput" value="${user.phone || ""}">
      </div>
      <div class="vfield">
        <div class="vlabel">Ảnh đại diện</div>
        <input type="file" id="eu_avatar" accept="image/*" class="vinput">
        ${user.avatar ? `<img src="${user.avatar}" class="w-12 h-12 rounded-full mt-2">` : ""}
      </div>
    `;
    const footer = `
      <button class="vbtn vbtn-gray" onclick="document.getElementById('__edit_user')?.remove()">Đóng</button>
      <button class="vbtn vbtn-primary" onclick="saveUser('${id}')">Lưu</button>
    `;
    Modal.show({ id: "__edit_user", title: "Sửa người dùng", body, footer });
  }, { onlyOnce: true });
};

window.saveUser = async function (id = null) {
  const name = document.getElementById("eu_name").value.trim();
  const email = document.getElementById("eu_email").value.trim();
  const phone = document.getElementById("eu_phone").value.trim();
  const file = document.getElementById("eu_avatar")?.files[0];

  if (!name || !email || !phone) {
    alert("Vui lòng nhập đủ Họ tên, Email & SĐT");
    return;
  }

  let avatarUrl = null;
  if (file) {
    const path = `users/${Date.now()}_${file.name}`;
    const storageReference = storageRef(storage, path);
    await uploadBytes(storageReference, file);
    avatarUrl = await getDownloadURL(storageReference);
  }

  const data = { fullName: name, email, phone, role: "user" }; // 👉 luôn là role "user"
  if (avatarUrl) data.avatar = avatarUrl;

  const userRef = id ? ref(db, `users/${id}`) : push(ref(db, "users"));
  update(userRef, data)
    .then(() => {
      alert(id ? "✅ Cập nhật thành công" : "✅ Thêm mới thành công");
      document.getElementById("__edit_user")?.remove();
    })
    .catch(err => alert("❌ Lỗi: " + err.message));
};

window.deleteUser = function (id) {
  if (!confirm("Xác nhận xoá người dùng này?")) return;
  remove(ref(db, `users/${id}`))
    .then(() => alert("Đã xoá."))
    .catch(err => alert("Lỗi: " + err.message));
};

/* ================== ORDERS ================== */
let ordersListener = null;

function statusBadge(status) {
  const s = (status || "").toLowerCase();
  const map = {
    pending: ["Chờ xử lý","badge-gray"],
    ondelivery: ["Đang giao","badge-blue"],
    completed: ["Đã giao","badge-green"],
    cancelled: ["Đã huỷ","badge-red"],
    return_requested: ["Yêu cầu hoàn trả","badge-yellow"],
    returned: ["Hoàn trả thành công","badge-purple"]
  };
  const item = map[s] || [status, "badge-gray"];
  return `<span class="badge ${item[1]}">${item[0]}</span>`;
}

// Push thông báo giống Java
function sendUserNotification(userId, orderId, status) {
  let message;
  switch (status) {
    case "ondelivery":
      message = `Đơn hàng #${orderId} đã được xác nhận và đang giao.`; break;
    case "completed":
      message = `Đơn hàng #${orderId} đã giao thành công.`; break;
    case "cancelled":
      message = `Đơn hàng #${orderId} đã bị hủy.`; break;
    case "return_requested":
      message = `Bạn đã gửi yêu cầu hoàn trả cho đơn hàng #${orderId}.`; break;
    case "returned":
      message = `Đơn hàng #${orderId} đã hoàn trả thành công.`; break;
    default:
      message = `Đơn hàng #${orderId} đã cập nhật trạng thái.`; break;
  }

  const notiData = {
    title: "Thông báo đơn hàng",
    message,
    type: "order",
    timestamp: Date.now(),
  };

  push(ref(db, `notifications/${userId}`), notiData);
}

function createOrderRow(entry) {
  const { order, orderId, userId } = entry;
  const tr = document.createElement("tr");
  const status = (order.status || "").toLowerCase();

  let actionCell = "";
  if (status === "pending") {
    actionCell = `
      <button onclick="updateOrderStatus('${userId}','${orderId}','ondelivery')" class='bg-green-500 text-white px-2 py-1 rounded mr-1'>Xác nhận</button>
      <button onclick="cancelOrder('${userId}','${orderId}')" class='bg-red-500 text-white px-2 py-1 rounded'>Huỷ</button>
    `;
  } else if (status === "ondelivery") {
    actionCell = `
      <button onclick="updateOrderStatus('${userId}','${orderId}','completed')" class='bg-blue-500 text-white px-2 py-1 rounded mr-1'>Xác nhận nhận hàng</button>
      <button onclick="cancelOrder('${userId}','${orderId}')" class='bg-red-500 text-white px-2 py-1 rounded'>Huỷ</button>
    `;
  } else if (status === "return_requested") {
    actionCell = `
      <button onclick="cancelReturnRequest('${userId}','${orderId}')" class='bg-orange-500 text-white px-2 py-1 rounded mr-1'>Huỷ yêu cầu hoàn trả</button>
      <button onclick="markReturned('${userId}','${orderId}')" class='bg-green-600 text-white px-2 py-1 rounded'>Đã hoàn trả</button>
    `;
  } else if (status === "returned") {
    actionCell = `<span class='text-gray-600 font-semibold'>Đã hoàn trả</span>`;
  } else if (status === "cancelled") {
    actionCell = `<span class='text-red-500 font-semibold'>❌ Đã huỷ</span>`;
  }

  tr.innerHTML = `
    <td class='p-2 border'>${order.orderId || orderId}</td>
    <td class='p-2 border'>${order.receiverName || ""}</td>
    <td class='p-2 border'>${order.receiverAddress || ""}</td>
    <td class='p-2 border'>${currency(order.totalAmount)}</td>
    <td class='p-2 border'>${formatTimestamp(order.timestamp || order.createdAt || 0)}</td>
    <td class='p-2 border'>
      <button onclick="showOrderDetail('${orderId}','${userId}')" class='bg-gray-700 text-white px-2 py-1 rounded'>Chi tiết</button>
    </td>
    <td class='p-2 border'>${actionCell}</td>
    <td class='p-2 border font-medium'>${statusBadge(status)}</td>
  `;
  return tr;
}

// Chi tiết đơn hàng bằng Modal
// Chi tiết đơn hàng bằng Modal (hiển thị ảnh + biến thể từ Firebase)
window.showOrderDetail = function (orderId, userId) {
  onValue(ref(db, `orders/${userId}/${orderId}`), (snap) => {
    if (!snap.exists()) return alert("Không tìm thấy đơn hàng.");
    const o = snap.val() || {};

    // Lấy danh sách sản phẩm
    const items = Array.isArray(o.items) ? o.items : (o.items ? Object.values(o.items) : []);
    let itemsHtml = "";
    if (items.length) {
      itemsHtml = `
        <div class="vlabel" style="margin-top:6px">Sản phẩm</div>
        <table class="vtable">
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Tên</th>
              <th>Biến thể</th>
              <th>SL</th>
              <th>Giá</th>
              <th>Tạm tính</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(it => `
              <tr>
                <td>
                  ${it.productImage 
                    ? `<img src="${it.productImage}" style="width:50px;height:50px;object-fit:cover;border-radius:6px">` 
                    : ""}
                </td>
                <td>${it.productName || it.productId || ""}</td>
                <td>${it.variant || "-"}</td>
                <td>${it.quantity || 1}</td>
                <td>${currency(it.price)}</td>
                <td>${currency((it.price || 0) * (it.quantity || 1))}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    }

    const body = `
      <div class="vfield"><div class="vlabel">Mã đơn</div><div>#${orderId}</div></div>
      <div class="vfield"><div class="vlabel">Người nhận</div><div>${o.receiverName || ""}</div></div>
      <div class="vfield"><div class="vlabel">Địa chỉ</div><div>${o.receiverAddress || ""}</div></div>
      <div class="vfield"><div class="vlabel">SĐT</div><div>${o.receiverPhone || ""}</div></div>
      <div class="vfield"><div class="vlabel">Tổng tiền</div><div>${currency(o.totalAmount)}</div></div>
      <div class="vfield"><div class="vlabel">Trạng thái</div><div>${statusBadge(o.status)}</div></div>
      <div class="vfield"><div class="vlabel">Thời gian</div><div>${formatTimestamp(o.timestamp || o.createdAt || 0)}</div></div>
      ${itemsHtml}
    `;

    Modal.show({
      id: "__order_detail",
      title: "Chi tiết đơn hàng",
      body
    });
  }, { onlyOnce: true });
};

function sortByTimeDesc(arr) {
  return arr.sort((a, b) => {
    const ta = Number(a.order.timestamp || a.order.createdAt || 0);
    const tb = Number(b.order.timestamp || b.order.createdAt || 0);
    return tb - ta;
  });
}

function appendRows(rows, tbody) {
  if (!tbody) return;
  tbody.innerHTML = "";
  rows.forEach(entry => tbody.appendChild(createOrderRow(entry)));
}

function loadOrdersByStatus() {
  const pendingBody = $id("pendingTableBody");
  const shippingBody = $id("shippingTableBody");
  const completedBody = $id("completedTableBody");
  const cancelledBody = $id("canceledTableBody");
  const returnRequestedBody = $id("returnRequestedTableBody");
  const returnedBody = $id("returnedTableBody");

  ordersListener = onValue(ref(db, "orders"), (snapshot) => {
    const pending = [], shipping = [], completed = [], returnReq = [], returned = [], cancelled = [];

    snapshot.forEach(userSnap => {
      const userId = userSnap.key;
      userSnap.forEach(orderSnap => {
        const order = orderSnap.val() || {};
        const orderId = orderSnap.key;
        const entry = { order, orderId, userId };
        switch ((order.status || "").toLowerCase()) {
          case "pending": pending.push(entry); break;
          case "ondelivery": shipping.push(entry); break;
          case "completed": completed.push(entry); break;
          case "return_requested": returnReq.push(entry); break;
          case "returned": returned.push(entry); break;
          case "cancelled": cancelled.push(entry); break;
        }
      });
    });

    sortByTimeDesc(pending);
    sortByTimeDesc(shipping);
    sortByTimeDesc(completed);
    sortByTimeDesc(returnReq);
    sortByTimeDesc(returned);
    sortByTimeDesc(cancelled);

    appendRows(pending, pendingBody);
    appendRows(shipping, shippingBody);
    appendRows(completed, completedBody);
    appendRows(returnReq, returnRequestedBody);
    appendRows(returned, returnedBody);
    appendRows(cancelled, cancelledBody);
  });
}

/* ===== ORDER ACTIONS (push noti như Java) ===== */
window.updateOrderStatus = function (userId, orderId, status) {
  update(ref(db, `orders/${userId}/${orderId}`), { status })
    .then(() => { alert(`✅ Đã chuyển sang '${status}'`); sendUserNotification(userId, orderId, status); })
    .catch(err => alert("❌ Lỗi: " + err.message));
};

window.cancelOrder = function (userId, orderId) {
  if (!confirm("❗ Bạn có chắc chắn muốn huỷ đơn hàng này không?")) return;
  update(ref(db, `orders/${userId}/${orderId}`), { status: "cancelled" })
    .then(() => { alert("✅ Đơn hàng đã được huỷ"); sendUserNotification(userId, orderId, "cancelled"); })
    .catch(err => alert("❌ Lỗi khi huỷ đơn hàng: " + err.message));
};

window.requestReturnOrder = function (userId, orderId) {
  update(ref(db, `orders/${userId}/${orderId}`), { status: "return_requested" })
    .then(() => { alert("✅ Đã gửi yêu cầu hoàn trả"); sendUserNotification(userId, orderId, "return_requested"); })
    .catch(err => alert("❌ Lỗi: " + err.message));
};

window.cancelReturnRequest = function (userId, orderId) {
  if (!confirm("Bạn có muốn huỷ yêu cầu hoàn trả?")) return;
  update(ref(db, `orders/${userId}/${orderId}`), { status: "completed" })
    .then(() => {
      remove(ref(db, `orders/${userId}/${orderId}/return`));
      alert("✅ Đã huỷ yêu cầu hoàn trả");
      sendUserNotification(userId, orderId, "completed");
    })
    .catch(err => alert("❌ Lỗi: " + err.message));
};

window.markReturned = function (userId, orderId) {
  if (!confirm("Xác nhận đã hoàn trả đơn hàng này?")) return;
  update(ref(db, `orders/${userId}/${orderId}`), { status: "returned" })
    .then(() => { alert("✅ Đã đánh dấu Hoàn trả thành công"); sendUserNotification(userId, orderId, "returned"); })
    .catch(err => alert("❌ Lỗi: " + err.message));
};

/* ================== ON LOAD ================== */
window.addEventListener("DOMContentLoaded", () => {
  // Các ID cần tồn tại trong HTML:
  // staffName, staffAvatar, adminPanelWrapper, panelTitle
  // orderSubmenu, orderMenuArrow, orders (section), orderSearchInput
  // group_pending/... và các tbody: pendingTableBody, shippingTableBody, completedTableBody,
  // canceledTableBody, returnRequestedTableBody, returnedTableBody
  // userTableBody

  loadUsers();
  loadOrdersByStatus();
  showOrderCategory("pending");
});


// === 🛒 QUẢN LÝ SẢN PHẨM ===

// ===== Helper =====
function renderStars(rating) {
  if (!rating || isNaN(rating) || rating <= 0)
    return `<span class="text-gray-400">Chưa có</span>`;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  let stars = "★".repeat(full);
  if (half) stars += "½";
  stars += "☆".repeat(5 - full - (half ? 1 : 0));
  return `<span class="text-yellow-500 font-bold">${stars}</span> <small>(${rating.toFixed(1)})</small>`;
}

function getDisplayImage(p) {
  if (p.imageUrl) return p.imageUrl;
  if (p.variants) {
    for (const g in p.variants) {
      for (const c in p.variants[g]) {
        if (p.variants[g][c].image) return p.variants[g][c].image;
      }
    }
  }
  return "";
}

async function uploadImageToStorage(file, path) {
  const storageReference = storageRef(storage, path);
  await uploadBytes(storageReference, file);
  return await getDownloadURL(storageReference);
}

// ===== Quản lý sản phẩm =====
window.manageProducts = function () {
  const tbody = document.getElementById("productTableBody");
  if (!tbody) return;

  onValue(ref(db, "reviews"), (reviewSnap) => {
    const ratingMap = {};
    reviewSnap.forEach((prodSnap) => {
      let sum = 0,
        count = 0;
      prodSnap.forEach((rSnap) => {
        const r = rSnap.val();
        if (r.rating) {
          sum += parseFloat(r.rating);
          count++;
        }
      });
      ratingMap[prodSnap.key] = { avg: count ? sum / count : 0, count };
    });

    onValue(ref(db, "product"), (snapshot) => {
      tbody.innerHTML = "";
      if (!snapshot.exists()) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">Không có sản phẩm</td></tr>`;
        return;
      }
      snapshot.forEach((child) => {
        const p = child.val(),
          id = child.key;
        const img = getDisplayImage(p) || "#";
        const starHtml = ratingMap[id]?.count
          ? renderStars(ratingMap[id].avg)
          : `<span class="text-gray-400">Chưa có</span>`;
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="p-2 border"><img src="${img}" class="w-12 h-12 rounded object-cover"/></td>
          <td class="p-2 border">${p.name || ""}</td>
          <td class="p-2 border">${p.categoryId || ""}</td>
          <td class="p-2 border">${
            p.variants ? Object.keys(p.variants).length + " nhóm" : "0"
          }</td>
          <td class="p-2 border">${starHtml}</td>
          <td class="p-2 border">
            <button onclick="editProduct('${id}')" class="bg-yellow-400 text-white px-2 py-1 rounded">Sửa</button>
            <button onclick="deleteProduct('${id}')" class="bg-red-500 text-white px-2 py-1 rounded">Xoá</button>
          </td>`;
        tbody.appendChild(tr);
      });
    });
  });
};

window.deleteProduct = function (id) {
  if (!confirm("Xác nhận xoá sản phẩm?")) return;
  remove(ref(db, `product/${id}`))
    .then(() => alert("Đã xoá sản phẩm"))
    .catch((e) => alert("Lỗi: " + e.message));
};

// ===== Modal form =====
let editingProductId = null;
let mainImageUrl = "";

window.openAddForm = function () {
  editingProductId = null;
  mainImageUrl = "";
  document.getElementById("productModalTitle").textContent = "Thêm sản phẩm";
  document.getElementById("productForm").reset();
  document.getElementById("previewImage").classList.add("hidden");
  document.getElementById("variantGroups").innerHTML = "";
  document.getElementById("productModal").classList.remove("hidden");
};

window.editProduct = function (id) {
  const productRef = ref(db, `product/${id}`);
  onValue(
    productRef,
    (snap) => {
      if (!snap.exists()) return alert("Không tìm thấy sản phẩm.");
      const p = snap.val();
      editingProductId = id;
      mainImageUrl = p.imageUrl || "";
      document.getElementById("productModalTitle").textContent = "Sửa sản phẩm";
      document.getElementById("productName").value = p.name || "";
      document.getElementById("productCategory").value = p.categoryId || "";
      document.getElementById("productDescription").value = p.description || "";
      if (mainImageUrl) {
        document.getElementById("previewImage").src = mainImageUrl;
        document.getElementById("previewImage").classList.remove("hidden");
      }
      const vGroups = document.getElementById("variantGroups");
      vGroups.innerHTML = "";
      if (p.variants) {
        Object.keys(p.variants).forEach((groupKey) => {
          const group = p.variants[groupKey];
          addGroup(groupKey, group);
        });
      }
      document.getElementById("productModal").classList.remove("hidden");
    },
    { onlyOnce: true }
  );
};

window.closeProductModal = function () {
  document.getElementById("productModal").classList.add("hidden");
};

// ===== Group + Color row =====
window.addGroup = function (groupKey = null, groupData = {}) {
  const gId = groupKey || `group${Date.now()}`;
  const div = document.createElement("div");
  div.className = "border p-3 rounded";
  div.dataset.groupId = gId;
  div.innerHTML = `
    <div class="flex justify-between items-center mb-2">
      <input type="text" value="${
        groupKey || ""
      }" placeholder="Tên nhóm (vd: Kích thước)" class="group-name border p-1 rounded flex-1 mr-2">
      <button type="button" onclick="this.closest('div[data-group-id]').remove()" class="bg-red-500 text-white px-2 py-1 rounded">Xóa nhóm</button>
    </div>
    <div class="space-y-2" id="colors_${gId}"></div>
    <button type="button" onclick="addColorRow('${gId}')" class="bg-blue-500 text-white px-2 py-1 rounded">+ Thêm màu</button>
  `;
  document.getElementById("variantGroups").appendChild(div);

  if (groupData) {
    Object.keys(groupData).forEach((color) => {
      addColorRow(gId, color, groupData[color]);
    });
  }
};

window.addColorRow = function (groupId, colorName = "", colorData = {}) {
  const container = document.getElementById(`colors_${groupId}`);
  const row = document.createElement("div");
  row.className = "flex gap-2 items-center border p-2 rounded";
  row.innerHTML = `
    <input type="text" placeholder="Màu" value="${colorName}" class="color-name border p-1 rounded w-24">
    <input type="number" placeholder="Giá" value="${
      colorData.price || 0
    }" class="color-price border p-1 rounded w-24">
    <input type="number" placeholder="SL" value="${
      colorData.quantity || 0
    }" class="color-qty border p-1 rounded w-20">
    <input type="file" accept="image/*" class="color-file border p-1 rounded">
    ${
      colorData.image
        ? `<img src="${colorData.image}" class="w-12 h-12 object-cover rounded">`
        : ""
    }
    <button type="button" onclick="this.parentElement.remove()" class="bg-red-500 text-white px-2 py-1 rounded">X</button>
    <button type="button" onclick="setMainImage('${
      colorData.image || ""
    }')" class="bg-gray-500 text-white px-2 py-1 rounded">Đặt ảnh chính</button>
  `;
  container.appendChild(row);
};

window.setMainImage = function (url) {
  if (!url) return alert("Chưa có ảnh để đặt.");
  mainImageUrl = url;
  document.getElementById("previewImage").src = url;
  document.getElementById("previewImage").classList.remove("hidden");
};

// ===== Save product =====
document
  .getElementById("productForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("productName").value.trim();
    const categoryId = document.getElementById("productCategory").value.trim();
    const description = document
      .getElementById("productDescription")
      .value.trim();
    const file = document.getElementById("productImageFile").files[0];

    // ===== Validate cơ bản =====
    if (!name) {
      alert("Vui lòng nhập tên sản phẩm");
      return;
    }
    if (!categoryId) {
      alert("Vui lòng nhập danh mục sản phẩm");
      return;
    }
    if (!description) {
      alert("Vui lòng nhập mô tả sản phẩm");
      return;
    }

    // ===== Upload ảnh chính (nếu có) =====
    if (file) {
      const path = `products/${Date.now()}_${file.name}`;
      mainImageUrl = await uploadImageToStorage(file, path);
    }

    // ===== Xử lý variants =====
    const variants = {};
    let hasError = false;
    const uploadTasks = []; // để chờ upload ảnh biến thể

    document
      .querySelectorAll("#variantGroups > div[data-group-id]")
      .forEach((groupDiv) => {
        const gName = groupDiv.querySelector(".group-name").value.trim();
        if (!gName) {
          alert("Tên nhóm biến thể không được để trống");
          hasError = true;
          return;
        }

        variants[gName] = {};
        const colorRows = groupDiv.querySelectorAll(".color-name");

        if (colorRows.length === 0) {
          alert(`Nhóm "${gName}" phải có ít nhất 1 biến thể`);
          hasError = true;
          return;
        }

        colorRows.forEach((inp, idx) => {
          const color = inp.value.trim();
          const price = parseFloat(
            groupDiv.querySelectorAll(".color-price")[idx].value
          );
          const qty = parseInt(
            groupDiv.querySelectorAll(".color-qty")[idx].value
          );
          const fileInput = groupDiv.querySelectorAll(".color-file")[idx];
          let imgUrl = groupDiv.querySelectorAll("img")[idx]?.src || "";

          if (!color) {
            alert(
              `Biến thể trong nhóm "${gName}" phải có tên (vd: Đỏ, Xanh...)`
            );
            hasError = true;
            return;
          }
          if (isNaN(price) || price <= 0) {
            alert(
              `Biến thể "${color}" trong nhóm "${gName}" phải có giá > 0`
            );
            hasError = true;
            return;
          }
          if (isNaN(qty) || qty < 0) {
            alert(
              `Biến thể "${color}" trong nhóm "${gName}" phải có số lượng >= 0`
            );
            hasError = true;
            return;
          }

          variants[gName][color] = { price, quantity: qty, image: imgUrl };

          if (fileInput?.files[0]) {
            const f = fileInput.files[0];
            const path = `variants/${Date.now()}_${f.name}`;
            const task = uploadImageToStorage(f, path).then((url) => {
              variants[gName][color].image = url;
            });
            uploadTasks.push(task);
          }
        });
      });

    if (hasError) return;

    // ===== Chờ tất cả upload ảnh biến thể xong =====
    await Promise.all(uploadTasks);

    // ===== Lưu vào Firebase =====
    const data = {
      name,
      categoryId,
      description,
      imageUrl: mainImageUrl,
      variants,
    };
    const productRef = editingProductId
      ? ref(db, `product/${editingProductId}`)
      : push(ref(db, "product"));

    update(productRef, data)
      .then(() => {
        alert(editingProductId ? "Cập nhật thành công" : "Đã thêm sản phẩm");
        closeProductModal();
      })
      .catch((e) => alert("Lỗi: " + e.message));
  });

// Hook vào showSection
const oldShowSection = window.showSection || function () {};
window.showSection = function (id) {
  oldShowSection(id);
  if (id === "products" && typeof manageProducts === "function")
    manageProducts();
};


// // === ĐƠN HÀNG ===
// let ordersListener = null;

// function formatTimestamp(ts) {
//   if (!ts) return "";
//   const d = new Date(Number(ts));
//   return d.toLocaleString("vi-VN", {
//     day: "2-digit",
//     month: "2-digit",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//   });
// }

// // Gửi thông báo sang app user
// function sendUserNotification(userId, orderId, status) {
//   let message = "";
//   switch (status) {
//     case "ondelivery":
//       message = `Đơn hàng #${orderId} đã được xác nhận và đang giao.`;
//       break;
//     case "completed":
//       message = `Đơn hàng #${orderId} đã giao thành công.`;
//       break;
//     case "cancelled":
//       message = `Đơn hàng #${orderId} đã bị hủy.`;
//       break;
//     case "return_requested":
//       message = `Bạn đã gửi yêu cầu hoàn trả cho đơn hàng #${orderId}.`;
//       break;
//     case "returned":
//       message = `Đơn hàng #${orderId} đã hoàn trả thành công.`;
//       break;
//     default:
//       message = `Đơn hàng #${orderId} đã được cập nhật trạng thái.`;
//   }

//   const notiData = {
//     title: "Thông báo đơn hàng",
//     message: message,
//     type: "order",
//     timestamp: Date.now(),
//   };

//   push(ref(db, `notifications/${userId}`), notiData);
// }

// function createOrderRow(orderEntry) {
//   const { order, orderId, userId } = orderEntry;
//   const tr = document.createElement("tr");

//   const totalFormatted =
//     typeof order.totalAmount === "number"
//       ? order.totalAmount.toLocaleString()
//       : Number(order.totalAmount || 0).toLocaleString();
//   const timeStr = formatTimestamp(order.timestamp || order.createdAt || 0);

//   let actionCell = "";
//   const status = (order.status || "").toLowerCase();

//   if (status === "pending") {
//     actionCell = `
//       <button onclick="updateOrderStatus('${userId}', '${orderId}', 'ondelivery')" class='bg-green-500 text-white px-2 py-1 rounded mr-1'>Xác nhận</button>
//       <button onclick="cancelOrder('${userId}', '${orderId}')" class='bg-red-500 text-white px-2 py-1 rounded'>Huỷ</button>
//     `;
//   } else if (status === "ondelivery") {
//     actionCell = `
//       <button onclick="updateOrderStatus('${userId}', '${orderId}', 'completed')" class='bg-blue-500 text-white px-2 py-1 rounded mr-1'>Xác nhận nhận hàng</button>
//       <button onclick="cancelOrder('${userId}', '${orderId}')" class='bg-red-500 text-white px-2 py-1 rounded'>Huỷ</button>
//     `;
//   } else if (status === "completed") {
//     actionCell = `
//       <button onclick="requestReturnOrder('${userId}', '${orderId}')" class='bg-yellow-500 text-white px-2 py-1 rounded'>Yêu cầu hoàn trả</button>
//     `;
//   } else if (status === "return_requested") {
//     actionCell = `
//       <button onclick="cancelReturnRequest('${userId}', '${orderId}')" class='bg-orange-500 text-white px-2 py-1 rounded mr-1'>Huỷ yêu cầu hoàn trả</button>
//       <button onclick="markReturned('${userId}', '${orderId}')" class='bg-green-600 text-white px-2 py-1 rounded'>Đã hoàn trả</button>
//     `;
//   } else if (status === "returned") {
//     actionCell = `<span class='text-gray-600 font-semibold'>Đã hoàn trả</span>`;
//   } else if (status === "cancelled") {
//     actionCell = `<span class='text-red-500 font-semibold'>❌ Đã huỷ</span>`;
//   }

//   let statusDisplay = status;
//   if (status === "ondelivery") statusDisplay = "Đang giao";
//   else if (status === "pending") statusDisplay = "Chờ xử lý";
//   else if (status === "completed") statusDisplay = "Đã giao";
//   else if (status === "cancelled") statusDisplay = "Đã huỷ";
//   else if (status === "return_requested") statusDisplay = "Yêu cầu hoàn trả";
//   else if (status === "returned") statusDisplay = "Hoàn trả thành công";

//   tr.innerHTML = `
//     <td class='p-2 border'>${order.orderId || orderId}</td>
//     <td class='p-2 border'>${order.receiverName || ""}</td>
//     <td class='p-2 border'>${order.receiverAddress || ""}</td>
//     <td class='p-2 border'>${totalFormatted} VND</td>
//     <td class='p-2 border'>${timeStr}</td>
//     <td class='p-2 border'>
//       <button onclick="showOrderDetail('${orderId}', '${userId}')" class='bg-gray-500 text-white px-2 py-1 rounded'>Chi tiết</button>
//     </td>
//     <td class='p-2 border'>${actionCell}</td>
//     <td class='p-2 border font-medium'>${statusDisplay}</td>
//   `;
//   return tr;
// }

// function loadOrdersByStatus() {
//   const pendingBody = document.getElementById("pendingTableBody");
//   const shippingBody = document.getElementById("shippingTableBody");
//   const completedBody = document.getElementById("completedTableBody");
//   const cancelledBody = document.getElementById("canceledTableBody");
//   const returnRequestedBody = document.getElementById("returnRequestedTableBody");
//   const returnedBody = document.getElementById("returnedTableBody");

//   if (ordersListener) {
//     // bỏ qua hủy listener
//   }

//   ordersListener = onValue(ref(db, "orders"), (snapshot) => {
//     if (pendingBody) pendingBody.innerHTML = "";
//     if (shippingBody) shippingBody.innerHTML = "";
//     if (completedBody) completedBody.innerHTML = "";
//     if (cancelledBody) cancelledBody.innerHTML = "";
//     if (returnRequestedBody) returnRequestedBody.innerHTML = "";
//     if (returnedBody) returnedBody.innerHTML = "";

//     const pendingOrders = [];
//     const shippingOrders = [];
//     const completedOrders = [];
//     const returnRequestedOrders = [];
//     const returnedOrders = [];
//     const cancelledOrders = [];

//     snapshot.forEach((userSnapshot) => {
//       const userId = userSnapshot.key;
//       userSnapshot.forEach((orderSnapshot) => {
//         const order = orderSnapshot.val();
//         const orderId = orderSnapshot.key;
//         const entry = { order, orderId, userId };
//         const st = (order.status || "").toLowerCase();
//         switch (st) {
//           case "pending":
//             pendingOrders.push(entry);
//             break;
//           case "ondelivery":
//             shippingOrders.push(entry);
//             break;
//           case "completed":
//             completedOrders.push(entry);
//             break;
//           case "return_requested":
//             returnRequestedOrders.push(entry);
//             break;
//           case "returned":
//             returnedOrders.push(entry);
//             break;
//           case "cancelled":
//             cancelledOrders.push(entry);
//             break;
//         }
//       });
//     });

//     const sortByTimeDesc = (arr) =>
//       arr.sort((a, b) => {
//         const ta = Number(a.order.timestamp || a.order.createdAt || 0);
//         const tb = Number(b.order.timestamp || b.order.createdAt || 0);
//         return tb - ta;
//       });

//     sortByTimeDesc(pendingOrders);
//     sortByTimeDesc(shippingOrders);
//     sortByTimeDesc(completedOrders);
//     sortByTimeDesc(returnRequestedOrders);
//     sortByTimeDesc(returnedOrders);
//     sortByTimeDesc(cancelledOrders);

//     pendingOrders.forEach((entry) => pendingBody.appendChild(createOrderRow(entry)));
//     shippingOrders.forEach((entry) => shippingBody.appendChild(createOrderRow(entry)));
//     completedOrders.forEach((entry) => completedBody.appendChild(createOrderRow(entry)));
//     returnRequestedOrders.forEach((entry) => returnRequestedBody.appendChild(createOrderRow(entry)));
//     returnedOrders.forEach((entry) => returnedBody.appendChild(createOrderRow(entry)));
//     cancelledOrders.forEach((entry) => cancelledBody.appendChild(createOrderRow(entry)));
//   });
// }

// // === HÀNH ĐỘNG ĐƠN ===
// window.updateOrderStatus = function (userId, orderId, status) {
//   update(ref(db, `orders/${userId}/${orderId}`), { status })
//     .then(() => {
//       alert(`✅ Đã chuyển sang '${status}'`);
//       sendUserNotification(userId, orderId, status);
//     })
//     .catch((err) => alert("❌ Lỗi: " + err.message));
// };

// window.cancelOrder = function (userId, orderId) {
//   if (confirm("❗ Bạn có chắc chắn muốn huỷ đơn hàng này không?")) {
//     update(ref(db, `orders/${userId}/${orderId}`), { status: "cancelled" })
//       .then(() => {
//         alert("✅ Đơn hàng đã được huỷ");
//         sendUserNotification(userId, orderId, "cancelled");
//       })
//       .catch((err) => alert("❌ Lỗi khi huỷ đơn hàng: " + err.message));
//   }
// };

// window.requestReturnOrder = function (userId, orderId) {
//   // ... giữ nguyên code dialog của bạn ...
//   // khi update xong trạng thái thì thêm:
//   update(ref(db, `orders/${userId}/${orderId}`), { status: "return_requested" })
//     .then(() => {
//       sendUserNotification(userId, orderId, "return_requested");
//     });
// };

// window.cancelReturnRequest = function (userId, orderId) {
//   if (!confirm("Bạn có muốn huỷ yêu cầu hoàn trả?")) return;
//   update(ref(db, `orders/${userId}/${orderId}`), { status: "completed" })
//     .then(() => {
//       remove(ref(db, `orders/${userId}/${orderId}/return`));
//       sendUserNotification(userId, orderId, "completed");
//     })
//     .catch((err) => alert("Lỗi: " + err.message));
// };

// window.markReturned = function (userId, orderId) {
//   if (!confirm("Xác nhận đã hoàn trả đơn hàng này?")) return;
//   update(ref(db, `orders/${userId}/${orderId}`), { status: "returned" })
//     .then(() => {
//       alert("Đơn đã được đánh dấu là Hoàn trả thành công.");
//       sendUserNotification(userId, orderId, "returned");
//     })
//     .catch((err) => alert("Lỗi: " + err.message));
// };

// // === KHỞI TẠO BAN ĐẦU ===
// window.addEventListener("DOMContentLoaded", () => {
//   loadUsers();
//   manageProducts();
//   loadOrdersByStatus();
//   showOrderCategory("pending");
// });


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
 window.location.href = "login.html"; // nếu bạn có trang login riêng
};


// // ✅ Cập nhật trạng thái đơn hàng
// window.confirmOrder = function (orderId) {
//   update(ref(db, `orders/${orderId}`), { status: "shipping" })
//     .then(() => alert("✅ Đơn đã được chuyển sang 'Đang giao hàng'"))
//     .catch(err => alert("❌ Lỗi: " + err.message));
// };

// window.completeOrder = function (orderId) {
//   update(ref(db, `orders/${orderId}`), { status: "completed" })
//     .then(() => alert("✅ Đơn đã được chuyển sang 'Đã hoàn thành'"))
//     .catch(err => alert("❌ Lỗi: " + err.message));
// };


// window.confirmOrder = function (orderId) {
//   update(ref(db, `orders/${orderId}`), { status: "shipping" })
//     .then(() => alert("Đã chuyển sang Đang giao"));
// };

// window.completeOrder = function (orderId) {
//   update(ref(db, `orders/${orderId}`), { status: "completed" })
//     .then(() => alert("Đã chuyển sang Hoàn thành"));
// };



/// === 💬 CHAT VỚI NGƯỜI DÙNG (MỚI) ===
/// === 💬 CHAT VỚI NGƯỜI DÙNG ===
let selectedChatUser = null;
const unreadMap = new Map();

// Load danh sách người dùng
window.loadChat = function () {
  const list = document.getElementById("chatUserList");
  const lastMessages = new Map();

  onValue(ref(db, "chats"), snap => {
    snap.forEach(c => {
      const msg = c.val();
      const key = msg.sender === "quanKa@gmail.com" ? msg.receiver : msg.sender;
      if (!key.includes("@")) return;
      if (!lastMessages.has(key) || msg.timestamp > lastMessages.get(key).timestamp) {
        lastMessages.set(key, msg);
      }
    });

    list.innerHTML = "<h3 class='font-semibold text-gray-700 mb-2'>Danh sách khách hàng</h3>";
    const users = [];
    onValue(ref(db, "users"), snap => {
      snap.forEach(child => {
        const u = child.val();
        if (u.role === "user") users.push(u);
      });

      users.sort((a, b) => {
        const aTime = lastMessages.get(a.email)?.timestamp || 0;
        const bTime = lastMessages.get(b.email)?.timestamp || 0;
        return bTime - aTime;
      });

      users.forEach(u => {
        const latestMsg = lastMessages.get(u.email);
        const isUnread = latestMsg && latestMsg.sender === u.email && selectedChatUser !== u.email;
        if (isUnread) unreadMap.set(u.email, true);

        const preview = latestMsg ? (latestMsg.content || latestMsg.message || "") : "Chưa có tin nhắn";

        const btn = document.createElement("button");
        btn.className = `w-full flex items-center justify-between p-2 border-b hover:bg-gray-100 rounded text-left ${unreadMap.get(u.email) ? 'font-bold bg-blue-50' : ''}`;
        btn.innerHTML = `
          <div class="flex items-center gap-2 w-full">
            <img src="${u.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.fullName)}" class="w-8 h-8 rounded-full object-cover" />
            <div class="flex-1">
              <div class="flex justify-between items-center">
                <div>${u.fullName}</div>
                ${unreadMap.get(u.email) ? '<span class="text-sm text-red-500">●</span>' : ''}
              </div>
              <div class="text-xs text-gray-500 truncate max-w-[180px]">${preview}</div>
              <div class="text-xs text-gray-400">${u.email}</div>
            </div>
          </div>
        `;
        btn.onclick = () => openChatWithUser(u.email, u.fullName, u.avatar);
        list.appendChild(btn);
      });
    });
  });
};

// Mở chat với người dùng
window.openChatWithUser = function (email, fullName, avatarUrl) {
  selectedChatUser = email;
  unreadMap.set(email, false);
  loadChat();
  document.getElementById("chatTarget").textContent = `💬 Đang chat với: ${fullName}`;
  const messagesDiv = document.getElementById("chatMessages");
  messagesDiv.style.maxHeight = 'calc(100vh - 250px)';

  onValue(ref(db, "chats"), snap => {
    messagesDiv.innerHTML = "";
    const messages = [];
    snap.forEach(c => {
      const msg = c.val();
      if ((msg.sender === email || msg.receiver === email) &&
          (msg.sender.includes("@") && msg.receiver.includes("@"))) {
        messages.push({ ...msg, key: c.key });
      }
    });

    messages.sort((a, b) => a.timestamp - b.timestamp);
    messages.forEach((msg) => {
      const isMe = msg.sender !== selectedChatUser;

      const msgContainer = document.createElement("div");
      msgContainer.className = `flex items-start gap-2 mb-2 relative ${isMe ? "justify-end" : "justify-start"}`;

      const avatar = document.createElement("img");
      avatar.src = isMe ? "https://ui-avatars.com/api/?name=Q" : (avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName));
      avatar.className = "w-8 h-8 rounded-full object-cover";

      const bubbleWrapper = document.createElement("div");
      bubbleWrapper.className = "relative";

      const bubble = document.createElement("div");
      bubble.className = `max-w-[75%] px-3 py-2 rounded-lg text-sm shadow-sm ${isMe ? "bg-blue-600 text-white" : "bg-white border text-gray-900"}`;

 if (msg.imageUrl || (msg.message && msg.message.startsWith("http"))) {
  bubble.className = "max-w-[300px] rounded-lg overflow-hidden"; // Không nền xanh
  bubble.innerHTML = `<img src="${msg.imageUrl || msg.message}" class="w-full rounded-lg" />`;
} else {
  bubble.className = `max-w-[75%] px-3 py-2 rounded-lg text-sm shadow-sm ${isMe ? "bg-blue-600 text-white" : "bg-white border text-gray-900"}`;
  bubble.innerHTML = `<span>${msg.content || msg.message}</span>`;
}


      bubbleWrapper.appendChild(bubble);

      // Menu 3 chấm chỉ cho tin nhắn của mình
      if (isMe) {
        const menu = document.createElement("div");
        menu.className = "absolute top-0 right-0 hidden bg-white border rounded shadow z-10";
        menu.innerHTML = `
          <button class="px-2 py-1 hover:bg-gray-100 w-full text-left">Sửa</button>
          <button class="px-2 py-1 hover:bg-gray-100 w-full text-left">Xóa</button>
        `;

        const [editBtn, deleteBtn] = menu.querySelectorAll("button");
        editBtn.onclick = () => editMessage(msg.key, msg.content);
        deleteBtn.onclick = () => deleteMessage(msg.key);

        bubbleWrapper.appendChild(menu);

        // Hiện menu khi hover
        bubbleWrapper.onmouseenter = () => menu.style.display = "block";
        bubbleWrapper.onmouseleave = () => menu.style.display = "none";
      }

      if (isMe) {
        msgContainer.appendChild(bubbleWrapper);
        msgContainer.appendChild(avatar);
      } else {
        msgContainer.appendChild(avatar);
        msgContainer.appendChild(bubbleWrapper);
      }

      messagesDiv.appendChild(msgContainer);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
};

// Gửi tin nhắn
window.sendChatMessage = function () {
  const input = document.getElementById("chatInput");
  const file = document.getElementById("chatImageInput").files[0];
  if (!selectedChatUser) return alert("Chưa chọn người dùng!");

  const sender = "quanKa@gmail.com";
  const receiver = selectedChatUser;
  const timestamp = Date.now();

  const send = (content, imageUrl = null) => {
    const data = {
      sender,
      receiver,
      timestamp,
      content,
      message: imageUrl || content,
      displayContent: imageUrl || content,
    };
    if (imageUrl) data.imageUrl = imageUrl;
    push(ref(db, "chats"), data);
    input.value = "";
    document.getElementById("chatImageInput").value = "";
  };

  if (file) {
    const uuid = crypto.randomUUID();
    const path = `chat_images/${uuid}_${file.name}`;
    const storageReference = storageRef(storage, path);
    uploadBytes(storageReference, file).then(snapshot => {
      getDownloadURL(snapshot.ref).then(url => send(url, url));
    });
  } else if (input.value.trim()) {
    send(input.value.trim());
  }
};

// Xóa tin nhắn
function deleteMessage(key) {
  remove(ref(db, `chats/${key}`));
}

// Sửa tin nhắn
function editMessage(key, oldContent) {
  const newContent = prompt("Chỉnh sửa tin nhắn:", oldContent);
  if (newContent !== null) {
    update(ref(db, `chats/${key}`), { content: newContent, message: newContent });
  }
}

// Load chat khi mở trang
window.addEventListener("DOMContentLoaded", loadChat);







/// === 💬 CHAT VỚI NGƯỜI DÙNG (MỚI) ===
// let selectedChatUser = null;
// const unreadMap = new Map();

// window.loadChat = function () {
//   const list = document.getElementById("chatUserList");
//   onValue(ref(db, "users"), snap => {
//     list.innerHTML = "<h3 class='font-semibold text-gray-700 mb-2'>Danh sách khách hàng</h3>";
//     const users = [];
//     snap.forEach(child => {
//       const u = child.val();
//       if (u.role === "user") users.push(u);
//     });

//     users.forEach(u => {
//       const btn = document.createElement("button");
//       btn.className = `w-full flex items-center justify-between p-2 border-b hover:bg-gray-100 rounded text-left ${unreadMap.get(u.email) ? 'font-bold bg-blue-50' : ''}`;
//       btn.innerHTML = `
//         <div class="flex items-center gap-2">
//           <img src="${u.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.fullName)}" class="w-8 h-8 rounded-full object-cover" />
//           <div>
//             <div>${u.fullName}</div>
//             <div class="text-xs text-gray-500">${u.email}</div>
//           </div>
//         </div>
//         ${unreadMap.get(u.email) ? '<span class="text-sm text-red-500">●</span>' : ''}
//       `;
//       btn.onclick = () => openChatWithUser(u.email, u.fullName, u.avatar);
//       list.appendChild(btn);
//     });
//   });
// };

// window.openChatWithUser = function (email, fullName, avatarUrl) {
//   selectedChatUser = email;
//   unreadMap.set(email, false);
//   loadChat();
//   document.getElementById("chatTarget").textContent = `💬 Đang chat với: ${fullName}`;
//   const messagesDiv = document.getElementById("chatMessages");

//   onValue(ref(db, "chats"), snap => {
//     messagesDiv.innerHTML = "";
//     const messages = [];
//     snap.forEach(c => {
//       const msg = c.val();
//       if ((msg.sender === email || msg.receiver === email) &&
//           (msg.sender.includes("@") && msg.receiver.includes("@"))) {
//         messages.push({ ...msg, key: c.key });
//       }
//     });

//     messages.sort((a, b) => a.timestamp - b.timestamp);
//     messages.forEach((msg, index) => {
//       const isMe = msg.sender !== selectedChatUser;

//       const msgContainer = document.createElement("div");
//       msgContainer.className = `flex items-start gap-2 mb-2 ${isMe ? "justify-end" : "justify-start"}`;

//       const avatar = document.createElement("img");
//       avatar.src = isMe ? "https://ui-avatars.com/api/?name=Q" : (avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName));
//       avatar.className = "w-8 h-8 rounded-full object-cover";

//       const bubble = document.createElement("div");
//       bubble.className = `max-w-[75%] px-3 py-2 rounded-lg text-sm shadow-sm ${isMe ? "bg-blue-600 text-white" : "bg-white border text-gray-900"}`;

//       if (msg.imageUrl || (msg.message && msg.message.startsWith("http"))) {
//         bubble.innerHTML = `<img src="${msg.imageUrl || msg.message}" class="max-w-[180px] rounded-lg" />`;
//       } else {
//         bubble.innerHTML = `<span class="${index === messages.length - 1 ? 'font-semibold' : ''}">${msg.content || msg.message}</span>`;
//       }

//       if (isMe) {
//         msgContainer.appendChild(bubble);
//         msgContainer.appendChild(avatar);
//       } else {
//         msgContainer.appendChild(avatar);
//         msgContainer.appendChild(bubble);
//       }

//       messagesDiv.appendChild(msgContainer);
//     });

//     messagesDiv.scrollTop = messagesDiv.scrollHeight;
//   });
// };

// window.sendChatMessage = function () {
//   const input = document.getElementById("chatInput");
//   const file = document.getElementById("chatImageInput").files[0];
//   if (!selectedChatUser) return alert("Chưa chọn người dùng!");

//   const sender = "quancu@gmail.com";
//   const receiver = selectedChatUser;
//   const timestamp = Date.now();

//   const send = (content, imageUrl = null) => {
//     const data = {
//       sender,
//       receiver,
//       timestamp,
//       content,
//       message: imageUrl || content,
//       displayContent: imageUrl || content,
//     };
//     if (imageUrl) data.imageUrl = imageUrl;
//     push(ref(db, "chats"), data);
//     input.value = "";
//     document.getElementById("chatImageInput").value = "";
//   };

//   if (file) {
//     const uuid = crypto.randomUUID();
//     const path = `chat_images/${uuid}_${file.name}`;
//     const storageReference = storageRef(storage, path);
//     uploadBytes(storageReference, file).then(snapshot => {
//       getDownloadURL(snapshot.ref).then(url => send(url, url));
//     });
//   } else if (input.value.trim()) {
//     send(input.value.trim());
//   }
// };

// // Gọi lúc tải trang
// window.addEventListener("DOMContentLoaded", loadChat);



window.addEventListener("DOMContentLoaded", () => {
  loadUsers();
  loadChat();
  
  manageProducts();
  loadOrdersByStatus();
});
window.addDemoProducts = function () {
  const products = [
    // ==== KỆ ====
    {
      id: "product_ke_1",
      name: "Kệ Gỗ Trang Trí Treo Tường",
      categoryId: "Nội thất phòng khách",
      imageUrl: "https://gotrangtri.vn/wp-content/uploads/2021/08/ke-go-treo-tuong.jpg",
      variants: {
        "80x20cm": {
          "Nâu": {
            quantity: 10,
            price: 450000,
            image: "https://gotrangtri.vn/wp-content/uploads/2021/08/ke-nau.jpg"
          }
        }
      }
    },
    {
      id: "product_ke_2",
      name: "Kệ Sách Gỗ 5 Tầng",
      categoryId: "Nội thất phòng làm việc",
      imageUrl: "https://noithatduckhang.com/wp-content/uploads/2021/05/ke-sach-go-5-tang.jpg",
      variants: {
        "60x150cm": {
          "Tự nhiên": {
            quantity: 7,
            price: 790000,
            image: "https://noithatduckhang.com/wp-content/uploads/2021/05/ke-tu-nhien.jpg"
          }
        }
      }
    },
    {
      id: "product_ke_3",
      name: "Kệ Góc Tường 4 Tầng",
      categoryId: "Nội thất phòng ngủ",
      imageUrl: "https://noithatvietxanh.vn/upload/images/ke-goc-4-tang.jpg",
      variants: {
        "30x120cm": {
          "Trắng": {
            quantity: 12,
            price: 560000,
            image: "https://noithatvietxanh.vn/upload/images/ke-trang.jpg"
          }
        }
      }
    },
    {
      id: "product_ke_4",
      name: "Kệ Tivi Gỗ Công Nghiệp",
      categoryId: "Nội thất phòng khách",
      imageUrl: "https://biznoithat.com/wp-content/uploads/2020/11/ke-tivi-go-cong-nghiep.jpg",
      variants: {
        "180x40cm": {
          "Nâu sẫm": {
            quantity: 5,
            price: 1850000,
            image: "https://biznoithat.com/wp-content/uploads/2020/11/ke-nau-sam.jpg"
          }
        }
      }
    },
    {
      id: "product_ke_5",
      name: "Kệ Trang Trí Đa Năng Gỗ Sồi",
      categoryId: "Nội thất phòng khách",
      imageUrl: "https://gotrangtri.vn/wp-content/uploads/2022/05/ke-trang-tri-go-soi.jpg",
      variants: {
        "100x80cm": {
          "Tự nhiên": {
            quantity: 6,
            price: 950000,
            image: "https://gotrangtri.vn/wp-content/uploads/2022/05/ke-da-nang.jpg"
          }
        }
      }
    }
  ];

  const tasks = products.map(prod => {
    const productRef = ref(db, "product/" + prod.id);
    return set(productRef, {
      name: prod.name,
      categoryId: prod.categoryId,
      imageUrl: prod.imageUrl,
      variants: prod.variants
    });
  });

  Promise.all(tasks)
    .then(() => {
      alert("✅ Đã tạo 5 sản phẩm về kệ.");
      manageProducts();
    })
    .catch((err) => {
      alert("❌ Lỗi khi tạo sản phẩm: " + err.message);
    });
};



let editBannerId = null;
let oldImageUrl = null;

// 🔹 Thêm banner
window.addBanner = async function () {
  const file = document.getElementById("bannerImageFile").files[0];
  if (!file) return alert("Vui lòng chọn ảnh!");

  const imgRef = storageRef(storage, "banners/" + Date.now() + "_" + file.name);
  await uploadBytes(imgRef, file);
  const url = await getDownloadURL(imgRef);

  await set(push(ref(db, "banners")), { imageUrl: url });
  resetForm();
};

// 🔹 Hiển thị danh sách banner
function loadBanners() {
  onValue(ref(db, "banners"), (snapshot) => {
    const list = document.getElementById("bannerList");
    list.innerHTML = "";
    snapshot.forEach((child) => {
      const data = child.val();
      const row = `
        <tr>
          <td class="border p-2"><img src="${data.imageUrl}" class="w-32"></td>
          <td class="border p-2">
            <button onclick="editBanner('${child.key}', '${data.imageUrl}')" class="bg-blue-500 text-white px-2 py-1 rounded">Sửa</button>
            <button onclick="deleteBanner('${child.key}', '${data.imageUrl}')" class="bg-red-500 text-white px-2 py-1 rounded">Xóa</button>
          </td>
        </tr>
      `;
      list.innerHTML += row;
    });
  });
}

// 🔹 Sửa banner
window.editBanner = function (id, imageUrl) {
  editBannerId = id;
  oldImageUrl = imageUrl;
  document.getElementById("btnAddBanner").classList.add("hidden");
  document.getElementById("btnUpdateBanner").classList.remove("hidden");
  alert("Chọn ảnh mới nếu muốn thay đổi hình!");
};

// 🔹 Cập nhật banner
window.updateBanner = async function () {
  if (!editBannerId) return;

  const file = document.getElementById("bannerImageFile").files[0];
  if (!file) return alert("Vui lòng chọn ảnh mới!");

  // Upload ảnh mới
  const imgRef = storageRef(storage, "banners/" + Date.now() + "_" + file.name);
  await uploadBytes(imgRef, file);
  const url = await getDownloadURL(imgRef);

  await update(ref(db, "banners/" + editBannerId), { imageUrl: url });
  resetForm();
};

// 🔹 Xóa banner
window.deleteBanner = async function (id, imageUrl) {
  if (!confirm("Bạn có chắc muốn xóa banner này?")) return;

  try {
    const imgRef = storageRef(storage, imageUrl);
    await deleteObject(imgRef);
  } catch (err) {
    console.warn("Không thể xóa ảnh:", err);
  }

  await remove(ref(db, "banners/" + id));
};

// 🔹 Reset form
function resetForm() {
  document.getElementById("bannerImageFile").value = "";
  document.getElementById("btnAddBanner").classList.remove("hidden");
  document.getElementById("btnUpdateBanner").classList.add("hidden");
  editBannerId = null;
  oldImageUrl = null;
}

// 🔹 Tải danh sách khi load trang
loadBanners();




  