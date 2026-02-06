import Loading from "@/components/Loading"
import { getProductFilters } from "@/fetch-data/products"
import { parseSearchParams } from "@/lib/utils"
import { SearchParams } from "@/types/general"
import { Suspense } from "react"
import FiltersClient from "./FiltersClient"

export default async function Filters({ searchParams }: SearchParams) {
    const { data: filterOptions } = await getProductFilters()
    const appliedFilters = parseSearchParams(searchParams as any)

    return (
        <Suspense fallback={<Loading />}>
            <FiltersClient
                filterOptions={filterOptions}
                currentFilters={appliedFilters}
            />
        </Suspense>
    )
}
