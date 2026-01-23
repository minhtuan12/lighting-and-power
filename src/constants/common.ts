export const PAGE_LIMIT = 20;

// Product
export const PRODUCT_TAG_OPTIONS = [
    { value: 'new', label: 'Mới' },
    { value: 'best_seller', label: 'Bán chạy' },
];

export const PRODUCT_STATUS_OPTIONS = [
    { value: 'draft', label: 'Nháp' },
    { value: 'active', label: 'Hiện' },
    { value: 'out_of_stock', label: 'Hết hàng' },
    { value: 'discontinued', label: 'Ngừng sản xuất' },
];

// Document
export const DOCUMENT_TYPES = [
    { value: 'introduction', label: 'Giới thiệu sản phẩm', icon: '📄', color: 'magenta' },
    { value: 'knowledge', label: 'Kiến thức sản phẩm', icon: '📚', color: 'volcano' },
    { value: 'guide', label: 'Hướng dẫn sử dụng', icon: '📖', color: 'cyan' },
    { value: 'manual', label: 'Hướng dẫn lắp ráp', icon: '🔧', color: 'geekblue' },
    { value: 'other', label: 'Khác', icon: '📋', color: 'purple' },
];

export const CONTENT_TYPES = [
    { value: 'text', label: 'Viết tay' },
    { value: 'file', label: 'Upload file' },
];

export const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
