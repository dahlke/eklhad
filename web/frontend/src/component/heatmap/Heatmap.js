import React, { Component } from "react";
import Select from "react-select";
import { ActivityFilters } from "../../actions";
import CalendarHeatmap from "react-calendar-heatmap";
import DateDetailList from "../../component/dateDetailList/DateDetailList";
import moment from "moment";
import Modal from 'react-modal';
import "./Heatmap.scss";

Modal.setAppElement('#react-modal-target')

class Heatmap extends Component {
	constructor() {
		super();
		this.state = {
			showModal: false
		};

		this.handleCloseModal = this.handleCloseModal.bind(this);
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		if (this.props.dateFilter !== prevProps.dateFilter) {
			this.setState({
				showModal: true
			})
		}
	}

	handleCloseModal () {
		this.setState({ showModal: false });
	}

	// TODO: rename this class / classNames
	render() {
		// TODO: I think I can push this logic into Redux.
		const dataForDate = this.props.dateFilter
			? this.props.heatmapDateMap[this.props.dateFilter]
			: [];
		const dateDetailList = this.props.dateFilter ? (
			<DateDetailList ref="date-detail-list" data={dataForDate} />
		) : null;

		var mapVals = [];
		if (this.props.activityFilter === ActivityFilters.SHOW_ALL) {
			mapVals = this.props.links.concat(this.props.instagrams);
			mapVals = mapVals.concat(this.props.githubActivity);
		} else if (
			this.props.activityFilter === ActivityFilters.SHOW_INSTAGRAMS
		) {
			mapVals = this.props.instagrams;
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

		// TODO: show date on hover, hide datedetail list when changing the dateFilter or the activityFilter
		// TODO: show the years on the calendar heatmap
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
					className="date-detail-modal"
					contentLabel="Date Detail"
				>
					{dateDetailList}
					<button onClick={this.handleCloseModal}>Close Modal</button>
				</Modal>

			</div>
		);
	}
}

export default Heatmap;
