const catalyst = require("zcatalyst-sdk-node");

module.exports = async (req, res) => {
	try {
		const app = catalyst.initialize(req);
		const zcql = app.zcql();

		const districtQuery = `
            SELECT District, COUNT(FIR_Number) as crime_count
            FROM crime_records
            GROUP BY District
        `;

		const crimeTypeQuery1 = `
            SELECT District, Crime_Type, COUNT(FIR_Number) as crime_count
            FROM crime_records
            GROUP BY District, Crime_Type
            LIMIT 300 OFFSET 0
        `;

		const crimeTypeQuery2 = `
            SELECT District, Crime_Type, COUNT(FIR_Number) as crime_count
            FROM crime_records
            GROUP BY District, Crime_Type
            LIMIT 300 OFFSET 300
        `;

		const yearQuery = `
            SELECT Crime_Date, COUNT(FIR_Number) as crime_count
            FROM crime_records
            GROUP BY Crime_Date
            LIMIT 300
        `;

		const caseStatusQuery = `
            SELECT District, Case_Status, COUNT(FIR_Number) as crime_count, AVG(Days_To_Resolve) as avg_days
            FROM crime_records
            GROUP BY District, Case_Status
            LIMIT 300
        `;

		const [districtResult, r1, r2, yearResult, caseResult] = await Promise.all([
			zcql.executeZCQLQuery(districtQuery),
			zcql.executeZCQLQuery(crimeTypeQuery1),
			zcql.executeZCQLQuery(crimeTypeQuery2),
			zcql.executeZCQLQuery(yearQuery),
			zcql.executeZCQLQuery(caseStatusQuery)
		]);

		const crimeTypeResult = [...r1, ...r2];

		const districtSummary = {};
		districtResult.forEach((item) => {
			const row = item.crime_records;
			if (row.District && row.District !== "d") {
				districtSummary[row.District] = parseInt(row["COUNT(FIR_Number)"]);
			}
		});

		const crimeTypes = {};
		crimeTypeResult.forEach((item) => {
			const row = item.crime_records;
			if (row.District && row.District !== "d") {
				if (!crimeTypes[row.District]) crimeTypes[row.District] = {};
				crimeTypes[row.District][row.Crime_Type] = parseInt(row["COUNT(FIR_Number)"]);
			}
		});

		const yearSummary = {};
		yearResult.forEach((item) => {
			const row = item.crime_records;
			const year = row.Crime_Date?.split("-")[0];
			if (year) {
				yearSummary[year] = (yearSummary[year] || 0) + parseInt(row["COUNT(FIR_Number)"]);
			}
		});

		const caseTracker = {};
		caseResult.forEach((item) => {
			const row = item.crime_records;
			const d = row.District;
			if (!d || d === "d") return;
			if (!caseTracker[d]) caseTracker[d] = {
				total: 0, under_investigation: 0, chargesheet: 0,
				convicted: 0, acquitted: 0, closed: 0, avg_days: 0, _days_sum: 0, _days_count: 0
			};
			const count = parseInt(row["COUNT(FIR_Number)"]);
			const avg = parseFloat(row["AVG(Days_To_Resolve)"]) || 0;
			caseTracker[d].total += count;
			caseTracker[d]._days_sum += avg * count;
			caseTracker[d]._days_count += count;
			if (row.Case_Status === "Under Investigation") caseTracker[d].under_investigation += count;
			else if (row.Case_Status === "Chargesheet Filed") caseTracker[d].chargesheet += count;
			else if (row.Case_Status === "Convicted") caseTracker[d].convicted += count;
			else if (row.Case_Status === "Acquitted") caseTracker[d].acquitted += count;
			else if (row.Case_Status === "Closed - Untraced" || row.Case_Status === "Closed - Mistake of Fact") caseTracker[d].closed += count;
		});

		Object.values(caseTracker).forEach(d => {
			d.avg_days = d._days_count > 0 ? Math.round(d._days_sum / d._days_count) : 0;
			delete d._days_sum;
			delete d._days_count;
		});

		const body = JSON.stringify({ districtSummary, crimeTypes, yearSummary, caseTracker });
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(body);

	} catch (err) {
		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: err.message }));
	}
};