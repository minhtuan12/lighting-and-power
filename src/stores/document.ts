import { atom } from "jotai"

// Document filter atom
export const filterDocumentAtom = atom({
    page: 1,
    search: undefined as string | undefined,
    contentType: undefined as string | undefined,
    type: undefined as string | undefined,
})

export const selectedDocumentAtom = atom<{
    categorySlug: string
    sectionSlug: string
} | null>(null)
