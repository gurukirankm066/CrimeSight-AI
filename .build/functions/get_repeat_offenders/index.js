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

		// Count FIRs per accused person (Name + Age + District as fingerprint)
		const repeatQuery = `
            SELECT Accused_Name, Accused_Age, District, COUNT(FIR_Number) as fir_count
            FROM crime_records
            GROUP BY Accused_Name, Accused_Age, District
            LIMIT 300
        `;

		// Get crime types separately
		const crimeQuery = `
            SELECT Accused_Name, Accused_Age, District, Crime_Type, COUNT(FIR_Number) as fir_count
            FROM crime_records
            GROUP BY Accused_Name, Accused_Age, District, Crime_Type
            LIMIT 300
        `;

		const [repeatResult, crimeResult] = await Promise.all([
			zcql.executeZCQLQuery(repeatQuery),
			zcql.executeZCQLQuery(crimeQuery)
		]);

		// Build crime type map
		const crimeMap = {};
		crimeResult.forEach(item => {
			const row = item.crime_records;
			const key = `${row.Accused_Name}__${row.Accused_Age}__${row.District}`;
			if (!crimeMap[key]) crimeMap[key] = [];
			crimeMap[key].push({
				type: row.Crime_Type,
				count: parseInt(row["COUNT(FIR_Number)"]) || 0
			});
		});

		// Filter repeat offenders
		const repeatOffenders = repeatResult
			.map(item => {
				const row = item.crime_records;
				const key = `${row.Accused_Name}__${row.Accused_Age}__${row.District}`;
				return {
					name: row.Accused_Name,
					age: row.Accused_Age,
					district: row.District,
					total_firs: parseInt(row["COUNT(FIR_Number)"]) || 0,
					crimes: crimeMap[key] || []
				};
			})
			.filter(p => p.total_firs >= 2 && p.name && p.district !== "d")
			.sort((a, b) => b.total_firs - a.total_firs)
			.slice(0, 20);

		res.writeHead(200, { "Content-Type": "application/json" });
		return res.end(JSON.stringify({
			total_repeat_offenders: repeatOffenders.length,
			offenders: repeatOffenders
		}));

	} catch (err) {
		console.error(err);
		res.writeHead(500, { "Content-Type": "application/json" });
		return res.end(JSON.stringify({ error: err.message }));
	}
};