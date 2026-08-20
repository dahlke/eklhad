import React from 'react';
import { useDarkMode } from '../../contexts';

export function DarkModeToggle() {
	const { isDarkMode, toggleDarkMode } = useDarkMode();

	return (
		<button
			onClick={toggleDarkMode}
			className="fixed top-5 right-5 md:right-auto md:left-5 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full border border-chicago-flag-blue/30 dark:border-slate-600 text-chicago-flag-blue dark:text-slate-400 hover:border-chicago-flag-blue dark:hover:border-slate-400 hover:text-chicago-flag-blue dark:hover:text-slate-200 transition-all duration-150 focus:outline-none bg-white/50 dark:bg-dark-bg/50 backdrop-blur-sm"
			aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
			title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				className="h-4 w-4"
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
			<span className="text-xs font-medium tracking-wide">
				{isDarkMode ? 'Light' : 'Dark'}
			</span>
		</button>
	);
}
