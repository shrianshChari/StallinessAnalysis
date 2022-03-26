import * as fs from 'fs';
import { importTeam } from './sets'
import {analyzeTeam} from './teamanalysis';

if (process.argv.length < 3) {
	console.log('You need to specify a file to read from!')
} else {
	let file_path = process.argv[2]

	console.log(`Reading data from: ${file_path}`);

	fs.readFile(file_path, 'utf8', (err, data) => {
		if (err) {
			console.log(`An error occurred while reading ${process.argv[2]}`)
			console.log(err)
			return;
		}
		let pokemon_sets = importTeam(data)

		// In case last mons are undefined
		while (pokemon_sets[pokemon_sets.length - 1] == undefined ||
					 pokemon_sets[pokemon_sets.length - 1] == null) {
			pokemon_sets.pop();
		}

		let gen = 8;

		if (process.argv.length == 4) {
			if (!(isNaN(parseInt(process.argv[3])))) {
				gen = parseInt(process.argv[3])
				gen = Math.min(8, gen);
			}
		}

		// Removing uppercase, spaces, and dashes
		pokemon_sets = JSON.parse(JSON.stringify(pokemon_sets).toLowerCase().replace(' ', '').replace('-', ''))

		for (let i = 0; i < pokemon_sets.length; i++) {
			pokemon_sets[i].ability = pokemon_sets[i].ability.replace(' ', '')
			pokemon_sets[i].moves = pokemon_sets[i].moves.map((item: string) => item.replace(' ', ''))
		}
		console.log(pokemon_sets)
		let team_analysis = analyzeTeam(pokemon_sets, gen);
		if (team_analysis) {
			console.log(`Total team bias: ${team_analysis.total_bias}`);
			console.log(`Average team stalliness: ${team_analysis.total_stalliness}`);
			console.log(`Team tags: ${team_analysis.team_tags.join(', ')}`);
		}
	});
}
