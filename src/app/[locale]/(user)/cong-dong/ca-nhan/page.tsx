import { redirect } from 'next/navigation'

export default async function LegacyCommunityPostsRoute({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    redirect(`/${locale}/trang-ca-nhan/cong-dong`)
}
