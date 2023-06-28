const converter = require("json-2-csv");
const fs = require("fs");

const productJSON = JSON.parse(fs.readFileSync("./src/output/products.json"));

(async () => {
	try {
		const csv = await converter.json2csvAsync(productJSON, {
			unwindArrays: true,
		});

		// print CSV string
		console.log(csv);

		// write CSV to a file
		fs.writeFileSync("./src/output/products.csv", csv);
	} catch (err) {
		console.log(err);
	}
})();
