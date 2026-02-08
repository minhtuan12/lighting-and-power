import { fetchAPI } from "@/lib/api-client"
import { useCallback, useState } from "react"
import { showMessage } from "./use-message"

export default function useUpload() {
    const [isUploadingImage, setIsUploadingImage] = useState(false)

    const uploadImagesToCloudinary = useCallback(
        async (file: File): Promise<string> => {
            showMessage.loading("Đang tải ảnh lên...")
            setIsUploadingImage(true)
            try {
                const formData = new FormData()
                formData.append("file", file)
                formData.append("folder", "lightingpower")

                const data = await fetchAPI("/admin/upload/image", {
                    method: "POST",
                    body: formData,
                })
                return data.secure_url
            } catch (error: any) {
                console.error("Image upload error:", error)
                throw new Error(error.message || "Failed to upload images")
            } finally {
                setIsUploadingImage(false)
            }
        },
        [],
    )

    return {
        isUploadingImage,
        uploadImagesToCloudinary,
    }
}
