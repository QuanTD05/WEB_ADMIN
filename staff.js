// === 🔧 FIREBASE KHỞI TẠO ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase, ref, push, set, onValue, remove, update
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import {
  getStorage, ref as sRef, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";



// cấu hình Firebase (giữ nguyên từ bạn)
const firebaseConfig = {
  apiKey: "AIzaSyBsf_IgEEci-NbSXDGLB7mQZvP_SRGMD6o",
  authDomain: "appmobile-c561a.firebaseapp.com",
  databaseURL: "https://appmobile-c561a-default-rtdb.firebaseio.com",
  projectId: "appmobile-c561a",
  storageBucket: "appmobile-c561a.appspot.com",
  messagingSenderId: "75581709372",
  appId: "1:75581709372:web:484cde5c4141fc7aef3739",
  measurementId: "G-2EPN2ZZM8M"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

// === XỬ LÝ ADMIN / ROLE ===
let staffId = localStorage.getItem("staffId");
if (!staffId) staffId = prompt("Nhập ID nhân viên/admin:");
localStorage.setItem("staffId", staffId);

const userRef = ref(db, `users/${staffId}`);
onValue(userRef, (snap) => {
  if (!snap.exists()) {
    alert("Không tìm thấy thông tin tài khoản.");
    return;
  }
  const user = snap.val();
  document.getElementById("staffName").textContent = user.fullName || "Admin";
  document.getElementById("staffAvatar").src =
    user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || "Admin")}`;

  if (user.role !== "staff") {
    document.getElementById("adminPanelWrapper")?.classList.add("hidden");
    alert("Bạn không có quyền truy cập trang quản trị.");
    return;
  }
  document.getElementById("panelTitle").textContent = "Nhân viên - Quản lý đơn hàng";
});

// === HỖ TRỢ HIỂN THỊ SECTION ===
function hideAllSections() {
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
}
window.showSection = function (id) {
  hideAllSections();
  const sec = document.getElementById(id);
  if (sec) sec.classList.remove("hidden");
};

// === SIDEBAR ORDER MENU ===
window.toggleOrderSubmenu = function () {
  const submenu = document.getElementById("orderSubmenu");
  const arrow = document.getElementById("orderMenuArrow");
  if (submenu.classList.contains("hidden")) {
    submenu.classList.remove("hidden");
    arrow.textContent = "▴";
  } else {
    submenu.classList.add("hidden");
    arrow.textContent = "▾";
  }
};

const orderGroupIds = [
  "pending",
  "ondelivery",
  "completed",
  "return_requested",
  "returned",
  "cancelled",
];

// hiển thị theo category (status); "all" hiển thị toàn bộ
window.showOrderCategory = function (status) {
  showSection("orders");
  orderGroupIds.forEach((s) => {
    const group = document.getElementById(`group_${s}`);
    if (!group) return;
    if (status === "all") {
      group.classList.remove("hidden");
    } else {
      group.classList.toggle("hidden", s !== status);
    }
  });

  document.querySelectorAll("#orderSubmenu button").forEach((btn) => {
    if (btn.dataset.filter === status) {
      btn.classList.add("bg-gray-200", "font-semibold");
    } else {
      btn.classList.remove("bg-gray-200", "font-semibold");
    }
  });
};

// === FILTER ADMIN ===
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

// === QUẢN LÝ NGƯỜI DÙNG ===
window.loadUsers = function () {
  const userTable = document.getElementById("userTableBody");
  onValue(ref(db, "users"), (snapshot) => {
    userTable.innerHTML = "";
    snapshot.forEach((child) => {
      const user = child.val();
      if (user.role === "user" ) { // hiển thị cả user và admin nếu cần
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="p-2 border">${user.fullName}</td>
          <td class="p-2 border">${user.email}</td>
          <td class="p-2 border">${user.phone}</td>
          <td class="p-2 border">${user.role}</td>
          <td class="p-2 border space-x-2">
            <button onclick="editUser('${child.key}')" class="bg-yellow-400 text-white px-2 py-1 rounded">Sửa</button>
            <button onclick="deleteUser('${child.key}')" class="bg-red-500 text-white px-2 py-1 rounded">Xoá</button>
          </td>`;
        userTable.appendChild(tr);
      }
    });
  });
};

window.editUser = function (id) {
  const userRefObj = ref(db, `users/${id}`);
  onValue(userRefObj, (snapshot) => {
    if (snapshot.exists()) {
      const u = snapshot.val();
      // hiển thị form - bạn cần có modal tương ứng trong HTML nếu muốn edit
      console.log("Edit user", id, u);
    }
  }, { onlyOnce: true });
};

window.deleteUser = function (id) {
  if (confirm("Xác nhận xoá người dùng này?")) {
    remove(ref(db, `users/${id}`))
      .then(() => alert("Đã xoá."))
      .catch(err => alert("Lỗi: " + err.message));
  }
};

// === 🛒 QUẢN LÝ SẢN PHẨM ===

// === 🛒 QUẢN LÝ SẢN PHẨM ===
window.openAddForm = () => {
  document.getElementById("productForm").reset();
  document.getElementById("editId").value = "";
  document.getElementById("variantsContainer").innerHTML = "";
  addVariantRow();
  document.getElementById("productFormModal").classList.remove("hidden");
};

window.closeForm = () => {
  document.getElementById("productFormModal").classList.add("hidden");
};

window.addVariantRow = () => {
  const container = document.getElementById("variantsContainer");
  const row = document.createElement("div");
  row.className = "grid grid-cols-6 gap-2 items-center";
  row.innerHTML = `
    <input name="size" placeholder="Kích thước" class="p-2 border rounded" required />
    <input name="color" placeholder="Màu" class="p-2 border rounded" required />
    <input name="qty" type="number" placeholder="SL" class="p-2 border rounded" required />
    <input name="vprice" type="number" placeholder="Giá" class="p-2 border rounded" required />
    <input name="vimage" type="file" accept="image/*" class="p-2 border rounded" />
    <button type="button" onclick="this.parentElement.remove()" class="text-red-600">✖</button>
  `;
  container.appendChild(row);
};

window.manageProducts = function () {
  const tbody = document.getElementById("productTableBody");
  tbody.innerHTML = `<tr><td colspan='7' class='text-center p-4'>Đang tải...</td></tr>`;

  onValue(ref(db, "product"), (snapshot) => {
    tbody.innerHTML = "";
    if (!snapshot.exists()) {
      tbody.innerHTML = `<tr><td colspan='7' class='text-center p-4'>Không có sản phẩm.</td></tr>`;
      return;
    }

    snapshot.forEach((child) => {
      const p = child.val();
      const productId = child.key;
      const tr = document.createElement("tr");

      const variantCount = Object.values(p.variants || {}).reduce((sum, colors) => {
        return sum + Object.keys(colors).length;
      }, 0);

      const reviewRef = ref(db, `reviews/${productId}`);
      onValue(reviewRef, (reviewSnap) => {
        let totalRating = 0;
        let reviewCount = 0;

        reviewSnap.forEach(r => {
          const rev = r.val();
          if (rev.rating) {
            totalRating += parseFloat(rev.rating);
            reviewCount += 1;
          }
        });

        const avg = reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : '-';
        const reviewDisplay = reviewCount > 0 ? `${avg} ⭐ (${reviewCount})` : 'Chưa có';

        tr.innerHTML = `
          <td class="p-2 border"><img src="${p.imageUrl || "#"}" width="60" /></td>
          <td class="p-2 border">${p.name}</td>
          <td class="p-2 border">${p.categoryId}</td>
          <td class="p-2 border">${variantCount} biến thể</td>
          <td class="p-2 border">${reviewDisplay}</td>
         
          <td class="p-2 border">
            <button onclick="editProduct('${productId}')" class="bg-yellow-400 px-2 py-1 rounded text-white">Sửa</button>
            <button onclick="deleteProduct('${productId}')" class="bg-red-500 px-2 py-1 rounded text-white ml-2">Xoá</button>
          </td>
        `;
      }, { onlyOnce: true });

      tbody.appendChild(tr);
    });
  });
};

window.editProduct = function (id) {
  const productRef = ref(db, `product/${id}`);
  onValue(productRef, (snap) => {
    if (!snap.exists()) return;
    const p = snap.val();
    document.getElementById("editId").value = id;
    document.getElementById("name").value = p.name;
    document.getElementById("categoryId").value = p.categoryId;
    document.getElementById("variantsContainer").innerHTML = "";
    if (p.variants) {
      Object.entries(p.variants).forEach(([size, colors]) => {
        Object.entries(colors).forEach(([color, info]) => {
          const row = document.createElement("div");
          row.className = "grid grid-cols-6 gap-2 items-center";
          row.innerHTML = `
            <input name="size" value="${size}" class="p-2 border rounded" required />
            <input name="color" value="${color}" class="p-2 border rounded" required />
            <input name="qty" type="number" value="${info.quantity}" class="p-2 border rounded" required />
            <input name="vprice" type="number" value="${info.price}" class="p-2 border rounded" required />
            <input name="vimage" type="file" accept="image/*" class="p-2 border rounded" />
            <button type="button" onclick="this.parentElement.remove()" class="text-red-600">✖</button>`;
          document.getElementById("variantsContainer").appendChild(row);
        });
      });
    }
    document.getElementById("productFormModal").classList.remove("hidden");
  }, { onlyOnce: true });
};

window.deleteProduct = function (id) {
  if (confirm("Bạn muốn xoá sản phẩm này?")) {
    remove(ref(db, `product/${id}`)).then(() => alert("Đã xoá."));
  }
};

document.getElementById("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const categoryId = document.getElementById("categoryId").value;
  const imageFile = document.getElementById("imageFile").files[0];
  const editId = document.getElementById("editId").value;
  let imageUrl = "";

  if (imageFile) {
    const imgRef = storageRef(storage, `products/main_${Date.now()}_${imageFile.name}`);
    const snap = await uploadBytes(imgRef, imageFile);
    imageUrl = await getDownloadURL(snap.ref);
  }

  const sizeEls = document.getElementsByName("size");
  const colorEls = document.getElementsByName("color");
  const qtyEls = document.getElementsByName("qty");
  const priceEls = document.getElementsByName("vprice");
  const vimgEls = document.getElementsByName("vimage");
  const variants = {};

  for (let i = 0; i < sizeEls.length; i++) {
    const size = sizeEls[i].value.trim();
    const color = colorEls[i].value.trim();
    const quantity = parseInt(qtyEls[i].value);
    const price = parseFloat(priceEls[i].value);
    let vimgUrl = "";

    if (vimgEls[i].files[0]) {
      const vRef = storageRef(storage, `variants/${Date.now()}_${vimgEls[i].files[0].name}`);
      const vsnap = await uploadBytes(vRef, vimgEls[i].files[0]);
      vimgUrl = await getDownloadURL(vsnap.ref);
    }

    if (!variants[size]) variants[size] = {};
    variants[size][color] = { quantity, price, image: vimgUrl };
  }

  const data = { name, categoryId, variants };
  if (imageUrl) data.imageUrl = imageUrl;

  if (editId) {
    await update(ref(db, `product/${editId}`), data);
    alert("Đã cập nhật.");
  } else {
    const newRef = push(ref(db, "product"));
    data.productId = newRef.key;
    await set(newRef, data);
    alert("Đã thêm sản phẩm.");
  }

  document.getElementById("productForm").reset();
  document.getElementById("variantsContainer").innerHTML = "";
  addVariantRow();
  closeForm();
});

// === ĐƠN HÀNG ===
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

// Gửi thông báo sang app user
function sendUserNotification(userId, orderId, status) {
  let message = "";
  switch (status) {
    case "ondelivery":
      message = `Đơn hàng #${orderId} đã được xác nhận và đang giao.`;
      break;
    case "completed":
      message = `Đơn hàng #${orderId} đã giao thành công.`;
      break;
    case "cancelled":
      message = `Đơn hàng #${orderId} đã bị hủy.`;
      break;
    case "return_requested":
      message = `Bạn đã gửi yêu cầu hoàn trả cho đơn hàng #${orderId}.`;
      break;
    case "returned":
      message = `Đơn hàng #${orderId} đã hoàn trả thành công.`;
      break;
    default:
      message = `Đơn hàng #${orderId} đã được cập nhật trạng thái.`;
  }

  const notiData = {
    title: "Thông báo đơn hàng",
    message: message,
    type: "order",
    timestamp: Date.now(),
  };

  push(ref(db, `notifications/${userId}`), notiData);
}

function createOrderRow(orderEntry) {
  const { order, orderId, userId } = orderEntry;
  const tr = document.createElement("tr");

  const totalFormatted =
    typeof order.totalAmount === "number"
      ? order.totalAmount.toLocaleString()
      : Number(order.totalAmount || 0).toLocaleString();
  const timeStr = formatTimestamp(order.timestamp || order.createdAt || 0);

  let actionCell = "";
  const status = (order.status || "").toLowerCase();

  if (status === "pending") {
    actionCell = `
      <button onclick="updateOrderStatus('${userId}', '${orderId}', 'ondelivery')" class='bg-green-500 text-white px-2 py-1 rounded mr-1'>Xác nhận</button>
      <button onclick="cancelOrder('${userId}', '${orderId}')" class='bg-red-500 text-white px-2 py-1 rounded'>Huỷ</button>
    `;
  } else if (status === "ondelivery") {
    actionCell = `
      <button onclick="updateOrderStatus('${userId}', '${orderId}', 'completed')" class='bg-blue-500 text-white px-2 py-1 rounded mr-1'>Xác nhận nhận hàng</button>
      <button onclick="cancelOrder('${userId}', '${orderId}')" class='bg-red-500 text-white px-2 py-1 rounded'>Huỷ</button>
    `;
  } else if (status === "completed") {
    actionCell = `
      <button onclick="requestReturnOrder('${userId}', '${orderId}')" class='bg-yellow-500 text-white px-2 py-1 rounded'>Yêu cầu hoàn trả</button>
    `;
  } else if (status === "return_requested") {
    actionCell = `
      <button onclick="cancelReturnRequest('${userId}', '${orderId}')" class='bg-orange-500 text-white px-2 py-1 rounded mr-1'>Huỷ yêu cầu hoàn trả</button>
      <button onclick="markReturned('${userId}', '${orderId}')" class='bg-green-600 text-white px-2 py-1 rounded'>Đã hoàn trả</button>
    `;
  } else if (status === "returned") {
    actionCell = `<span class='text-gray-600 font-semibold'>Đã hoàn trả</span>`;
  } else if (status === "cancelled") {
    actionCell = `<span class='text-red-500 font-semibold'>❌ Đã huỷ</span>`;
  }

  let statusDisplay = status;
  if (status === "ondelivery") statusDisplay = "Đang giao";
  else if (status === "pending") statusDisplay = "Chờ xử lý";
  else if (status === "completed") statusDisplay = "Đã giao";
  else if (status === "cancelled") statusDisplay = "Đã huỷ";
  else if (status === "return_requested") statusDisplay = "Yêu cầu hoàn trả";
  else if (status === "returned") statusDisplay = "Hoàn trả thành công";

  tr.innerHTML = `
    <td class='p-2 border'>${order.orderId || orderId}</td>
    <td class='p-2 border'>${order.receiverName || ""}</td>
    <td class='p-2 border'>${order.receiverAddress || ""}</td>
    <td class='p-2 border'>${totalFormatted} VND</td>
    <td class='p-2 border'>${timeStr}</td>
    <td class='p-2 border'>
      <button onclick="showOrderDetail('${orderId}', '${userId}')" class='bg-gray-500 text-white px-2 py-1 rounded'>Chi tiết</button>
    </td>
    <td class='p-2 border'>${actionCell}</td>
    <td class='p-2 border font-medium'>${statusDisplay}</td>
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

  if (ordersListener) {
    // bỏ qua hủy listener
  }

  ordersListener = onValue(ref(db, "orders"), (snapshot) => {
    if (pendingBody) pendingBody.innerHTML = "";
    if (shippingBody) shippingBody.innerHTML = "";
    if (completedBody) completedBody.innerHTML = "";
    if (cancelledBody) cancelledBody.innerHTML = "";
    if (returnRequestedBody) returnRequestedBody.innerHTML = "";
    if (returnedBody) returnedBody.innerHTML = "";

    const pendingOrders = [];
    const shippingOrders = [];
    const completedOrders = [];
    const returnRequestedOrders = [];
    const returnedOrders = [];
    const cancelledOrders = [];

    snapshot.forEach((userSnapshot) => {
      const userId = userSnapshot.key;
      userSnapshot.forEach((orderSnapshot) => {
        const order = orderSnapshot.val();
        const orderId = orderSnapshot.key;
        const entry = { order, orderId, userId };
        const st = (order.status || "").toLowerCase();
        switch (st) {
          case "pending":
            pendingOrders.push(entry);
            break;
          case "ondelivery":
            shippingOrders.push(entry);
            break;
          case "completed":
            completedOrders.push(entry);
            break;
          case "return_requested":
            returnRequestedOrders.push(entry);
            break;
          case "returned":
            returnedOrders.push(entry);
            break;
          case "cancelled":
            cancelledOrders.push(entry);
            break;
        }
      });
    });

    const sortByTimeDesc = (arr) =>
      arr.sort((a, b) => {
        const ta = Number(a.order.timestamp || a.order.createdAt || 0);
        const tb = Number(b.order.timestamp || b.order.createdAt || 0);
        return tb - ta;
      });

    sortByTimeDesc(pendingOrders);
    sortByTimeDesc(shippingOrders);
    sortByTimeDesc(completedOrders);
    sortByTimeDesc(returnRequestedOrders);
    sortByTimeDesc(returnedOrders);
    sortByTimeDesc(cancelledOrders);

    pendingOrders.forEach((entry) => pendingBody.appendChild(createOrderRow(entry)));
    shippingOrders.forEach((entry) => shippingBody.appendChild(createOrderRow(entry)));
    completedOrders.forEach((entry) => completedBody.appendChild(createOrderRow(entry)));
    returnRequestedOrders.forEach((entry) => returnRequestedBody.appendChild(createOrderRow(entry)));
    returnedOrders.forEach((entry) => returnedBody.appendChild(createOrderRow(entry)));
    cancelledOrders.forEach((entry) => cancelledBody.appendChild(createOrderRow(entry)));
  });
}

// === HÀNH ĐỘNG ĐƠN ===
window.updateOrderStatus = function (userId, orderId, status) {
  update(ref(db, `orders/${userId}/${orderId}`), { status })
    .then(() => {
      alert(`✅ Đã chuyển sang '${status}'`);
      sendUserNotification(userId, orderId, status);
    })
    .catch((err) => alert("❌ Lỗi: " + err.message));
};

window.cancelOrder = function (userId, orderId) {
  if (confirm("❗ Bạn có chắc chắn muốn huỷ đơn hàng này không?")) {
    update(ref(db, `orders/${userId}/${orderId}`), { status: "cancelled" })
      .then(() => {
        alert("✅ Đơn hàng đã được huỷ");
        sendUserNotification(userId, orderId, "cancelled");
      })
      .catch((err) => alert("❌ Lỗi khi huỷ đơn hàng: " + err.message));
  }
};

window.requestReturnOrder = function (userId, orderId) {
  // ... giữ nguyên code dialog của bạn ...
  // khi update xong trạng thái thì thêm:
  update(ref(db, `orders/${userId}/${orderId}`), { status: "return_requested" })
    .then(() => {
      sendUserNotification(userId, orderId, "return_requested");
    });
};

window.cancelReturnRequest = function (userId, orderId) {
  if (!confirm("Bạn có muốn huỷ yêu cầu hoàn trả?")) return;
  update(ref(db, `orders/${userId}/${orderId}`), { status: "completed" })
    .then(() => {
      remove(ref(db, `orders/${userId}/${orderId}/return`));
      sendUserNotification(userId, orderId, "completed");
    })
    .catch((err) => alert("Lỗi: " + err.message));
};

window.markReturned = function (userId, orderId) {
  if (!confirm("Xác nhận đã hoàn trả đơn hàng này?")) return;
  update(ref(db, `orders/${userId}/${orderId}`), { status: "returned" })
    .then(() => {
      alert("Đơn đã được đánh dấu là Hoàn trả thành công.");
      sendUserNotification(userId, orderId, "returned");
    })
    .catch((err) => alert("Lỗi: " + err.message));
};

// === KHỞI TẠO BAN ĐẦU ===
window.addEventListener("DOMContentLoaded", () => {
  loadUsers();
  manageProducts();
  loadOrdersByStatus();
  showOrderCategory("pending");
});


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
/// === 💬 CHAT VỚI NGƯỜI DÙNG (MỚI) ===
let selectedChatUser = null;
const unreadMap = new Map();

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

      // Sắp xếp theo tin nhắn gần nhất
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
    messages.forEach((msg, index) => {
      const isMe = msg.sender !== selectedChatUser;

      const msgContainer = document.createElement("div");
      msgContainer.className = `flex items-start gap-2 mb-2 ${isMe ? "justify-end" : "justify-start"}`;

      const avatar = document.createElement("img");
      avatar.src = isMe ? "https://ui-avatars.com/api/?name=Q" : (avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName));
      avatar.className = "w-8 h-8 rounded-full object-cover";

      const bubble = document.createElement("div");
      bubble.className = `max-w-[75%] px-3 py-2 rounded-lg text-sm shadow-sm ${isMe ? "bg-blue-600 text-white" : "bg-white border text-gray-900"}`;

      if (msg.imageUrl || (msg.message && msg.message.startsWith("http"))) {
        bubble.innerHTML = `<img src="${msg.imageUrl || msg.message}" class="max-w-[180px] rounded-lg" />`;
      } else {
        bubble.innerHTML = `<span>${msg.content || msg.message}</span>`;
      }

      if (isMe) {
        msgContainer.appendChild(bubble);
        msgContainer.appendChild(avatar);
      } else {
        msgContainer.appendChild(avatar);
        msgContainer.appendChild(bubble);
      }

      messagesDiv.appendChild(msgContainer);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
};

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

// Gọi lúc tải trang
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

    const storageRef = sRef(storage, "banners/" + Date.now() + "_" + file.name);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

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

    // Xóa ảnh cũ
    if (oldImageUrl) {
      try {
        const oldRef = sRef(storage, oldImageUrl);
        await deleteObject(oldRef);
      } catch (err) {
        console.warn("Không xóa được ảnh cũ:", err);
      }
    }

    // Upload ảnh mới
    const storageRef = sRef(storage, "banners/" + Date.now() + "_" + file.name);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await update(ref(db, "banners/" + editBannerId), { imageUrl: url });
    resetForm();
  };

  // 🔹 Xóa banner
  window.deleteBanner = async function (id, imageUrl) {
    if (!confirm("Bạn có chắc muốn xóa banner này?")) return;

    try {
      const imgRef = sRef(storage, imageUrl);
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
