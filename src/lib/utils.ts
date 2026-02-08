import { getCategoryBySlug } from '@/fetch-data/categories'
import { getProductDetail } from '@/fetch-data/products'
import { ICategory } from '@/types/category'
import { SearchParams } from '@/types/general'
import { IProductFilterParams } from '@/types/product'
import { cache } from 'react'

export function convertNestedCategories(
	categories: ICategory[],
	labelKey = 'label',
	valueKey = 'value',
	childrenKey = 'children',
): Array<{ [key: string]: any }> {
	return categories.map((c) => ({
		[labelKey]: c.name,
		[valueKey]: c._id,
		[childrenKey]: (c?.children
			? convertNestedCategories(
				c.children,
				labelKey,
				valueKey,
				childrenKey,
			)
			: []) as any,
	}))
}

export function buildTree<
	T extends {
		_id: string
		parentId?: string | null
	},
>(items: T[]): (T & { children?: T[] })[] {
	const map = new Map<
		string,
		T & { children: T[] }
	>()
	const roots: (T & { children: T[] })[] = []

	// Khởi tạo map
	for (const item of items) {
		map.set(item._id, {
			...item,
			children: [],
		})
	}

	// Gán cha - con
	for (const item of items) {
		const node = map.get(item._id)!

		if (
			item.parentId &&
			map.has(item.parentId)
		) {
			map.get(item.parentId)!.children.push(
				node,
			)
		} else {
			roots.push(node)
		}
	}

	return roots
}

export interface CategoryChainResult {
	categories: Partial<ICategory>[]
	lastSlug: string
	isLastChild: boolean
	isProductDetail: boolean
}

export const getCategoryChain = cache(
	async (
		slugs: string[],
	): Promise<CategoryChainResult> => {
		let categories = []
		let isLastChild = false
		let isProductDetail = false

		if (
			slugs &&
			!slugs.includes('chi-tiet') &&
			!slugs.includes('detail')
		) {
			for (const slug of slugs) {
				const { data: ctg } =
					await getCategoryBySlug(slug)

				if (ctg) {
					categories.push({
						_id: ctg._id,
						name: ctg.name,
						slug: ctg.slug,
						childrenCount:
							ctg.childrenCount,
					})
					isLastChild =
						ctg.childrenCount === 0
				}
			}
		} else {
			const { data } =
				await getProductDetail({
					slug: slugs[slugs.length - 1],
				})
			categories = data.categoryBreadcrumb
			isLastChild = isProductDetail = true
		}

		return {
			categories,
			lastSlug: slugs[slugs.length - 1],
			isLastChild,
			isProductDetail,
		}
	},
)

export function hasValidData(
	value: any,
): boolean {
	// null / undefined
	if (value == null) return false

	// number
	if (typeof value === 'number') {
		return value !== 0
	}

	// string
	if (typeof value === 'string') {
		return value.trim().length > 0
	}

	// array
	if (Array.isArray(value)) {
		if (value.length === 0) return false
		return value.some((item) =>
			hasValidData(item),
		)
	}

	// object
	if (typeof value === 'object') {
		return Object.values(value).some((v) =>
			hasValidData(v),
		)
	}

	return false
}

// Helper function để parse searchParams thành filter object
export function parseSearchParams(
	searchParams: SearchParams,
): IProductFilterParams {
	const filters: Partial<IProductFilterParams> =
	{
		page: searchParams.page
			? Number(searchParams.page)
			: 1,
	}

	// Manufacturers
	if (searchParams.manufacturers) {
		filters.manufacturers = (
			searchParams.manufacturers as string
		).split(',')
	}

	// Origins
	if (searchParams.origins) {
		filters.origins = (
			searchParams.origins as string
		).split(',')
	}

	// Units
	if (searchParams.units) {
		filters.units = (
			searchParams.units as string
		).split(',')
	}

	// Tags
	if (searchParams.tags) {
		filters.tags = (
			searchParams.tags as string
		).split(',') as any
	}

	// Price range
	if (searchParams.priceMin) {
		filters.priceMin = Number(
			searchParams.priceMin,
		)
	}
	if (searchParams.priceMax) {
		filters.priceMax = Number(
			searchParams.priceMax,
		)
	}

	// Weight range
	if (searchParams.weightMin) {
		filters.weightMin = Number(
			searchParams.weightMin,
		)
	}
	if (searchParams.weightMax) {
		filters.weightMax = Number(
			searchParams.weightMax,
		)
	}

	// Dimension ranges
	if (searchParams.lengthMin)
		filters.lengthMin = Number(
			searchParams.lengthMin,
		)
	if (searchParams.lengthMax)
		filters.lengthMax = Number(
			searchParams.lengthMax,
		)
	if (searchParams.widthMin)
		filters.widthMin = Number(
			searchParams.widthMin,
		)
	if (searchParams.widthMax)
		filters.widthMax = Number(
			searchParams.widthMax,
		)
	if (searchParams.heightMin)
		filters.heightMin = Number(
			searchParams.heightMin,
		)
	if (searchParams.heightMax)
		filters.heightMax = Number(
			searchParams.heightMax,
		)

	// Specifications - format: spec_Điện%20trở=10K,100K
	const specifications: Record<
		string,
		string[]
	> = {}
	Object.entries(searchParams).forEach(
		([key, value]) => {
			if (
				key.startsWith('spec_') &&
				value
			) {
				const specName =
					decodeURIComponent(
						key.replace('spec_', ''),
					)
				specifications[specName] = (
					value as string
				).split(',')
			}
		},
	)
	if (Object.keys(specifications).length > 0) {
		filters.specifications = specifications
	}

	// Search
	if (searchParams.search) {
		filters.search =
			searchParams.search as string
	}

	// Sorting
	if (searchParams.sortBy) {
		filters.sortBy =
			searchParams.sortBy as any
	}
	if (searchParams.sortOrder) {
		filters.sortOrder =
			searchParams.sortOrder as any
	}

	return filters
}

export function capitalizeFirstLetterEachWord(
	str: string,
) {
	if (!str) return ''
	const words = str.split(' ')
	const newWord = []
	for (const word of words) {
		newWord.push(
			word[0].toUpperCase() +
			word.slice(1).toLowerCase(),
		)
	}
	return newWord.join(' ')
}

export function getParentCategoriesChain(
	categories: ICategory[],
	lastId: string,
) {
	const result: string[] = []
	let currentId: string | null = lastId

	// Tạo map để tra cứu nhanh category theo id
	const categoryMap = new Map<
		string,
		ICategory
	>()
	categories.forEach((cat) => {
		categoryMap.set(cat._id, cat)
	})

	// Đi từ lastId lên đến root (parentId = null)
	while (currentId) {
		const category =
			categoryMap.get(currentId)

		if (!category) break

		result.unshift(currentId)
		currentId = category.parentId ?? null
	}

	return result
}

export async function getDocumentTypes() {
	try {
		const res = await fetch(
			`${process.env.NEXT_PUBLIC_CLOUDINARY_RAW_URL!}/document-types_xssill.json`,
			{ cache: 'force-cache' },
		)
		return await res.json()
	} catch (e) {
		console.log('Error get document types', e)
		return []
	}
}

export const getProvinces = cache(
	async (provinceCode?: number, depth = 1) => {
		try {
			let url =
				process.env
					.NEXT_PUBLIC_VIETNAM_PROVINCES_API!
			url += provinceCode
				? `/p/${provinceCode}`
				: ''
			const res = await fetch(
				`${url}?depth=${depth}`,
				{
					next: {
						revalidate:
							3600 * 24 * 30,
					},
				},
			)
			return await res.json()
		} catch (e) {
			console.log('Error get provinces', e)
			return null
		}
	},
)

export const safeLocalStorage = {
	getItem: (key: string): string | null => {
		if (typeof window === 'undefined')
			return null
		return localStorage.getItem(key)
	},
	setItem: (
		key: string,
		value: string,
	): void => {
		if (typeof window === 'undefined') return
		localStorage.setItem(key, value)
	},
	removeItem: (key: string): void => {
		if (typeof window === 'undefined') return
		localStorage.removeItem(key)
	},
}

export function getLocale() {
	return (
		safeLocalStorage.getItem('locale') || 'vi'
	)
}

export const priceRates = {
	VND: {
		rate: 1,
		locale: 'vi-VN',
	},
	USD: {
		rate: 0.000039,
		locale: 'en-US',
	},
}

export function formatPrice(
	price: number,
	currency: string,
) {
	const priceRate =
		priceRates[
		currency as keyof typeof priceRates
		]

	return new Intl.NumberFormat(
		priceRate.locale,
		{
			style: 'currency',
			currency: currency,
		},
	).format(price / priceRate.rate)
}
