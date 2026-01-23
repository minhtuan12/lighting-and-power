import { IDocument } from "@/types/document";

interface IDcoumentResponse {
    success: boolean;
    data: {
        documents: IDocument[];
        totalPages: number;
        total: number;
        page: number;
    };
}

export async function getDocuments(): Promise<IDcoumentResponse> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents`, {
            next: {
                revalidate: 3600 * 1 // Cache for 3 hour
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch documents');
        }

        return res.json();
    } catch (error) {
        console.error('Error fetching documents:', error);

        // Fallback data
        return {
            success: false,
            data: {
                page: 1,
                documents: [],
                total: 0,
                totalPages: 0,
            },
        };
    }
}
