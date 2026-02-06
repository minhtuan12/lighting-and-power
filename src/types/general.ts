export interface SearchParams {
    [key: string]: string | string[] | undefined
}

export interface SlugPageProps {
    params: Promise<{ slug: string[] }>
    searchParams: Promise<SearchParams>
}
