const fs = require('fs');
const { parse } = require('csv-parse/sync');

const content = fs.readFileSync('karnataka_synthetic_crime_records_100k.csv', 'utf8');
const records = parse(content, { 
    columns: true, 
    skip_empty_lines: true,
    trim: true
});

console.log(`Total records: ${records.length}`);
console.log('Sample:', JSON.stringify(records[0], null, 2));
