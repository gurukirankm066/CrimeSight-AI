"use strict";

module.exports = async (req, res) => {

	if (req.method === "GET") {
		res.writeHead(200, {
			"Content-Type": "application/json"
		});

		return res.end(
			JSON.stringify({
				success: true,
				message: "AI Summary function is working."
			})
		);
	}

	res.writeHead(405);
	res.end("Method Not Allowed");
};