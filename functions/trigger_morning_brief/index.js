const https = require("https");

module.exports = async (context) => {
	try {
		const options = {
			hostname: "localhost",
			port: 3000,
			path: "/server/generate_brief/execute",
			method: "GET",
		};

		const result = await new Promise((resolve, reject) => {
			const req = https.request(options, (res) => {
				let data = "";
				res.on("data", chunk => data += chunk);
				res.on("end", () => resolve(data));
			});
			req.on("error", reject);
			req.end();
		});

		console.log("Brief generated:", result);
		context.close();

	} catch (err) {
		console.error("Error:", err.message);
		context.close();
	}
};