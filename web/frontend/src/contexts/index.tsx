import React, { ReactNode } from 'react';
import { LocationsProvider } from './LocationsContext';
import { LinksProvider } from './LinksContext';
import { BlogsProvider } from './BlogsContext';
import { GravatarProvider } from './GravatarContext';
import { ActivityFilterProvider } from './ActivityFilterContext';
import { DateFilterProvider } from './DateFilterContext';

interface AppProvidersProps {
	children: ReactNode;
}

/**
 * Combined provider component that wraps all context providers
 * This ensures all contexts are available throughout the app
 */
export function AppProviders({ children }: AppProvidersProps) {
	return (
		<LocationsProvider>
			<LinksProvider>
				<BlogsProvider>
					<GravatarProvider>
						<ActivityFilterProvider>
							<DateFilterProvider>
								{children}
							</DateFilterProvider>
						</ActivityFilterProvider>
					</GravatarProvider>
				</BlogsProvider>
			</LinksProvider>
		</LocationsProvider>
	);
}

// Re-export all hooks for convenience
export { useLocations } from './LocationsContext';
export { useLinks } from './LinksContext';
export { useBlogs } from './BlogsContext';
export { useGravatar } from './GravatarContext';
export { useActivityFilter } from './ActivityFilterContext';
export { useDateFilter } from './DateFilterContext';

// Re-export Location type
export type { Location } from './LocationsContext';

