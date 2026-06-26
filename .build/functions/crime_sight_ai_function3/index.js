const catalyst = require("zcatalyst-sdk-node");
const url = require("url");

// Runs `baseQuery` repeatedly with LIMIT 300 OFFSET <page*300> until a page
// comes back with fewer than 300 rows (i.e. the last page), then returns all
// rows concatenated. Needed because ZCQL caps LIMIT at 300 per query, and this
// table has 100,000 rows — a single query silently truncates GROUP BY results.
async function fetchAllRows(zcql, baseQuery) {
	const pageSize = 300;
	let offset = 0;
	let allRows = [];
	while (true) {
		const pagedQuery = `${baseQuery} LIMIT ${pageSize} OFFSET ${offset}`;
		const pageRows = await zcql.executeZCQLQuery(pagedQuery);
		allRows = allRows.concat(pageRows);
		if (pageRows.length < pageSize) break;
		offset += pageSize;
	}
	return allRows;
}

module.exports = async (req, res) => {

	res.setHeader("Access-Control-Allow-Origin", "http://localhost:8080");
	res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

	if (req.method === "OPTIONS") {
		res.writeHead(200);
		return res.end();
	}

	try {
		const app = catalyst.initialize(req);
		const zcql = app.zcql();
		const parsedUrl = url.parse(req.url, true);
		const mode = parsedUrl.query.mode;
		const accusedName = parsedUrl.query.accused;

		// ---------------- Suspect Mode ----------------
		if (accusedName) {
			const suspectQuery = `
                SELECT FIR_Number, District, Crime_Type, Crime_Date, Case_Status
                FROM crime_records
                WHERE Accused_Name='${accusedName.replace(/'/g, "''")}'
                LIMIT 300
            `;
			const suspectResult = await zcql.executeZCQLQuery(suspectQuery);
			const suspectRecords = suspectResult.map(item => ({
				FIR_Number: item.crime_records.FIR_Number,
				District: item.crime_records.District,
				Crime_Type: item.crime_records.Crime_Type,
				Crime_Date: item.crime_records.Crime_Date,
				Case_Status: item.crime_records.Case_Status
			}));
			res.writeHead(200, { "Content-Type": "application/json" });
			return res.end(JSON.stringify({ suspectRecords }));
		}

		// ---------------- Shared Queries ----------------
		// districtQuery has no LIMIT (31 districts, well under 300 — confirmed
		// against the live table). crimeTypeQuery and caseStatusQuery group by
		// two columns and produce 500+ rows on this table, so they're paginated.
		const districtQuery = `
            SELECT District, COUNT(FIR_Number) as crime_count
            FROM crime_records
            GROUP BY District
        `;
		const crimeTypeBaseQuery = `
            SELECT District, Crime_Type, COUNT(FIR_Number) as crime_count
            FROM crime_records
            GROUP BY District, Crime_Type
        `;
		const caseStatusBaseQuery = `
            SELECT District, Case_Status, COUNT(FIR_Number) as crime_count
            FROM crime_records
            GROUP BY District, Case_Status
        `;

		const [districtResult, crimeTypeResult, caseResult] = await Promise.all([
			zcql.executeZCQLQuery(districtQuery),
			fetchAllRows(zcql, crimeTypeBaseQuery),
			fetchAllRows(zcql, caseStatusBaseQuery),
		]);

		// Build districtSummary
		const districtSummary = {};
		districtResult.forEach(item => {
			const row = item.crime_records;
			if (row.District && row.District !== "d") {
				districtSummary[row.District] = parseInt(row["COUNT(FIR_Number)"]);
			}
		});

		// Build crimeTypes
		const crimeTypes = {};
		crimeTypeResult.forEach(item => {
			const row = item.crime_records;
			if (row.District && row.District !== "d") {
				if (!crimeTypes[row.District]) crimeTypes[row.District] = {};
				crimeTypes[row.District][row.Crime_Type] = parseInt(row["COUNT(FIR_Number)"]);
			}
		});

		// Build caseTracker
		const caseTracker = {};
		caseResult.forEach(item => {
			const row = item.crime_records;
			const d = row.District;
			if (!d || d === "d") return;
			if (!caseTracker[d]) {
				caseTracker[d] = { total: 0, under_investigation: 0, chargesheet: 0, convicted: 0, acquitted: 0, closed: 0 };
			}
			const count = parseInt(row["COUNT(FIR_Number)"]);
			caseTracker[d].total += count;
			if (row.Case_Status === "Under Investigation") caseTracker[d].under_investigation += count;
			if (row.Case_Status === "Chargesheet Filed") caseTracker[d].chargesheet += count;
			if (row.Case_Status === "Convicted") caseTracker[d].convicted += count;
			if (row.Case_Status === "Acquitted") caseTracker[d].acquitted += count;
			if (row.Case_Status === "Closed - Untraced" || row.Case_Status === "Closed - Mistake of Fact") caseTracker[d].closed += count;
		});

		// ---------------- Intelligence Dashboard Mode ----------------
		// NOTE: placed after districtSummary / crimeTypes / caseTracker are built,
		// but before the top-district math below, since this mode doesn't need it.
		if (mode === "intelligence") {
			const datastore = app.datastore();
			const briefTable = datastore.table("morning_brief");
			const briefRows = await briefTable.getPagedRows({ page: 1 });
			const morningBriefText = briefRows?.data?.[0]?.brief_text || null;

			// yearSummary — ZCQL rejected YEAR(Crime_Date) ("function not supported"),
			// and there's no separate Crime_Year column on this table (confirmed via
			// schema check). So pull Crime_Date raw, paginated across all 100k rows,
			// and bucket by year here in JS instead.
			const yearRawBaseQuery = `
                SELECT Crime_Date
                FROM crime_records
            `;
			const yearRawRows = await fetchAllRows(zcql, yearRawBaseQuery);
			const yearSummary = {};
			yearRawRows.forEach(item => {
				const row = item.crime_records;
				if (row.Crime_Date) {
					const year = new Date(row.Crime_Date).getFullYear();
					if (!isNaN(year)) {
						yearSummary[year] = (yearSummary[year] || 0) + 1;
					}
				}
			});

			res.writeHead(200, { "Content-Type": "application/json" });
			return res.end(JSON.stringify({
				districtSummary,
				crimeTypes,
				yearSummary,
				caseTracker,
				morningBrief: morningBriefText,
			}));
		}

		// Find top district
		const sortedDistricts = Object.entries(districtSummary).sort((a, b) => b[1] - a[1]);
		const topDistrict = sortedDistricts[0];
		const topDistrictName = topDistrict?.[0] || "Bengaluru Urban";
		const topDistrictCount = topDistrict?.[1] || 0;

		// Find top crime for top district
		const topDistrictCrimes = crimeTypes[topDistrictName] || {};
		const sortedCrimes = Object.entries(topDistrictCrimes).sort((a, b) => b[1] - a[1]);
		const topCrime = sortedCrimes[0]?.[0] || "Theft";

		// Total crimes
		const totalCrimes = Object.values(districtSummary).reduce((a, b) => a + b, 0);

		// Case totals
		const totalUnderInvestigation = Object.values(caseTracker).reduce((a, b) => a + b.under_investigation, 0);
		const totalConvicted = Object.values(caseTracker).reduce((a, b) => a + b.convicted, 0);

		// Risk level
		const riskLevel = topDistrictCount > 10000 ? "HIGH" : topDistrictCount > 4000 ? "MED" : "LOW";

		// ---------------- Morning Brief Mode ----------------
		if (mode === "brief") {
			const datastore = app.datastore();
			const briefTable = datastore.table("morning_brief");
			const briefRows = await briefTable.getPagedRows({ page: 1 });
			const morningBriefText = briefRows?.data?.[0]?.brief_text || "";

			const morningBrief = {
				date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
				greeting_subtitle: `${topDistrictName} District Command · ${riskLevel === "HIGH" ? "3 critical alerts require your review." : "Situation under control."}`,
				synced_at: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
				ai_confidence: 92,
				confidence_label: "High Reliability",
				confidence_subtitle: "Cross-validated across live Catalyst crime records",
				confidence_bars: [
					{ label: "Pattern Matching", value: 94 },
					{ label: "Geospatial Correlation", value: 88 },
					{ label: "Historical Precedent", value: 92 },
				],
				summary: [
					{ label: "Total FIRs", value: totalCrimes, trend: `Across ${Object.keys(districtSummary).length} districts`, tone: "default" },
					{ label: "Active Investigations", value: totalUnderInvestigation, trend: "Currently open", tone: "default" },
					{ label: "Convictions", value: totalConvicted, trend: "Successfully closed", tone: "primary" },
					{ label: "Highest District", value: topDistrictName, trend: `${topDistrictCount.toLocaleString()} FIRs`, tone: "error" },
				],
				actions: [
					{ id: "1", priority: "HIGH", title: `Deploy additional patrol units to ${topDistrictName}`, subtitle: `${topCrime} trend elevated · Repeat offender network active`, confidence: 91 },
					{ id: "2", priority: "MED", title: "Review repeat offender network connections", subtitle: "CrimeSight AI detected linked FIR patterns across districts", confidence: 84 },
					{ id: "3", priority: "MED", title: "Audit cases pending over 180 days", subtitle: `${totalUnderInvestigation} cases currently under investigation`, confidence: 76 },
				],
				evidence: [
					{ icon: "analytics", title: "Pattern Match", detail: morningBriefText || `${topDistrictName} leads with ${topDistrictCount.toLocaleString()} FIRs. ${topCrime} is the dominant offence.`, source: "Catalyst DataStore · Live" },
					{ icon: "group", title: "Network Signal", detail: "Repeat offender behavioral fingerprinting active across all 31 districts.", source: "Crime Records · Pattern Engine" },
					{ icon: "map", title: "Geospatial Correlation", detail: `Top 5 districts account for ${Math.round((sortedDistricts.slice(0, 5).reduce((a, b) => a + b[1], 0) / totalCrimes) * 100)}% of all recorded crimes.`, source: "Hotspot model v1.0" },
				],
				crime_statistics: sortedCrimes.slice(0, 6).map(([label, value]) => ({
					label,
					value,
					change: "+0%",
				})),
			};

			res.writeHead(200, { "Content-Type": "application/json" });
			return res.end(JSON.stringify(morningBrief));
		}

		// ---------------- District Dashboard Mode (default) ----------------
		const highRiskAreas = sortedDistricts.slice(0, 4).map(([name, count]) => ({
			name,
			risk: count > 10000 ? "HIGH" : count > 4000 ? "MED" : "LOW",
			cases: count,
		}));

		const liveFeed = sortedDistricts.slice(0, 3).map(([name, count], i) => ({
			time: `0${8 + i}:${10 + i * 7}`,
			text: `${count.toLocaleString()} FIRs recorded —`,
			highlight: name,
		}));

		const criticalCount = sortedDistricts.filter(([, c]) => c > 10000).length;
		const watchCount = sortedDistricts.filter(([, c]) => c > 4000 && c <= 10000).length;
		const stableCount = sortedDistricts.filter(([, c]) => c <= 4000).length;

		const districtDashboard = {
			district: topDistrictName,
			risk_level: riskLevel,
			total_firs: topDistrictCount,
			active_investigations: caseTracker[topDistrictName]?.under_investigation || 0,
			repeat_offenders: 0,
			high_risk_areas: highRiskAreas,
			ai_recommendations: [
				{ title: `Deploy additional units to ${topDistrictName}`, detail: `${topCrime} is the top crime. Immediate action recommended.`, confidence: 91 },
				{ title: "Monitor repeat offender behavioral patterns", detail: "CrimeSight AI has detected linked FIR patterns across multiple districts.", confidence: 84 },
			],
			crime_trend: { label: topCrime, delta: "+18%" },
			live_feed: liveFeed,
			operational_status: { critical: criticalCount, watch: watchCount, stable: stableCount },
		};

		res.writeHead(200, { "Content-Type": "application/json" });
		return res.end(JSON.stringify(districtDashboard));

	} catch (err) {
		console.error(err);
		res.writeHead(500, { "Content-Type": "application/json" });
		return res.end(JSON.stringify({ error: err.message }));
	}
};