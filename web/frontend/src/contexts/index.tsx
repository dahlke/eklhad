import React, { ReactNode } from 'react';
import { LocationsProvider } from './LocationsContext';
import { LinksProvider } from './LinksContext';
import { BlogsProvider } from './BlogsContext';
import { GravatarProvider } from './GravatarContext';
import { DarkModeProvider } from './DarkModeContext';

interface AppProvidersProps {
	children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
	return (
		<DarkModeProvider>
			<LocationsProvider>
				<LinksProvider>
					<BlogsProvider>
						<GravatarProvider>
							{children}
						</GravatarProvider>
					</BlogsProvider>
				</LinksProvider>
			</LocationsProvider>
		</DarkModeProvider>
	);
}

export { useLocations } from './LocationsContext';
export { useLinks } from './LinksContext';
export { useBlogs } from './BlogsContext';
export { useGravatar } from './GravatarContext';
export { useDarkMode } from './DarkModeContext';

export type { Location } from './LocationsContext';
