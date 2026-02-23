'use client'

import DocViewer, { DocViewerRenderers } from "react-doc-viewer";

export default function FileViewer({ documents }: { documents: { uri: string }[] }) {
    return <DocViewer documents={documents} pluginRenderers={DocViewerRenderers} className="h-[800px]" />
}
