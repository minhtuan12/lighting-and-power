# C2C Marketplace (Subdomain Architecture) - Progress Tracking

File này được dùng để quản lý module C2C Marketplace (Người dùng mua bán/trao đổi với nhau) chạy trên một subdomain riêng biệt (`c2c.domain.com`).

## Mục tiêu (Objectives)
- Hệ thống C2C hoạt động hoàn toàn độc lập trên subdomain `c2c.domain.com` (hoặc `c2c.localhost`).
- Có Toggle chuyển đổi giữa trang Web chính và trang C2C trên Header.
- Người dùng (đã đăng nhập) có thể đăng tin, hiển thị sản phẩm và quản lý tin rao bán.

## Danh sách công việc (Tasks)

- [x] **Khởi tạo & Lên kế hoạch**
  - [x] Chốt định hướng Subdomain (c2c.domain.com).
  - [x] Lên Implementation Plan và chờ người dùng duyệt.
  
- [x] **Routing & Middleware (Next.js)**
  - [x] Khởi tạo / cấu hình `middleware.ts` để chặn `host` header.
  - [x] Viết logic rewrite: Nếu `host` là `c2c.*` thì route vào thư mục `src/app/[locale]/(c2c)`.

- [x] **Backend (API & DB)**
  - [x] Khởi tạo model `C2CProduct` (`src/models/c2c-product.ts`).
  - [x] Viết `c2c.service.ts` để xử lý logic lưu trữ và lấy dữ liệu.
  - [x] Làm API endpoints (`POST`, `GET`, `PUT`, `DELETE` trong `/api/c2c/products/...`).

- [x] **Frontend (UI/UX - Subdomain)**
  - [x] Khởi tạo cấu trúc `src/app/[locale]/(c2c)` với `layout.tsx` riêng biệt cho C2C.
  - [x] Làm nút Toggle trên Header chính để redirect sang `c2c.domain.com`.
  - [x] Trang Feed Chợ C2C hiển thị danh sách sản phẩm.
  - [x] Trang Đăng bán & Trang Quản lý tin cá nhân (chỉ dành cho logged in user).
  - [x] Trang Chi tiết Sản phẩm.

- [ ] **Kiểm thử (Testing)**
  - [x] Test luồng routing: redirect đúng subdomain local (`c2c.localhost:4000`).
  - [ ] Luồng quản lý sửa/xóa tin.
  - [ ] Đảm bảo web chính không bị vỡ giao diện.

## Ghi chú (Notes)
*(Thêm ghi chú, link tham khảo hoặc hướng giải quyết lỗi vào đây trong quá trình dev)*
