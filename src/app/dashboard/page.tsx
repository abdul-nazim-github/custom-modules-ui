import { LogoutButton } from '@/components/logout-button';
import { cookies } from 'next/headers';
import { DashboardTabs } from '@/components/dashboard-tabs';

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const userName = cookieStore.get('userName')?.value || 'User';
    const userEmail = cookieStore.get('userEmail')?.value || 'user@example.com';
    const permissionsRaw = cookieStore.get('userPermissions')?.value;
    const permissions = permissionsRaw ? JSON.parse(permissionsRaw) : [];
    const role = cookieStore.get('userRole')?.value || 'user';

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                                    Dashboard
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-sm font-semibold text-gray-900">{userName}</span>
                                <span className="text-xs text-gray-500">{userEmail}</span>
                            </div>
                            <LogoutButton />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userName}!</h1>
                    <p className="text-gray-500 mt-2">Here&apos;s what&apos;s happening with your account today.</p>
                </div>

                <DashboardTabs userName={userName} userEmail={userEmail} permissions={permissions} role={role} />
            </main>
        </div>
    );
}
