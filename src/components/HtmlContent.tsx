export default function HtmlContent({ content }: { content: string }) {
    return <div dangerouslySetInnerHTML={{ __html: (content ?? '') as string }} className="prose text-[17px]" />
}
