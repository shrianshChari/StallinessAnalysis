import { PokemonSet, Sets } from "@pkmn/sets";

export function importTeam(str: string): PokemonSet[] {
	let team_sets: PokemonSet[] = [];
	
	let str_splits = str.split('\n\n') // Splits it into array of Pokemon


	if (str_splits[str_splits.length - 1].length == 0)
		str_splits.pop() // Sometimes it adds a 7th mon that is empty


	for (let mon of str_splits) {
		let set = Sets.importSet(mon)
		team_sets.push(set)
	}

	return team_sets; // I could use the Teams class, but this is just easier
}
