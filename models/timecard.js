/**
 * Represents a timecard in the system.
 * @typedef {Object} Timecard
 * @property {boolean} archived - Indicates if the timecard is archived.
 * @property {string} empName - The name of the employee.
 * @property {string} empEmail - The email of the employee.
 * @property {Array} timeEntries - An array of time entries.
 * @property {string} timeEntries.date - The date of the time entry.
 * @property {string} timeEntries.jobName - The name of the job.
 * @property {string} timeEntries.jobNum - The job number.
 * @property {number} timeEntries.hours - The number of hours worked.
 * @property {number} timeEntries.overtime - The number of overtime hours worked.
 * @property {string} sourceURL - The source URL of the timecard.
 * @property {number} hoursCount - The total number of hours worked in the timecard.
 * @property {number} overtimeCount - The total number of overtime hours worked in the timecard.
 * @property {number} punchCount - The number of punches in the timecard.
 * @property {function} week - A virtual getter function that returns the week number of the first time entry.
 */

/**
 * Represents the Timecard model.
 * @typedef {Model<Timecard>} TimecardModel
 */

import moment from "moment";
import { model, Schema } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import User from "./user.js";

const timecardSchema = new Schema(
	{
		archived: {
			type: Boolean,
			default: false,
		},
		empName: {
			type: String,
		},
		empEmail: {
			type: String,
			lowercase: true,
		},
		timeEntries: [
			{
				date: Date,
				jobName: String,
				jobNum: String,
				hours: Number,
				overtime: Number,
			},
		],
		sourceURL: {
			type: String,
			required: false,
		},
		hoursCount: Number,
		overtimeCount: Number,
		punchCount: Number,
	},
	{
		timestamps: true,
		toObject: { virtuals: true },
		toJSON: { virtuals: true },
		strict: false,
	},
);

timecardSchema.plugin(mongooseAutoPopulate);

timecardSchema.virtual("week").get(function () {
	return moment(this.timeEntries[0].date).locale("US").week();
});

/**
 * Retrieves all timecards created today.
 * @async
 * @function getTodays
 * @returns {Promise<Array<Timecard>>} - A promise that resolves to an array of timecards created today.
 */
timecardSchema.static("getTodays", async () => {
	const todaysTimecards = await model("Timecard")
		.find({ createdAt: { $gte: moment().startOf("day") } })
		.sort("empName");
	return todaysTimecards;
});

/**
 * Retrieves all timecards created in the current week.
 * @async
 * @function getThisWeeks
 * @returns {Promise<Array<Timecard>>} - A promise that resolves to an array of timecards created in the current week.
 */
timecardSchema.static("getThisWeeks", async () => {
	const thisWeek = moment().locale("US").week();
	const thisYearsTimecards = await model("Timecard").find();
	const thisWeeksTimecards = [];
	thisYearsTimecards.map((document) => {
		if (document.week === thisWeek) thisWeeksTimecards.push(document);
	});
	return thisWeeksTimecards;
});

/**
 * Retrieves all timecards created in the previous week.
 * @async
 * @function getLastWeeks
 * @returns {Promise<Array<Timecard>>} - A promise that resolves to an array of timecards created in the previous week.
 */
timecardSchema.static("getLastWeeks", async () => {
	const thisWeek = moment().locale("US").week();
	const thisYearsTimecards = await model("Timecard").find();
	const lastWeeksTimecards = [];
	thisYearsTimecards.map((document) => {
		if (document.week === thisWeek - 1) lastWeeksTimecards.push(document);
	});
	return lastWeeksTimecards;
});

/**
 * Retrieves all timecards created in the current month.
 * @async
 * @function getThisMonths
 * @returns {Promise<Array<Timecard>>} - A promise that resolves to an array of timecards created in the current month.
 */
timecardSchema.static("getThisMonths", async () => {
	const timecards = await model("Timecard")
		.find({ createdAt: { $gte: moment().startOf("month") } })
		.sort("empName");
	return timecards;
});

/**
 * Retrieves all timecards created in the current year.
 * If the user is an admin, it retrieves all timecards.
 * If the user is not an admin, it retrieves timecards specific to the user's company.
 * @async
 * @function getThisYears
 * @param {User} user - The user object.
 * @returns {Promise<Array<Timecard>>} - A promise that resolves to an array of timecards created in the current year.
 */
timecardSchema.static("getThisYears", async (user) => {
	if (user.role === "Admin") {
		const timecards = await model("Timecard")
			.find({ createdAt: { $gte: moment().startOf("year") } })
			.sort("empName");
		return timecards;
	} else {
		const timecards = await model("Timecard")
			.find({ createdAt: { $gte: moment().startOf("year") } })
			.where("sourceURL")
			.equals(`time.${user.company.rootDomain}`)
			.sort("empName");
		return timecards;
	}
});

/**
 * Retrieves all timecards created in the last 12 months.
 * If the user is an admin, it retrieves all timecards.
 * If the user is not an admin, it retrieves timecards specific to the user's company.
 * @async
 * @function getLast12Mo
 * @param {User} user - The user object.
 * @returns {Promise<Array<Timecard>>} - A promise that resolves to an array of timecards created in the last 12 months.
 */
timecardSchema.static("getLast12Mo", async (user) => {
	if (user.role === "Admin") {
		const timecards = await model("Timecard")
			.find({ createdAt: { $gte: moment().subtract("1", "year") } })
			.sort("empName");
		return timecards;
	} else {
		const timecards = await model("Timecard")
			.find({ createdAt: { $gte: moment().subtract("1", "year") } })
			.where("sourceURL")
			.equals(`time.${user.company.rootDomain}`)
			.sort("empName");
		return timecards;
	}
});

/**
 * Deletes all timecards with employee names containing "test" (case-insensitive).
 * @async
 * @function deleteTestEntries
 * @returns {Promise<void>} - A promise that resolves when the deletion is complete.
 */
timecardSchema.static("deleteTestEntries", async () => {
	await model("Timecard").deleteMany({
		empName: { $regex: /test/, $options: "i" },
	});
});

const Timecard = model("Timecard", timecardSchema, "timecards");
export default Timecard;
