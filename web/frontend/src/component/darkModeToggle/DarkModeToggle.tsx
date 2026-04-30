import React from 'react';
import { useDarkMode } from '../../contexts';

export function DarkModeToggle() {
	const { isDarkMode, toggleDarkMode } = useDarkMode();

	return (
		<button
			onClick={toggleDarkMode}
			className="fixed bottom-5 left-5 z-50 p-2 text-chicago-flag-blue/60 dark:text-slate-500 hover:text-chicago-flag-blue dark:hover:text-slate-300 transition-colors duration-150 focus:outline-none"
			aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
			title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				className="h-5 w-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={1.5}
			>
				{isDarkMode ? (
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
					/>
				) : (
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
