import { parse } from 'tldts'

export function getCookieDomain(hostname: string): string | undefined {
	const host = hostname.split(':')[0]
	if (host === 'localhost' || host.endsWith('.localhost') || host === '127.0.0.1') {
		return undefined // dev: host-only cookie
	}
	const { domain } = parse(host) // domain.com, domain.com.vn... đều xử lý đúng
	return domain ? `.${domain}` : undefined
}
