import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DateFilterState {
	date: string | null;
}

interface DateFilterContextType extends DateFilterState {
	setDateFilter: (date: string | null) => void;
}

const DateFilterContext = createContext<DateFilterContextType | undefined>(undefined);

const initialState: DateFilterState = {
	date: null,
};

interface DateFilterProviderProps {
	children: ReactNode;
}

export function DateFilterProvider({ children }: DateFilterProviderProps) {
	const [state, setState] = useState<DateFilterState>(initialState);

	const setDateFilter = (date: string | null) => {
		setState({ date });
	};

	const value: DateFilterContextType = {
		...state,
		setDateFilter,
	};

	return (
		<DateFilterContext.Provider value={value}>
			{children}
		</DateFilterContext.Provider>
	);
}

export function useDateFilter() {
	const context = useContext(DateFilterContext);
	if (context === undefined) {
		throw new Error('useDateFilter must be used within a DateFilterProvider');
	}
	return context;
}

