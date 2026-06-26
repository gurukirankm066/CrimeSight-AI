const catalyst = require("zcatalyst-sdk-node");

module.exports = async (req, res) => {
	// ---------- CORS ----------
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

		const query = `
            SELECT
                FIR_Number,
                Accused_Name,
                Victim_Name,
                Investigating_Officer,
                Police_Station,
                District,
                Crime_Type,
                IPC_Section,
                Court_Name,
                Weapon_Used
            FROM crime_records
            LIMIT 100
        `;

		const rows = await zcql.executeZCQLQuery(query);

		const nodes = [];
		const edges = [];

		const nodeMap = new Map();

		function addNode(id, label, type) {
			if (!id) return;

			if (!nodeMap.has(id)) {
				nodeMap.set(id, true);

				nodes.push({
					id,
					label,
					type
				});
			}
		}

		function addEdge(source, target, label) {
			if (!source || !target) return;

			edges.push({
				source,
				target,
				label
			});
		}

		rows.forEach(row => {

			const r = row.crime_records;

			addNode(r.Accused_Name, r.Accused_Name, "SUSPECT");
			addNode(r.Victim_Name, r.Victim_Name, "VICTIM");
			addNode(r.FIR_Number, r.FIR_Number, "FIR");

			addNode(
				r.Police_Station || r.District,
				r.Police_Station || r.District,
				"LOCATION"
			);

			addNode(
				r.Weapon_Used,
				r.Weapon_Used,
				"WEAPON"
			);

			addNode(
				r.Investigating_Officer,
				r.Investigating_Officer,
				"OFFICER"
			);

			addNode(
				r.Court_Name,
				r.Court_Name,
				"COURT"
			);

			addNode(
				r.IPC_Section,
				r.IPC_Section,
				"LAW"
			);

			addNode(
				r.Crime_Type,
				r.Crime_Type,
				"CRIME"
			);

			addEdge(r.Accused_Name, r.Victim_Name, "Victim");
			addEdge(r.Accused_Name, r.FIR_Number, "FIR");
			addEdge(r.Accused_Name, r.Crime_Type, "Crime");
			addEdge(r.Accused_Name, r.IPC_Section, "IPC");
			addEdge(r.Accused_Name, r.Police_Station, "Police Station");
			addEdge(r.Accused_Name, r.District, "District");
			addEdge(r.Accused_Name, r.Investigating_Officer, "Investigating Officer");
			addEdge(r.Accused_Name, r.Court_Name, "Court");
			addEdge(r.Accused_Name, r.Weapon_Used, "Weapon");
		});

		res.writeHead(200, {
			"Content-Type": "application/json"
		});

		return res.end(JSON.stringify({
			root_label: "Crime Network",

			nodes: nodes.map((node) => ({
				...node,

				pos: [
					Math.random() * 800 - 400,
					Math.random() * 800 - 400,
					Math.random() * 800 - 400,
				],

				size: 8,

				risk_score: Math.floor(Math.random() * 100),

				firs:
					node.type === "SUSPECT"
						? rows
							.filter(r => r.crime_records.Accused_Name === node.id)
							.map(r => r.crime_records.FIR_Number)
						: [],

				associates: [],

				vehicles: [],

				mobiles: [],

				last_known_location:
					node.type === "LOCATION"
						? node.label
						: "",
			})),

			links: edges.map((edge) => ({
				from: edge.source,
				to: edge.target,
				weight: 1,
			})),
		}));
	} catch (err) {
		console.error(err);

		res.writeHead(500, {
			"Content-Type": "application/json"
		});

		return res.end(JSON.stringify({
			success: false,
			error: err.message
		}));
	}
};