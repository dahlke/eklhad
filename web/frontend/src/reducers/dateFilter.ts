interface DateFilterState {
    date: string | null;
}

interface DateFilterAction {
    type: string;
    filter?: {
        date: string;
    };
}

const DateFilter = (state: DateFilterState = { date: null }, action: DateFilterAction): DateFilterState => {
	const date = action.filter?.date || null;

	switch (action.type) {
		case "SET_DATE_FILTER":
			return { date };
		default:
			return state;
	}
};

export default DateFilter;
