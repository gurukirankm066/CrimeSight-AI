const catalyst = require("zcatalyst-sdk-node");
const https = require("https");

module.exports = async (req, res) => {
	try {
		const app = catalyst.initialize(req);
		const zcql = app.zcql();

		// Get fresh access token
		const accessToken = await getAccessToken(app);

		const districtQuery = `
            SELECT District, COUNT(FIR_Number) as crime_count
            FROM crime_records
            GROUP BY District
        `;

		const crimeTypeQuery = `
            SELECT Crime_Type, COUNT(FIR_Number) as crime_count
            FROM crime_records
            GROUP BY Crime_Type
            LIMIT 20
        `;

		const caseQuery = `
            SELECT Case_Status, COUNT(FIR_Number) as crime_count
            FROM crime_records
            GROUP BY Case_Status
            LIMIT 10
        `;

		const [districtResult, crimeTypeResult, caseResult] = await Promise.all([
			zcql.executeZCQLQuery(districtQuery),
			zcql.executeZCQLQuery(crimeTypeQuery),
			zcql.executeZCQLQuery(caseQuery),
		]);

		const districtSummary = districtResult
			.filter(i => i.crime_records.District !== "d")
			.map(i => `${i.crime_records.District}: ${i.crime_records["COUNT(FIR_Number)"]} FIRs`)
			.join(", ");

		const crimeTypeSummary = crimeTypeResult
			.map(i => `${i.crime_records.Crime_Type}: ${i.crime_records["COUNT(FIR_Number)"]}`)
			.join(", ");

		const caseSummary = caseResult
			.map(i => `${i.crime_records.Case_Status}: ${i.crime_records["COUNT(FIR_Number)"]}`)
			.join(", ");

		const topDistrict = districtResult
			.filter(i => i.crime_records.District !== "d")
			.reduce((max, i) => {
				const count = parseInt(i.crime_records["COUNT(FIR_Number)"]);
				return count > max.count ? { name: i.crime_records.District, count } : max;
			}, { name: "", count: 0 });

		const prompt = `Write a 5-line morning intelligence brief for Karnataka State Police senior officers. Use this data:

Highest crime district: ${topDistrict.name} (${topDistrict.count} FIRs)
District breakdown: ${districtSummary}
Top crime types: ${crimeTypeSummary}
Case status: ${caseSummary}

OUTPUT FORMAT: Exactly 5 lines numbered 1-5. Each line is one sentence. No bullet points. No analysis. No headers. Start directly with "1."`;

		const briefText = await callGLM(prompt, accessToken);

		const datastore = app.datastore();
		const table = datastore.table("morning_brief");

		const existing = await table.getPagedRows({ page: 1 });
		if (existing && existing.data && existing.data.length > 0) {
			await Promise.all(existing.data.map(row => table.deleteRow(row.ROWID)));
		}

		await table.insertRow({ brief_text: briefText });

		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ success: true, brief: briefText }));

	} catch (err) {
		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: err.message }));
	}
};

async function getAccessToken(app) {
	const datastore = app.datastore();
	const table = datastore.table("auth_tokens");

	const rows = await table.getPagedRows({ page: 1 });

	console.log("RAW ROWS:", JSON.stringify(rows));

	const allRows = rows.data || rows;
	const refreshTokenRow = allRows.find(r =>
		(r.token_name || "").trim() === "glm_refresh_token"
	);

	if (!refreshTokenRow) throw new Error("Refresh token not found. Raw: " + JSON.stringify(allRows));

	const refreshToken = (refreshTokenRow.token_value || "").trim();

	const newAccessToken = await refreshAccessToken(refreshToken);
	return newAccessToken;
}
function refreshAccessToken(refreshToken) {
	return new Promise((resolve, reject) => {
		const params = new URLSearchParams({
			refresh_token: refreshToken,
			client_id: "1000.ZYQ14IJMB1GK4MZ8CK1IX6PZU92TKJ",
			client_secret: "9704efda2910cd338f925614c281948b7ea75d3788",
			grant_type: "refresh_token",
		}).toString();

		const options = {
			hostname: "accounts.zoho.in",
			path: "/oauth/v2/token",
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"Content-Length": Buffer.byteLength(params),
			},
		};

		const request = https.request(options, (response) => {
			let data = "";
			response.on("data", chunk => data += chunk);
			response.on("end", () => {
				try {
					const parsed = JSON.parse(data);
					if (parsed.access_token) {
						resolve(parsed.access_token);
					} else {
						reject(new Error("Token refresh failed: " + JSON.stringify(parsed)));
					}
				} catch (e) {
					reject(new Error("Token refresh parse error: " + data));
				}
			});
		});

		request.on("error", reject);
		request.write(params);
		request.end();
	});
}

function callGLM(prompt, accessToken) {
	return new Promise((resolve, reject) => {
		const body = JSON.stringify({
			model: "crm-di-glm47b_30b_it",
			messages: [
				{ role: "system", content: "You are a senior Karnataka State Police intelligence analyst." },
				{ role: "user", content: prompt }
			],
			max_tokens: 400,
			temperature: 0.7,
			stream: false,
			chat_template_kwargs: { enable_thinking: false },
		});

		const options = {
			hostname: "api.catalyst.zoho.in",
			path: "/quickml/v1/project/49093000000013048/glm/chat",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Zoho-oauthtoken ${accessToken}`,
				"CATALYST-ORG": "60075226836",
				"Content-Length": Buffer.byteLength(body),
			}
		};

		const request = https.request(options, (response) => {
			let data = "";
			response.on("data", chunk => data += chunk);
			response.on("end", () => {
				try {
					const parsed = JSON.parse(data);
					const text = parsed.choices?.[0]?.message?.content || parsed.response || JSON.stringify(parsed);
					resolve(text);
				} catch (e) {
					resolve(data);
				}
			});
		});

		request.on("error", reject);
		request.write(body);
		request.end();
	});
}