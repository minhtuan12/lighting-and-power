export interface ICategory {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    parentId?: string | null;
    children?: ICategory[];
    childrenCount?: number;
    level: number; // 0 = parent, 1 = child, 2 = grandchild, etc.
    isActive: boolean;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IFilter {
    isActive: boolean | undefined;
    search: string;
}
