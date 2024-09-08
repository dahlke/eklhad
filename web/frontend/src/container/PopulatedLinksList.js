// Import necessary dependencies
import moment from "moment";
import { connect } from "react-redux";

// Import the LinksList component
import LinksList from "../component/linksList/LinksList";

// Helper function to sort data by timestamp in descending order
function _sortByTimestamp(rawData) {
	const data = rawData || [];

	data.sort((a, b) => b.timestamp - a.timestamp);

	return data;
}

// Helper function to process and sort blog data
function _processBlogs(blogs) {
	// Add a formatted date to each blog entry
	blogs.map((blog) => {
		const processedBlog = blog;
		const d = moment.unix(processedBlog.timestamp).format("YYYY-MM-DD");
		processedBlog.date = d;

		return processedBlog;
	});

	// Sort the processed blogs by timestamp
	return _sortByTimestamp(blogs);
}

// Map Redux state to component props
const mapStateToProps = (state) => {
	const sortedLinks = _sortByTimestamp(state.links.items);
	const sortedBlogs = _processBlogs(state.blogs.items || []);

	return {
		links: sortedLinks,
		blogs: sortedBlogs,
	};
};

// Map Redux dispatch to component props (currently empty)
// const mapDispatchToProps = (dispatch) => ({});
const mapDispatchToProps = () => ({});

// Connect the LinksList component to Redux store
export default connect(mapStateToProps, mapDispatchToProps)(LinksList);
