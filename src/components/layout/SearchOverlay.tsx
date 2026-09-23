'use client'

import { routes } from '@/constants/routes'
import { useRouter } from '@/i18n/routing'
import { Tag } from 'antd'
import { Search } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'

type Suggestion = {
	kind: 'product' | 'document'
	id?: string
	title: string
	slug?: string
}

export default function SearchOverlay() {
	const [searchOpen, setSearchOpen] = useState(false)
	const [query, setQuery] = useState('')
	const router = useRouter()
	const [suggestions, setSuggestions] = useState<Suggestion[]>([])
	const [loadingSuggestions, setLoadingSuggestions] = useState(false)

	useEffect(() => {
		const value = query.trim()
		if (!searchOpen || value.length < 2) {
			setSuggestions([])
			return
		}
		const controller = new AbortController()
		const timer = window.setTimeout(async () => {
			setLoadingSuggestions(true)
			try {
				const response = await fetch(
					`/api/search-suggestions?q=${encodeURIComponent(value)}`,
					{ signal: controller.signal },
				)
				const json = await response.json()
				setSuggestions(json.data || [])
			} catch (error: any) {
				if (error?.name !== 'AbortError') setSuggestions([])
			} finally {
				if (!controller.signal.aborted) setLoadingSuggestions(false)
			}
		}, 600)
		return () => {
			window.clearTimeout(timer)
			controller.abort()
		}
	}, [query, searchOpen])

	useEffect(() => {
		if (!searchOpen) return
		const onKeyDown = (event: KeyboardEvent) =>
			event.key === 'Escape' && setSearchOpen(false)
		document.addEventListener('keydown', onKeyDown)
		return () => document.removeEventListener('keydown', onKeyDown)
	}, [searchOpen])

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault()
		const value = query.trim()
		if (!value) return
		setSearchOpen(false)
		router.push(`${routes.timKiem.url}?q=${encodeURIComponent(value)}`)
	}

	return (
		<>
			<button
				type="button"
				className="
			flex items-center gap-2.5 w-2/3
			rounded-full border bg-white
			px-4 py-[6px]
			text-sm text-[#73838a]
			cursor-pointer
			shadow-[0_7px_22px_#0926380d]
			border-[#dce6e9]
			hover:border-[#218eae] hover:text-[#218eae]
			transition-colors
		"
				onClick={() => setSearchOpen(true)}
			>
				<Search size={16} />
				<span>Tìm kiếm ...</span>
			</button>
			{searchOpen && (
				<div
					className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 px-5"
					onMouseDown={(e) =>
						e.target === e.currentTarget && setSearchOpen(false)
					}
				>
					<form
						onSubmit={handleSubmit}
						className="w-full max-w-2xl"
					>
						<label
							htmlFor="global-search"
							className="sr-only"
						>
							Search
						</label>
						<div className="flex items-center gap-3 rounded-full bg-white px-6 py-4 shadow-2xl">
							<Search
								size={22}
								className="text-[#73838a]"
							/>
							<input
								id="global-search"
								autoFocus
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Tìm kiếm ..."
								className="w-full bg-transparent text-lg outline-none text-gray-700"
							/>
						</div>
						{(loadingSuggestions || suggestions.length > 0) && (
							<div className="mt-2 overflow-hidden rounded-2xl bg-white shadow-2xl">
								{loadingSuggestions ? (
									<div className="px-6 py-4 text-sm text-gray-500">
										Đang tìm...
									</div>
								) : (
									suggestions.map((item) => (
										<button
											key={`${item.kind}-${item.id}`}
											type="button"
											className="flex w-full items-center justify-between px-6 py-3 text-left hover:bg-gray-50 cursor-pointer"
											onClick={() => {
												setSearchOpen(false)
												router.push(
													`${routes.timKiem.url}?q=${encodeURIComponent(item.title)}`,
												)
											}}
										>
											<span className="truncate text-gray-700">
												{item.title}
											</span>
											<Tag
												color={
													item.kind === 'document'
														? 'cyan'
														: 'gold'
												}
												variant="outlined"
												className="min-w-[85px] !text-center uppercase !shrink-0"
											>
												{item.kind === 'product'
													? 'Sản phẩm'
													: 'Tài liệu'}
											</Tag>
										</button>
									))
								)}
							</div>
						)}
					</form>
				</div>
			)}
		</>
	)
}
