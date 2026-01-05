export const themeToken = {
    // Primary Colors
    colorPrimary: '#000F8F',      // Main brand color
    colorSuccess: '#52c41a',      // Success states
    colorWarning: '#faad14',      // Warning states
    colorError: '#ff4d4f',        // Error states
    colorInfo: '#1677ff',         // Info states

    // Text Colors
    colorText: '#000000d9',       // Main text
    colorTextSecondary: '#00000073', // Secondary text
    colorTextDisabled: '#00000040',  // Disabled text

    // Background Colors
    colorBgBase: '#ffffff',       // Base background
    colorBgContainer: '#ffffff',  // Container background
    colorBgLayout: '#f5f5f5',     // Layout background

    // Border
    colorBorder: '#d9d9d9',
    borderRadius: 6,              // Global border radius

    // Typography
    fontSize: 14,                 // Base font size
    fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

    // Spacing
    controlHeight: 32,            // Default control height

    // Link
    colorLink: '#000F8F',
    colorLinkHover: '#69b1ff',
    colorLinkActive: '#0958d9',

    // Shadows
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
}

export const themeComponents = {
    // Button
    Button: {
        controlHeight: 36,
        controlHeightLG: 40,
        controlHeightSM: 28,
        borderRadius: 6,
        fontWeight: 500,
    },

    // Input
    Input: {
        controlHeight: 36,
        borderRadius: 6,
        paddingBlock: 8,
        paddingInline: 12,
        colorPrimaryHover: '#000F8F',
    },

    // Select
    Select: {
        controlHeight: 36,
        borderRadius: 6,
    },

    // Card
    Card: {
        borderRadius: 8,
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)',
    },

    // Table
    Table: {
        borderRadius: 8,
        headerBg: '#fafafa',
        headerColor: '#000000d9',
        rowHoverBg: '#fafafa',
    },

    // Modal
    Modal: {
        borderRadius: 8,
    },

    // Menu
    Menu: {
        itemBorderRadius: 6,
        itemMarginInline: 4,
    },

    // Tag
    Tag: {
        borderRadius: 4,
    },
}