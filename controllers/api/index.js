import sanitizer from "./sanitizer.js";
import createMongoDocument from "./mongo.js";
import { renderEmailTemplate, sendEmail } from "./email.js";

const controller = {};

// Route terminator that sanitizes input, creates the document in the database, then sends the email and returns 202 Accepted
controller.submit = async (req, res) => {
    try {
        // Step 1: Sanitize the input
        const doc = sanitizer(req.body);

        // Step 2: Create the document in the database
        await createMongoDocument(doc);

        // Step 3: Render the email template
        const emailDetails = await renderEmailTemplate(req.body);

        // Step 4: Send the email
        await sendEmail(emailDetails);

        // Step 5: Respond to the client
        res.status(202).send("Accepted");
    } catch (err) {
        console.error("Error in submission process:", err.message);

        // Send an error response to the client
        res.status(500).send("An error occurred during submission.");
    }
};

export default controller;
