# Mobile Development Planning: Route-by-Route Feature Inventory

## 1) Scope and assumptions

This document inventories **current web-app features by route** so the team can
plan parity for a mobile app.

- All routes are locale-prefixed in production (`/[locale]/...`).
- Public user flows, authenticated user flows, and admin flows are covered.
- API endpoints are summarized in a dedicated section to support mobile
  integration planning.

---

## 2) Cross-route foundations (shared behavior)

### 2.1 Locale and i18n

- Locale-aware root layout with static params generation.
- Message dictionary loading via `next-intl`.

### 2.2 Public shell (user area)

- Shared `Header` + `Footer` for user routes.
- Home/product/document/contact navigation from route constants.
- Global “go to top” floating action.

### 2.3 Client providers

- Jotai + React Query providers for interactive/authenticated client pages.
- Local storage initializes locale/currency (`VND`).

### 2.4 Admin shell

- Protected admin area requiring admin auth.
- Sidebar navigation for
  accounts/categories/products/documents/inquiries/settings.
- Top breadcrumb bar populated by each admin page.

---

## 3) Public user routes (mobile customer app)

## 3.1 `/{locale}/` (Home)

**Current features**

- Banner carousel from configuration data.
- Value proposition/intro cards (shipping, support, quality, payment).
- Featured top categories (with children) and top document section.

**Mobile planning notes**

- Convert carousel to swipeable cards and lazy image loading.
- Keep fast entry points to product categories/documents.

## 3.2 `/{locale}/san-pham` and nested category paths (`.../san-pham/[[...slug]]`)

This route is rendered using parallel segments:

- `@sidebar`: categories/filters/featured products.
- `@content`: category listing, product listing, or product detail.

### Sidebar behavior

- If current slug is a category leaf: show advanced product `Filters`.
- Else: show child category shortcuts.
- Always shows featured products module.

### Content behavior

- Parent/non-leaf category: show category cards.
- Leaf category: show product grid + pagination.
- Detail path (`chi-tiet`/`detail` in slug): render product detail page.

**Mobile planning notes**

- Prefer one-screen architecture with tabs/chips for “Danh mục | Bộ lọc”.
- Use bottom sheet for filters on small screens.
- Preserve deep links for category chains and product detail slugs.

## 3.3 `/{locale}/tai-lieu-dien-tu` (Document library)

**Current features**

- Grid of published documents with thumbnail + title.
- Route to document detail by slug.

**Mobile planning notes**

- Support masonry/list toggle or card list with search/filter (future
  enhancement).

## 3.4 `/{locale}/tai-lieu-dien-tu/{slug}` (Document detail)

**Current features**

- Shows title, optional thumbnail, optional description.
- Supports two content modes:
    - Rich text content.
    - Embedded/previewed file content.

**Mobile planning notes**

- File handling strategy: native open-in viewer + cached offline metadata.

## 3.5 `/{locale}/lien-he` (Contact)

**Current features**

- Company contact info from config: address, email, hotline, working hours.
- Contact submission form.
- Map integration (`VietMap`).

**Mobile planning notes**

- Add one-tap actions: call hotline, open map app, compose email.

---

## 4) Authenticated user routes (mobile account app)

## 4.1 `/{locale}/dang-nhap` (User login)

**Current features**

- Email/phone + password login.
- Validation for required fields/password complexity.
- Optional post-login redirect (`redirect` query param).

## 4.2 `/{locale}/dang-ky` (User registration)

**Current features**

- Full name, email/phone (at least one required), password, confirm password.
- Validation with password policy.
- Redirect to login after successful signup.

## 4.3 `/{locale}/gio-hang` (Cart)

**Current features**

- Cart item list with checkboxes/select-all.
- Quantity updates and delete item flow.
- Tiered pricing calculation (effective price by quantity tiers).
- Search and quick-add products directly from cart page.

**Mobile planning notes**

- Split into blocks: “Selected items”, “Suggested add-ons”, “Order summary”.
- Keep sticky checkout summary/footer actions.

## 4.4 `/{locale}/trang-ca-nhan` (Profile)

**Current features**

- User card/avatar + membership year.
- Tabbed sections (lazy-loaded):
    - Personal info.
    - Change password.
    - Orders.

**Mobile planning notes**

- Map tabs to segmented control or top tabs with swipe gestures.

---

## 5) Admin web routes (for internal operations)

> These are likely **out of scope for customer mobile**, but useful if a
> staff/admin mobile module is planned.

## 5.1 `/{locale}/admin/login`

- Custom admin login UI.
- Role check ensures admin-only access.

## 5.2 `/{locale}/admin/config/accounts`

- Account list table.
- Debounced search by name/email/phone.

## 5.3 `/{locale}/admin/config/categories` and `.../categories/{id}`

- Category table with hierarchy navigation into children.
- Filters by search/status.
- Toggle active/inactive, edit, delete.

## 5.4 `/{locale}/admin/config/categories/form`

- Create/edit category.
- Parent category cascade selector.
- Image upload + SEO metadata fields.

## 5.5 `/{locale}/admin/config/products`

- Product table with SKU/price/stock/sold/tag/status/featured.
- Search and multi-filter (category/status/tag).
- Bulk selection + bulk delete.

## 5.6 `/{locale}/admin/config/products/form`

- Rich product authoring form:
    - Basic info (name/SKU/category/manufacturer/origin).
    - Pricing + stock + min order + low stock threshold.
    - Price tiers.
    - Specifications.
    - Rich description editor.
    - Gallery upload.
    - Dimensions/weight/datasheet URL.
    - SEO metadata.
    - Status, tags, featured toggle.
    - Related products.

## 5.7 `/{locale}/admin/config/documents`

- Document list with filters (search/type/content type).
- Create/edit/delete documents.
- Content mode selection (`text` editor vs `file` upload).
- Publish switch and file download action.

## 5.8 `/{locale}/admin/config/contact`

- Contact inquiry table.
- Search + per-row status update.
- Detail modal for full inquiry content.

## 5.9 `/{locale}/admin/config/settings`

- Global company configuration form:
    - Company/contact/social links.
    - Working hours.
    - Banner image management/upload.

---

## 6) API capability map for mobile integration

## 6.1 Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/change-password`

## 6.2 Public data

- `GET /api/(public)/config`
- `GET /api/(public)/categories`, `GET /api/(public)/categories/{slug}`
- `GET /api/(public)/products`, `GET /api/(public)/products/filters`,
  `GET /api/(public)/products/{slug}`
- `GET /api/(public)/products/{slug}/feedbacks`
- `GET /api/(public)/documents`, `GET /api/(public)/documents/{id}`

## 6.3 User private flows

- Profile: `GET/PUT /api/(private)/profile`
- Cart:
    - `GET/POST /api/(private)/cart`
    - `PATCH /api/(private)/cart/items/{id}`
    - `POST /api/(private)/cart/bulk-add`
    - `POST /api/(private)/cart/bulk-remove`
    - `POST /api/(private)/cart/sync`
    - `POST /api/(private)/cart/merge`
- Orders:
    - `GET/POST /api/(private)/orders`
    - `GET /api/(private)/orders/{id}`
    - `POST /api/(private)/orders/{id}/cancel`
    - `GET /api/(private)/orders/can-feedback`
- Feedbacks:
    - `GET/POST /api/(private)/feedbacks`
    - `PATCH/DELETE /api/(private)/feedbacks/{id}`
    - `POST /api/(private)/feedbacks/{id}/helpful`
- Contact request: `POST /api/(private)/contact-us`

## 6.4 Admin APIs

- Accounts: `GET /api/admin/accounts`
- Config: `GET/PUT /api/admin/config`
- Categories: `GET/POST /api/admin/categories`,
  `GET/PUT/DELETE /api/admin/categories/{id}`
- Products:
    - `GET/POST /api/admin/products`
    - `GET/PUT/DELETE /api/admin/products/{id}`
    - `POST /api/admin/products/bulk-delete`
    - `POST /api/admin/products/bulk-update-status`
- Documents: `GET/POST /api/admin/documents`,
  `GET/PUT/DELETE /api/admin/documents/{id}`
- Inquiries: `GET /api/admin/inquiries`, `PATCH /api/admin/inquiries/{id}`
- Uploads: `POST /api/admin/upload/image`, `POST /api/admin/upload/file`

---

## 7) Recommended mobile delivery phases

## Phase 1 (MVP customer)

- Home, Product listing/detail, Login/Register, Cart, Profile (info + orders),
  Contact, Document list/detail.
- Required backend groups: Auth, Public data, Cart, Orders, Profile, Contact-us.

## Phase 2 (engagement)

- Feedback workflows (create/edit/helpful).
- Advanced product filters and deep category browsing improvements.

## Phase 3 (optional internal mobile)

- Admin lite operations (inquiries + product status + quick stock edits).

---

## 8) Open decisions before mobile build

1. Will admin features be included in mobile at all, or remain web-only?
2. Should document files support offline access/download in app?
3. Checkout/payment flow is not clearly exposed as a dedicated page
   route—confirm target UX for mobile ordering completion.
4. Define push-notification triggers (order updates, inquiry replies, account
   alerts).
