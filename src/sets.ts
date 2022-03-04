import { PokemonSet, Sets } from "@pkmn/sets";

export function importTeam(str: string): PokemonSet[] {
	let team_sets: PokemonSet[] = [];
	
	let str_splits = str.split('\n\n')


	if (str_splits[str_splits.length - 1].length == 0)
		str_splits.pop()


	for (let pos in str_splits) {
		let mon = str_splits[pos]

		let set = Sets.importSet(mon)
		team_sets.push(set)
	}

	return team_sets;
}
