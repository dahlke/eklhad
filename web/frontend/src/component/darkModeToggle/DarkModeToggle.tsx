import React from 'react';
import { useDarkMode } from '../../contexts';

export function DarkModeToggle() {
	const { isDarkMode, toggleDarkMode } = useDarkMode();

	return (
		<button
			onClick={toggleDarkMode}
			className="fixed bottom-4 left-4 z-50 p-3 rounded-full bg-chicago-flag-blue dark:bg-gray-800 text-white dark:text-chicago-flag-blue shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-chicago-flag-blue focus:ring-offset-2 dark:focus:ring-offset-gray-900"
			aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
			title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
		>
			{/* Moon icon for dark mode */}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				className="h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={2}
			>
				{isDarkMode ? (
					// Sun icon when in dark mode (to switch to light)
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
					/>
				) : (
					// Moon icon when in light mode (to switch to dark)
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
					/>
				)}
			</svg>
		</button>
	);
}

