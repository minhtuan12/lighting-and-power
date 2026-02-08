export interface SearchParams {
    [key: string]: string | string[] | undefined
}

export interface SlugPageProps {
    params: Promise<{ slug: string[] }>
    searchParams: Promise<SearchParams>
}

export interface Ward {
    code: number
    codename: string
    division_type: string
    name: string
    province_code: number
}

export interface Province extends Ward {
    wards: Ward[]
}
