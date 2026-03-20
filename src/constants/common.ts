export const PAGE_LIMIT = 20

// Product
export const PRODUCT_TAG_OPTIONS = [
    { value: "new", label: "Mới" },
    { value: "best_seller", label: "Bán chạy" },
]

export const PRODUCT_STATUS_OPTIONS = [
    { value: "draft", label: "Nháp" },
    { value: "active", label: "Hiện" },
    { value: "out_of_stock", label: "Hết hàng" },
    { value: "discontinued", label: "Ngừng sản xuất" },
]

export const CONTENT_TYPES = [
    { value: "text", label: "Viết tay" },
    { value: "file", label: "Upload file" },
]

export const ALLOWED_FILE_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
]

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const CHECKOUT_FLOW_KEY = "lp_checkout_flow"
export const CHECKOUT_FLOW_TTL_MS = 15 * 60 * 1000
