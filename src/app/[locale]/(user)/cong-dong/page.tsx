import QueryProvider from '../../(providers)/query-provider'
import CommunityFeed from './CommunityFeed'
export default function CommunityPage() {
	return (
		<QueryProvider>
			<CommunityFeed />
		</QueryProvider>
	)
}
