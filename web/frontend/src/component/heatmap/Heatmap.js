import React, { Component } from "react";
import Select from "react-select";
import { ActivityFilters } from "../../actions";
import CalendarHeatmap from "react-calendar-heatmap";
import DateDetailList from "../../component/dateDetailList/DateDetailList";
import moment from "moment";
import Modal from "react-modal";
import "./Heatmap.scss";

Modal.setAppElement(document.getElementById("root"));

class Heatmap extends Component {
	constructor() {
		super();
		this.state = {
			showModal: false,
		};

		this.handleCloseModal = this.handleCloseModal.bind(this);
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		if (this.props.dateFilter !== prevProps.dateFilter) {
			const dataForDate = this.props.dateFilter
				? this.props.heatmapDateMap[this.props.dateFilter]
				: {};

			let totalEvents = 0;
			totalEvents += dataForDate.instagrams
				? dataForDate.instagrams.length
				: 0;
			totalEvents += dataForDate.tweets ? dataForDate.tweets.length : 0;
			totalEvents += dataForDate.links ? dataForDate.links.length : 0;
			totalEvents += dataForDate.githubActivity
				? dataForDate.githubActivity.length
				: 0;

			this.setState({
				showModal: totalEvents > 0,
			});
		}
	}

	handleCloseModal() {
		this.setState({ showModal: false });
	}

	render() {
		const dataForDate = this.props.dateFilter
			? this.props.heatmapDateMap[this.props.dateFilter]
			: [];

		const dateDetailList = this.props.dateFilter ? (
			<DateDetailList ref="date-detail-list" data={dataForDate} />
		) : null;

		let mapVals = [];
		if (this.props.activityFilter === ActivityFilters.SHOW_ALL) {
			mapVals = this.props.links.concat(this.props.instagrams);
			mapVals = mapVals.concat(this.props.githubActivity);
		} else if (
			this.props.activityFilter === ActivityFilters.SHOW_INSTAGRAMS
		) {
			mapVals = this.props.instagrams;
		} else if (this.props.activityFilter === ActivityFilters.SHOW_TWEETS) {
			mapVals = this.props.tweets;
		} else if (
			this.props.activityFilter === ActivityFilters.SHOW_GITHUB_ACTIVITY
		) {
			mapVals = this.props.githubActivity;
		} else if (this.props.activityFilter === ActivityFilters.SHOW_LINKS) {
			mapVals = this.props.links;
		}

		const activityOptions = Object.keys(ActivityFilters).map((key) => {
			return { value: key, label: key };
		});

		return (
			<div className="heatmap">
				<div className="select wide">
					<Select
						options={activityOptions}
						value={{
							value: this.props.activityFilter,
							label: this.props.activityFilter,
						}}
						onChange={this.props.setActivityFilter}
						isSearchable={false}
					/>
				</div>

				<CalendarHeatmap
					startDate={moment().subtract(1, "year").toDate()}
					endDate={moment().toDate()}
					values={mapVals}
					onClick={this.props.setDateFilter}
					showMonthLabels={true}
					showWeekdayLabels={true}
					horizontal={this.props.horizontal}
				/>
				<Modal
					isOpen={this.state.showModal}
					className="modal"
					contentLabel="Date Detail"
					shouldCloseOnOverlayClick={true}
					onRequestClose={this.handleCloseModal}
				>
					{dateDetailList}
					<button onClick={this.handleCloseModal}>Close Modal</button>
				</Modal>
			</div>
		);
	}
}

export default Heatmap;
