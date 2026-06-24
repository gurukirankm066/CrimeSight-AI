const catalyst = require("zcatalyst-sdk-node");

module.exports = async (context, basicIO) => {
	try {
		const app = catalyst.initialize(context);
		const zcql = app.zcql();

		const query = `
            SELECT District, Crime_Type, COUNT(FIR_Number) as crime_count
            FROM crime_records
            GROUP BY District, Crime_Type
            LIMIT 300 OFFSET 0
        `;

		const result = await zcql.executeZCQLQuery(query);

		const crimeTypes = {};
		result.forEach((item) => {
			const row = item.crime_records;
			if (row.District && row.District !== "d") {
				if (!crimeTypes[row.District]) crimeTypes[row.District] = {};
				crimeTypes[row.District][row.Crime_Type] = parseInt(row["COUNT(FIR_Number)"]);
			}
		});

		basicIO.write(JSON.stringify(crimeTypes));

	} catch (err) {
		basicIO.write(JSON.stringify({ error: err.message }));
	}

	context.close();
};