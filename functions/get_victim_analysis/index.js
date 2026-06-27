const catalyst = require("zcatalyst-sdk-node");

module.exports = async (req, res) => {
	res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
	res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

	if (req.method === "OPTIONS") {
		res.writeHead(200);
		return res.end();
	}

	try {
		const app = catalyst.initialize(req);
		const zcql = app.zcql();

		const genderQuery = `
            SELECT Victim_Gender, COUNT(FIR_Number) as count
            FROM crime_records
            GROUP BY Victim_Gender
            LIMIT 10
        `;

		const ageQuery = `
            SELECT Victim_Age, COUNT(FIR_Number) as count
            FROM crime_records
            GROUP BY Victim_Age
            LIMIT 300
        `;

		const crimeGenderQuery = `
            SELECT Victim_Gender, Crime_Type, COUNT(FIR_Number) as count
            FROM crime_records
            GROUP BY Victim_Gender, Crime_Type
            LIMIT 300
        `;

		const [genderResult, ageResult, crimeGenderResult] = await Promise.all([
			zcql.executeZCQLQuery(genderQuery),
			zcql.executeZCQLQuery(ageQuery),
			zcql.executeZCQLQuery(crimeGenderQuery),
		]);

		// Gender breakdown
		const genderBreakdown = {};
		genderResult.forEach(item => {
			const row = item.crime_records;
			if (row.Victim_Gender) {
				genderBreakdown[row.Victim_Gender] = parseInt(row["COUNT(FIR_Number)"]) || 0;
			}
		});

		// Age group bucketing
		const ageGroups = { "Under 18": 0, "18-35": 0, "36-60": 0, "60+": 0 };
		ageResult.forEach(item => {
			const row = item.crime_records;
			const age = parseInt(row.Victim_Age) || 0;
			const count = parseInt(row["COUNT(FIR_Number)"]) || 0;
			if (age < 18) ageGroups["Under 18"] += count;
			else if (age <= 35) ageGroups["18-35"] += count;
			else if (age <= 60) ageGroups["36-60"] += count;
			else ageGroups["60+"] += count;
		});

		// Top crimes by gender
		const crimesByGender = {};
		crimeGenderResult.forEach(item => {
			const row = item.crime_records;
			if (!row.Victim_Gender || !row.Crime_Type) return;
			if (!crimesByGender[row.Victim_Gender]) crimesByGender[row.Victim_Gender] = {};
			crimesByGender[row.Victim_Gender][row.Crime_Type] =
				(crimesByGender[row.Victim_Gender][row.Crime_Type] || 0) +
				(parseInt(row["COUNT(FIR_Number)"]) || 0);
		});

		// Top 5 crimes per gender
		const topCrimesByGender = {};
		Object.entries(crimesByGender).forEach(([gender, crimes]) => {
			topCrimesByGender[gender] = Object.entries(crimes)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 5)
				.map(([type, count]) => ({ type, count }));
		});

		const total = Object.values(genderBreakdown).reduce((a, b) => a + b, 0);

		res.writeHead(200, { "Content-Type": "application/json" });
		return res.end(JSON.stringify({
			total_victims: total,
			gender_breakdown: genderBreakdown,
			age_groups: ageGroups,
			top_crimes_by_gender: topCrimesByGender,
		}));

	} catch (err) {
		res.writeHead(500, { "Content-Type": "application/json" });
		return res.end(JSON.stringify({ error: err.message }));
	}
};