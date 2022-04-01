import * as fs from 'fs';
import * as _ from 'lodash';
import { importTeam } from './sets'
import {analyzeTeam} from './teamanalysis';
import yargs from 'yargs/yargs';

const argv = yargs(process.argv.slice(0)).options({
	input: { type: 'string', alias: 'i' },
	gen: { type: 'number', alias: 'g' },
	verb: { type: 'boolean', default: false, alias: 'v' }
}).parseSync();

// console.log(argv);

if (argv.input === undefined) {
	console.log('You need to specify a file to read from!')
} else {
	let file_path = argv.input;

	console.log(`Reading data from: ${file_path}`);

	fs.readFile(file_path, 'utf8', (err, data) => {
		if (err) {
			console.log(`An error occurred while reading ${file_path}`)
			console.log(err)
			return;
		}
		let pokemon_sets = importTeam(data)

		// In case last mons are undefined
		while (pokemon_sets[pokemon_sets.length - 1] == undefined ||
					 pokemon_sets[pokemon_sets.length - 1] == null) {
			pokemon_sets.pop();
		}

		// Letting the user define the generation to analyze to
		let gen;
		if (argv.gen === undefined) {
			gen = 8;
		} else {
			gen = argv.gen;
		}

		// If the user wants to supply verbose output
		let verbose_output = argv.verb;
		
		// Removing uppercase, spaces, and dashes
		pokemon_sets = JSON.parse(JSON.stringify(pokemon_sets).toLowerCase().replace(' ', '').replace('-', ''));

		for (let i = 0; i < pokemon_sets.length; i++) {
			pokemon_sets[i].species = pokemon_sets[i].species.replace(' ', '').replace('-', '');
			pokemon_sets[i].ability = pokemon_sets[i].ability.replace(' ', '');
			pokemon_sets[i].moves = pokemon_sets[i].moves.map((item: string) => item.replace(' ', ''));
			pokemon_sets[i].item = pokemon_sets[i].item.replace(' ', '');
		}

		if (verbose_output)
			console.log(pokemon_sets)

		let team_analysis = analyzeTeam(pokemon_sets, gen, verbose_output);
		if (team_analysis) {
			console.log(`Total team bias: ${team_analysis.total_bias}`);
			console.log(`Average team stalliness: ${team_analysis.total_stalliness}`);
			console.log(`Team tags: ${team_analysis.team_tags.join(', ')}`);
		}
	});
}
