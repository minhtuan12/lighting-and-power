import { fetchAPI } from "@/lib/api-client"
import { useQuery } from "@tanstack/react-query"

const PRODUCT_API_URL = "/products"
const CATEGORY_API_URL = "/categories"

// Query keys
const PRODUCT_KEYS = {
	all: ["client-products"] as const,
	lists: () => [...PRODUCT_KEYS.all, "list"] as const,
	list: (filters?: Record<string, any>) =>
		[...PRODUCT_KEYS.lists(), filters] as const,
	categories: ["client-categories-select"] as const,
}

// API functions
const productAPI = {
	getAll: (params?: Record<string, any>) => {
		const queryString = params
			? `?${new URLSearchParams(
				Object.entries(params).reduce(
					(acc, [key, value]) => {
						if (
							value !== undefined &&
							value !== null &&
							value !== ""
						) {
							acc[key] = Array.isArray(value)
								? value.join(",")
								: String(value)
						}
						return acc
					},
					{} as Record<string, string>,
				),
			).toString()}`
			: ""
		return fetchAPI(`${PRODUCT_API_URL}${queryString}`)
	},

	getCategories: () => {
		return fetchAPI(`${CATEGORY_API_URL}?view=tree`)
	},
}

// Custom hook
export function useClientProducts(params?: Record<string, any>, enabled?: boolean) {
	// GET all products
	const {
		data: products,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: PRODUCT_KEYS.list(params),
		queryFn: () => productAPI.getAll(params),
		enabled: enabled ?? true,
		staleTime: 1000 * 60 * 5,
	})

	// GET categories for select
	const getCategoriesSelect = () => {
		const { data: categoriesData, isLoading: isLoadingCategories } =
			useQuery({
				queryKey: PRODUCT_KEYS.categories,
				queryFn: async () => {
					const result = await productAPI.getCategories()

					// Transform tree to flat options
					const flattenCategories = (cats: any[]): any[] => {
						return cats.flatMap((cat) => [
							{ value: cat._id, label: cat.name },
							...(cat.children
								? flattenCategories(cat.children)
								: []),
						])
					}

					return {
						...result,
						data: flattenCategories(result.data || []),
					}
				},
				staleTime: 1000 * 60 * 10,
			})

		return { data: categoriesData, isLoading: isLoadingCategories }
	}

	return {
		// Data
		products,
		isLoading,
		error,

		// Methods
		refetch,
		getCategoriesSelect,
	}
}
