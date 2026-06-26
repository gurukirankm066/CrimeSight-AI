const catalyst = require('zcatalyst-sdk-node');

/**
 * @param {import('./types/basicio').Context} context
 * @param {import('./types/basicio').BasicIO} basicIO
 */
module.exports = async (context, basicIO) => {
	try {
		const app = catalyst.initialize(context);
		const zcql = app.zcql();

		const query = `
            SELECT Accused_Name,
                   COUNT(FIR_Number)
            FROM crime_records
            GROUP BY Accused_Name
            HAVING COUNT(FIR_Number) >= 10
            LIMIT 10
        `;

		const result = await zcql.executeZCQLQuery(query);

		const leads = result.map((row, index) => {

			const accused =
				row?.crime_records?.Accused_Name || "Unknown";

			const firCount = parseInt(
				row?.crime_records?.["COUNT(FIR_Number)"] || 0
			);

			let risk = "LOW";

			if (firCount >= 30) {
				risk = "HIGH";
			} else if (firCount >= 15) {
				risk = "MEDIUM";
			}

			return {
				rank: index + 1,
				accused_name: accused,
				fir_count: firCount,
				risk_level: risk,
				investigation_lead:
					`${accused} appears in ${firCount} FIRs and is classified as a ${risk} risk repeat offender requiring priority monitoring.`
			};
		});

		basicIO.write(JSON.stringify({
			status: "success",
			investigation_leads: leads
		}));

	} catch (err) {

		basicIO.write(JSON.stringify({
			status: "error",
			message: err.message
		}));

	}

	context.close();
};