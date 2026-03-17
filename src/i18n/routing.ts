import { routes } from "@/constants/routes"
import { createNavigation } from "next-intl/navigation"
import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
    locales: ["en", "vi"],
    defaultLocale: "vi",
    pathnames: {
        "/": "/",
        [routes.sanPham.url]: {
            en: "/products",
            vi: "/san-pham",
        },
        [routes.lienHe.url]: {
            en: "/contact",
            vi: "/lien-he",
        },
        [routes.chiTietSanPham.url]: {
            en: "/products/detail",
            vi: "/san-pham/chi-tiet",
        },
        [routes.dangKy.url]: {
            en: "/register",
            vi: "/dang-ky",
        },
        [routes.dangNhap.url]: {
            en: "/login",
            vi: "/dang-nhap",
        },
        [routes.gioHang.url]: {
            en: "/cart",
            vi: "/gio-hang",
        },
        [routes.trangCaNhan.url]: {
            en: "/profile",
            vi: "/trang-ca-nhan",
        },
        [routes.booth.url]: {
            en: "/my-booth",
            vi: "/quan-ly-cua-hang",
        },
        [routes.boothCategory.url]: {
            en: "/my-booth/categories",
            vi: "/quan-ly-cua-hang/danh-muc",
        },
        [routes.boothProduct.url]: {
            en: "/my-booth/products",
            vi: "/quan-ly-cua-hang/san-pham",
        },
        [routes.taiLieuDienTu.url]: {
            en: "/documents",
            vi: "/tai-lieu-dien-tu",
        },
    },
})

export const { Link, redirect, usePathname, useRouter } =
    createNavigation(routing)
