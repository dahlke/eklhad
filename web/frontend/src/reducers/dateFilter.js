const DateFilter = (state = null, action) => {
	const date = action && action.filter && action.filter.date
			? action.filter.date
			: null;

	switch (action.type) {
		case "SET_DATE_FILTER":
			return date;
		default:
			return state;
	}
};

export default DateFilter;
