import DefaultImage from "@/components/DefaultImage";
import FileViewer from "@/components/FileViewer";
import HtmlContent from "@/components/HtmlContent";
import Loading from "@/components/Loading";
import { getDocumentDetail } from "@/fetch-data/documents";
import { Flex } from "antd";
import { Suspense } from "react";

export default async function DocumentDetail({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { data: doc } = await getDocumentDetail(slug);

    if (!doc) {
        return null;
    }

    return <Suspense fallback={<Loading />}>
        <Flex gap={20} vertical className="!mt-5 !mb-20">
            <h3 className="font-semibold text-xl text-center mb-3">{doc.title.toUpperCase()}</h3>
            {doc.thumbnail && <DefaultImage src={doc.thumbnail} className="w-full h-[400px]" title={doc.title} />}
            {doc.description && <div className="text-[17px] text-align">{doc.description}</div>}
            {doc.content && doc.contentType === "text" && <HtmlContent content={doc.content} />}
            {doc.fileUrl && doc.contentType === "file" && <FileViewer documents={[{ uri: doc.fileUrl }]} />}
        </Flex>
    </Suspense>
}
