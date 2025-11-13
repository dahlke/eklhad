import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ActivityFilters } from '../constants/activityFilters';

interface ActivityFilterState {
	filter: string;
}

interface ActivityFilterContextType extends ActivityFilterState {
	setActivityFilter: (value: string) => void;
}

const ActivityFilterContext = createContext<ActivityFilterContextType | undefined>(undefined);

const initialState: ActivityFilterState = {
	filter: ActivityFilters.SHOW_ALL,
};

interface ActivityFilterProviderProps {
	children: ReactNode;
}

export function ActivityFilterProvider({ children }: ActivityFilterProviderProps) {
	const [state, setState] = useState<ActivityFilterState>(initialState);

	const setActivityFilter = (value: string) => {
		setState({ filter: value });
	};

	const value: ActivityFilterContextType = {
		...state,
		setActivityFilter,
	};

	return (
		<ActivityFilterContext.Provider value={value}>
			{children}
		</ActivityFilterContext.Provider>
	);
}

export function useActivityFilter() {
	const context = useContext(ActivityFilterContext);
	if (context === undefined) {
		throw new Error('useActivityFilter must be used within an ActivityFilterProvider');
	}
	return context;
}

