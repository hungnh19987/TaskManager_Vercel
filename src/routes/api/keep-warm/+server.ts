import { json } from '@sveltejs/kit';

export function GET() {
    return json({ status: 'warmed', timestamp: Date.now() }, {
        headers: {
            // Không cho phép lưu cache để đảm bảo Vercel luôn phải chạy hàm Serverless này
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        }
    });
}
