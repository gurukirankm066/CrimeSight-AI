const catalyst = require('zcatalyst-sdk-node');

module.exports = async (context, basicIO) => {
    try {

        const app = catalyst.initialize(context);
        const zcql = app.zcql();

        const accusedName = "Girish Kulkarni";

        const query = `
            SELECT Accused_Name,
                   District,
                   Crime_Type,
                   Weapon_Used,
                   Case_Status
            FROM crime_records
            WHERE Accused_Name = '${accusedName}'
            LIMIT 100
        `;

        const result = await zcql.executeZCQLQuery(query);

        basicIO.write(JSON.stringify({
            status: "success",
            records_found: result.length,
            data: result
        }));

    } catch (err) {

        basicIO.write(JSON.stringify({
            status: "error",
            message: err.message
        }));

    }

    context.close();
};
