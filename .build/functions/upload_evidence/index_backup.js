'use strict';

module.exports = async (req, res) => {
	res.writeHead(200, {
		"Content-Type": "application/json",
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type"
	});

	if (req.method === "OPTIONS") {
		return res.end();
	}

	return res.end(JSON.stringify({
		success: true,
		message: "Upload Evidence function is working.",
		timestamp: new Date().toISOString()
	}));
};