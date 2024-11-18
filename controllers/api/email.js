import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'node:fs/promises';
import path from 'path';

export function setEmailTarget(sourceURL) {
  return process.env.TO_EMAIL === undefined
    ? `time@${sourceURL.substring(5)}`
    : process.env.TO_EMAIL
}
// Middleware to render the Handlebars template
export const renderEmailTemplate = async (doc) => {
  try {
    const { empName, sourceUrl } = req.body;

    const to = setEmailTarget(sourceUrl);
    const subject = `Timecard Submitted By ${empName}`;
    // Construct the path to the Handlebars template file
    const templatePath = path.resolve('../../views/email/timecardEmail.hbs');

    // Read the template file
    const templateSource = await fs.readFile(templatePath, 'utf-8');

    // Compile the template
    const compiledTemplate = handlebars.compile(templateSource);

    // Generate the HTML with the provided context
    const emailHtml = compiledTemplate(context);

    return {to, subject, emailHtml };
  } catch (error) {
    next(error);
  }
};

// Controller to send the email via SMTP2GO
export const sendEmail = async ({to, subject, emailHtml}) => {
  try {

    // Ensure emailHtml is prepared by middleware
    if (!emailHtml) {
      throw new Error('Email template not rendered.');
    }

    // Configure Nodemailer transporter for SMTP2GO
    const transporter = nodemailer.createTransport({
      host: 'mail.smtp2go.com', // SMTP2GO server
      port: 587, // Use port 587 for TLS
      secure: false, // Use true for 465 (if desired), false for other ports
      auth: {
        user: process.env.S2G_API_KEY, // Replace with your SMTP2GO username
        pass: 'dave@ado.software', // Replace with your SMTP2GO password
      },
    });

    // Send the email
    const mailOptions = {
      from: 'donotreply@ado.software', // Replace with your sender email address
      to,
      subject,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Email sent successfully via SMTP2GO', info });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
};