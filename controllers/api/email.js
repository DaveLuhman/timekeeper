import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "node:fs/promises";
import path from "path";
import { formatDate } from '../../helpers/index.js';
handlebars.registerHelper("formatDate", formatDate);
export function setEmailTarget(sourceURL) {
	return process.env.TO_EMAIL === undefined
		? `time@${sourceURL.substring(5)}`
		: process.env.TO_EMAIL;
}
// Middleware to render the Handlebars template
export const renderEmailTemplate = async (doc) => {
	try {
		const { empName, sourceURL } = doc;

		const to = setEmailTarget(sourceURL);
		const subject = `Timecard Submitted By ${empName}`;
		// Construct the path to the Handlebars template file
		const templatePath = path.resolve("./views/email/timecardEmail.hbs");

		// Read the template file
		const templateSource = await fs.readFile(templatePath, "utf-8");

		// Compile the template
		const compiledTemplate = handlebars.compile(templateSource);

		// Generate the HTML with the provided context
		const emailHtml = compiledTemplate(doc);

		return { to, subject, emailHtml };
	} catch (error) {
		console.log("Error rendering email template:", error.message);
	}
};

// Controller to send the email via SMTP2GO
export const sendEmail = async ({ to, subject, emailHtml }) => {
	try {
		// Ensure emailHtml is prepared by middleware
		if (!emailHtml) {
			throw new Error("Email template not rendered.");
		}

		// Configure Nodemailer transporter for SMTP2GO
		const transporter = nodemailer.createTransport({
			host: "mail.smtp2go.com", // SMTP2GO server
			port: 587, // Use port 587 for TLS
			auth: {
				pass: process.env.S2G_API_KEY, // Replace with your SMTP2GO username
				user: "adosoftware", // Replace with your SMTP2GO password
			},
		});

		// Send the email
		const mailOptions = {
			from: "donotreply@ado.software", // Replace with your sender email address
			to,
			subject,
			html: emailHtml,
		};

		transporter.sendMail(
			mailOptions,
			(error, response) => {
				if (error) {
					console.log(error);
				} else {
					console.log(`Message sent: ${response.messageId}`);
				}
			},
		);

		return console.log("Email sent successfully via SMTP2GO");
	} catch (error) {
		throw new Error("Error sending email:", error.message);
	}
};
