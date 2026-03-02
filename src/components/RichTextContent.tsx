'use client'

import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useEffect, useRef } from 'react'

interface Props {
    html: string
    className?: string
}

export default function RichTextContent({ html, className }: Props) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!ref.current) return

        // Find all span[data-latex] elements and replace with KaTeX rendered HTML
        const latexSpans =
            ref.current.querySelectorAll<HTMLElement>('span[data-latex]')

        latexSpans.forEach((span) => {
            const latex = span.getAttribute('data-latex') ?? ''
            const displayMode = span.getAttribute('data-display') === 'yes'

            try {
                const rendered = katex.renderToString(latex, {
                    throwOnError: false,
                    displayMode,
                })
                span.innerHTML = rendered
                // Remove the raw $ ... $ text nodes if any
                span.removeAttribute('data-latex')
            } catch (e) {
                // Leave as-is if KaTeX fails
            }
        })
    }, [html])

    return (
        <div
            ref={ref}
            className={className}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    )
}
