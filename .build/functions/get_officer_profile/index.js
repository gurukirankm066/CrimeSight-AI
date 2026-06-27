const catalyst = require("zcatalyst-sdk-node");

module.exports = async (req, res) => {
	// ---------------- CORS ----------------
	res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
	res.setHeader("Access-Control-Allow-Credentials", "true");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization"
	);

	// Handle preflight request
	if (req.method === "OPTIONS") {
		res.writeHead(200);
		return res.end();
	}

	try {
		const app = catalyst.initialize(req);

		// Development mode (replace with getCurrentUser() before production)
		const email = "gurukirankm90@gmail.com";

		const zcql = app.zcql();

		const query = `
            SELECT *
            FROM officers
            WHERE email='${email}'
            LIMIT 1
        `;

		const result = await zcql.executeZCQLQuery(query);

		if (!result || result.length === 0) {
			res.writeHead(404, {
				"Content-Type": "application/json"
			});

			return res.end(
				JSON.stringify({
					success: false,
					message: "Officer profile not found",
					email
				})
			);
		}

		const officer = result[0].officers;

		res.writeHead(200, {
			"Content-Type": "application/json"
		});

		return res.end(
			JSON.stringify({
				success: true,
				officer
			})
		);
	} catch (err) {
		console.error(err);

		res.writeHead(500, {
			"Content-Type": "application/json"
		});

		return res.end(
			JSON.stringify({
				success: false,
				error: err.message
			})
		);
	}
};