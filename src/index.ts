import * as fs from 'fs';
import { importTeam } from './sets'

if (process.argv.length < 3) {
	console.log('You need to specify a file to read from!')
} else {
	let file_path = 'data/' + process.argv[2]

	console.log(`Reading data from: ${file_path}`);

	fs.readFile(file_path, 'utf8', (err, data) => {
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
}
