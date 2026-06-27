"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { v4: uuid } = require("uuid");

const catalyst = require("zcatalyst-sdk-node");
const Busboy = require("busboy");

module.exports = async (req, res) => {
	const app = catalyst.initialize(req);
	const bucket = app.stratus().bucket("crime-evidence");
	const zia = app.zia();

	// CORS
	if (req.method === "OPTIONS") {
		res.writeHead(204, {
			"Access-Control-Allow-Origin": "http://localhost:3000",
			"Access-Control-Allow-Credentials": "true",
			"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
			"Access-Control-Allow-Headers": "*",
		});
		return res.end();
	}

	// Health Check
	if (req.method === "GET") {
		res.writeHead(200, {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "http://localhost:3000",
		});

		return res.end(
			JSON.stringify({
				success: true,
				message: "Upload Evidence function is working.",
			})
		);
	}

	if (req.method !== "POST") {
		res.writeHead(405);
		return res.end("Method Not Allowed");
	}

	try {
		const bb = Busboy({
			headers: req.headers,
		});

		bb.on("file", (fieldname, file, info) => {
			const chunks = [];

			console.log("FILE RECEIVED:", info.filename);

			file.on("data", (chunk) => {
				chunks.push(chunk);
			});

			file.on("end", async () => {
				let tempFile = null;

				try {
					// Create buffer
					const buffer = Buffer.concat(chunks);

					// Temp file
					tempFile = path.join(
						os.tmpdir(),
						uuid() + path.extname(info.filename || ".png")
					);

					fs.writeFileSync(tempFile, buffer);

					console.log("TEMP FILE:", tempFile);
					console.log("FILE EXISTS:", fs.existsSync(tempFile));

					// Object key
					const objectKey =
						"evidence/" +
						uuid() +
						path.extname(info.filename || "");

					// Upload to Stratus
					const uploadResult = await bucket.putObject(
						objectKey,
						fs.createReadStream(tempFile),
						{
							contentType: info.mimeType,
						}
					);

					console.log("UPLOAD SUCCESS");
					console.log(uploadResult);

					// Test Zia connection
					console.log("Testing Zia connection...");

					const response = await zia.getKeywordExtraction([
						"Hello world from CrimeSight AI"
					]);

					console.log("ZIA RESPONSE:");
					console.log(JSON.stringify(response, null, 2));

					// Delete temp file
					if (tempFile && fs.existsSync(tempFile)) {
						fs.unlinkSync(tempFile);
					}

					res.writeHead(200, {
						"Content-Type": "application/json",
						"Access-Control-Allow-Origin": "http://localhost:3000",
					});

					return res.end(
						JSON.stringify({
							success: true,
							objectKey,
							uploadResult,
							zia: response,
						})
					);

				} catch (err) {
					console.error("UPLOAD ERROR");
					console.error(err);

					if (tempFile && fs.existsSync(tempFile)) {
						fs.unlinkSync(tempFile);
					}

					res.writeHead(500, {
						"Content-Type": "application/json",
						"Access-Control-Allow-Origin": "http://localhost:3000",
					});

					return res.end(
						JSON.stringify({
							success: false,
							error: err.message,
						})
					);
				}
			});
		});

		bb.on("error", (err) => {
			console.error(err);

			res.writeHead(500, {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "http://localhost:3000",
			});

			res.end(
				JSON.stringify({
					success: false,
					error: err.message,
				})
			);
		});

		req.pipe(bb);

	} catch (err) {
		console.error(err);

		res.writeHead(200, {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "http://localhost:3000",
			"Access-Control-Allow-Credentials": "true",
		});

		res.end(
			JSON.stringify({
				success: false,
				error: err.message,
			})
		);
	}
};