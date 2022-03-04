import * as fs from 'fs';
import { importTeam } from './sets'

let file_path = 'data/' + process.argv[2]

console.log(`Reading data from: ${file_path}`);

let team_file = fs.readFile(file_path, 'utf8', (err, data) => {
	if (err) {
		console.log(`An error occurred while reading ${process.argv[2]}`)
		console.log(err)
		return;
	}
	let pokemon_sets = importTeam(data)

	// Removing uppercase, spaces, and dashes
	pokemon_sets = JSON.parse(JSON.stringify(pokemon_sets).toLowerCase().replace(' ', '').replace('-', ''))
	console.log(`${JSON.stringify(pokemon_sets)}`) 
})
