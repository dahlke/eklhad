/* eslint-disable react/no-did-update-set-state */

import React, { Component } from "react";
import PropTypes from 'prop-types';
import Select from "react-select";
import CalendarHeatmap from "react-calendar-heatmap";
import moment from "moment";
import Modal from "react-modal";

import { ActivityFilters } from "../../actions";
import DateDetailList from "../dateDetailList/DateDetailList";

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

	// https://reactjs.org/docs/react-component.html#componentdidupdate
	componentDidUpdate(prevProps) {
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

		// TODO: does this need a ref anymore?
		const dateDetailList = this.props.dateFilter ? (
			<DateDetailList data={dataForDate} />
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

		const activityOptions = Object.keys(ActivityFilters).map((key) => ({
			value: key,
			label: key,
		}));

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
					<button type="button" onClick={this.handleCloseModal}>Close Modal</button>
				</Modal>
			</div>
		);
	}
}

Heatmap.propTypes = {
	dateFilter: PropTypes.string.isRequired,
	activityFilter: PropTypes.string.isRequired,
	githubActivity: PropTypes.array.isRequired,
	instagrams: PropTypes.array.isRequired,
	tweets: PropTypes.array.isRequired,
	links: PropTypes.array.isRequired,
	heatmapDateMap: PropTypes.object.isRequired,
	setActivityFilter: PropTypes.func.isRequired,
	setDateFilter: PropTypes.func.isRequired,
	horizontal: PropTypes.bool.isRequired,
};

export default Heatmap;
