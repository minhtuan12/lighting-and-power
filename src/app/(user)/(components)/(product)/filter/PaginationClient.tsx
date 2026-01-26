'use client'

import { Pagination, PaginationProps } from "antd";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function PaginationClient({ ...rest }: PaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    function handleChangePage(page: number) {
        const params = new URLSearchParams(searchParams.toString());

        if (page === 1) {
            params.delete('page');
        } else {
            // Set hoặc update page param
            params.set('page', page.toString());
        }

        // Tạo URL mới với params
        const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;

        router.push(newUrl);
    }

    return <Pagination
        {...rest}
        className="custom-pagination"
        onChange={handleChangePage}
    />
}