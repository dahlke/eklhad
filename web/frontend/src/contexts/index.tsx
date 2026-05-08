import React, { ReactNode } from 'react';
import { AppDataProvider, useAppData } from './AppDataContext';
import { DarkModeProvider } from './DarkModeContext';

export { useDarkMode } from './DarkModeContext';
export type { Location } from '../types';

interface AppProvidersProps {
	children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
	return (
		<DarkModeProvider>
			<AppDataProvider>
				{children}
			</AppDataProvider>
		</DarkModeProvider>
	);
}

export function useLocations() {
	const { locations, isFetching } = useAppData();
	return { items: locations, isFetching };
}

export function useBlogs() {
	const { blogs, isFetching } = useAppData();
	return { items: blogs, isFetching };
}

export function useLinks() {
	const { links, isFetching } = useAppData();
	return { items: links, isFetching };
}

export function useGravatar() {
	const { gravatarUrl, isFetching } = useAppData();
	return { url: gravatarUrl, isFetching };
}
