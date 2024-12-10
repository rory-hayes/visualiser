export function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col justify-center py-12 bg-gray-50 dark:bg-gray-900">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                    Notion Graph
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
                {children}
            </div>

            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                <a href="/" className="hover:text-gray-900 dark:hover:text-white">
                    Back to home
                </a>
            </div>
        </div>
    );
} 