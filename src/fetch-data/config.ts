import { IConfig } from "@/types/config";

interface IConfigResponse {
    success: boolean;
    data: IConfig;
}

export async function getConfig(): Promise<IConfigResponse> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL!}/api/config`, {
            next: {
                revalidate: 3600 * 12, // Cache for 12 hour
                tags: ['config']
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch footer data');
        }

        return res.json();
    } catch (error) {
        console.error('Error fetching config:', error);

        // Fallback data
        return {
            success: false,
            data: {
                companyName: 'TIỆM ĐIỆN TỬ L&P',
                address: '2/4A Tổ 10, KP.Bình Thuận, P.Lái Thiêu, TP.Thuận An, Bình Dương',
                email: 'thanhphuysvccd2@gmail.com',
                hotline: '0853 887 855',
                social: {},
                banners: ['/images/banner.png']
            }
        };
    }
}
