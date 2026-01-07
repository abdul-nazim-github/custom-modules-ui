import { cookies } from 'next/headers';

export default async function DashboardPage() {
    // We can access cookies here if needed, but middleware already protects this route.
    // const cookieStore = await cookies();
    // const token = cookieStore.get('auth_token');

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold text-gray-800">Dashboard</span>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="text-gray-500 text-sm">Welcome, User</span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
                        <h1 className="text-2xl text-gray-400">Protected Content Area</h1>
                    </div>
                </div>
            </main>
        </div>
    );
}
