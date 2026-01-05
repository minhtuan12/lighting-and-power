import { ICategory } from "@/types/category";

export function convertNestedCategories(
    categories: ICategory[],
    labelKey = 'label',
    valueKey = 'value',
    childrenKey = 'children'
): Array<{ [key: string]: any }> {
    return categories.map(c => ({
        [labelKey]: c.name,
        [valueKey]: c._id,
        [childrenKey]: (c?.children ? convertNestedCategories(c.children, labelKey, valueKey, childrenKey) : []) as any
    }))
}

export function buildTree<T extends { _id: string; parentId?: string | null }>(
    items: T[]
): (T & { children?: T[] })[] {
    const map = new Map<string, T & { children: T[] }>();
    const roots: (T & { children: T[] })[] = [];

    // Khởi tạo map
    for (const item of items) {
        map.set(item._id, { ...item, children: [] });
    }

    // Gán cha - con
    for (const item of items) {
        const node = map.get(item._id)!;

        if (item.parentId && map.has(item.parentId)) {
            map.get(item.parentId)!.children.push(node);
        } else {
            roots.push(node);
        }
    }

    return roots;
}
