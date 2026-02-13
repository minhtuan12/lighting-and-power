export default async function DocumentDetail({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return <div></div>
}