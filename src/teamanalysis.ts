import { PokemonSet } from "@pkmn/sets";
import { Dex, GenerationNum, StatsTable } from "@pkmn/dex";
import { Generations } from "@pkmn/data";

// Copied from Antar1011's implementation in Python
// https://github.com/Antar1011/Smogon-Usage-Stats

// Default gen is SwSh
export function analyzePokemon(mon: PokemonSet, gen: number = 8): Stalliness | undefined { 
	const currentGen = new Generations(Dex).get(gen as GenerationNum)

	let pokemon_species = currentGen.species.get(mon.species)

	// Checking if the pokemon exists
	if (pokemon_species === undefined) {
		console.log('Your Pokemon doesn\'t seem to exist.')
		return undefined;
	}

	// Calculates differential for offense investment vs defense investment 
	let bias = mon.evs.atk + mon.evs.spa - (mon.evs.hp + mon.evs.def + mon.evs.spd)

	// Calculates the Pokemon's in-game stats
	let stats: StatsTable = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0}

	stats.hp = currentGen.stats.calc('hp', pokemon_species.baseStats.hp,
																	 mon.ivs.hp, mon.evs.hp, mon.level,
																	 currentGen.natures.get(mon.nature))
	stats.atk = currentGen.stats.calc('atk', pokemon_species.baseStats.atk,
																		mon.ivs.atk, mon.evs.atk, mon.level,
																		currentGen.natures.get(mon.nature))
	stats.def = currentGen.stats.calc('def', pokemon_species.baseStats.def,
																		mon.ivs.def, mon.evs.def, mon.level,
																		currentGen.natures.get(mon.nature))
	stats.spa = currentGen.stats.calc('spa', pokemon_species.baseStats.spa,
																		mon.ivs.spa, mon.evs.spa, mon.level,
																		currentGen.natures.get(mon.nature))
	stats.spd = currentGen.stats.calc('spd', pokemon_species.baseStats.spd,
																		mon.ivs.spd, mon.evs.spd, mon.level,
																		currentGen.natures.get(mon.nature))
	stats.spe = currentGen.stats.calc('spe', pokemon_species.baseStats.spe,
																		mon.ivs.spe, mon.evs.spe, mon.level,
																		currentGen.natures.get(mon.nature))

	let stalliness = 0
	// Calculates stalliness
	if (mon.species === "shedinja") {
		// https://pokemetrics.wordpress.com/2012/08/16/measuring-stall-2/#:~:text=Cup%20Mienfoo%3A%200.40-,shedinja,-breaks%20this%20metric
		stalliness = 0
	} else if (mon.species === 'ditto') {
		// Not sure where this comes from, but it's probably in his thread
		stalliness = Math.log2(3)
	} else {
		let roll = (1 + 0.85) / 2
		let base_power = 120
		stalliness = -1 * Math.log2(((2 * mon.level + 10) / 250 *
																 Math.max(stats.atk, stats.spa) /
																 Math.max(stats.def, stats.spd) *
																 base_power + 2) * roll / stats.hp)
	}

	// Moveset modifications
	if (mon.ability === 'hugepower' || mon.ability === 'purepower')
		stalliness -= 1;
	if (mon.item.substring(0, 6) === 'choice' || mon.item === 'lifeorb')
		stalliness -= 0.5;
	if (mon.item === 'eviolite' && pokemon_species.prevo != undefined)
		stalliness += 0.5;
	if (mon.moves.includes('spikes'))
		stalliness += 0.5;
	if (mon.moves.includes('toxicspikes'))
		stalliness += 0.5;
	if (mon.moves.includes('toxic'))
		stalliness += 1;
	if (mon.moves.includes('willowisp'))
		stalliness += 0.5;

	let healing_moves = ['recover' ,'slackoff', 'healorder', 'milkdrink', 'roost',
		'moonlight', 'morningsun', 'synthesis', 'wish', 'aquaring', 'rest',
		'softboiled', 'swallow', 'leechseed']
	if (intersection(mon.moves, healing_moves).length != 0)
		stalliness += 1;

	if (mon.ability === 'regenerator')
		stalliness += 0.5;
	
	let remove_status = ['healbell', 'aromatherapy']
	if (intersection(mon.moves, remove_status).length != 0)
		stalliness += 0.5;

	let offensive_abilities = ['chlorophyll', 'download', 'hustle', 'moxie',
		'reckless', 'sandrush', 'solarpower', 'swiftswim', 'technician',
		'tintedlens', 'darkaura', 'fairyaura', 'infiltrator', 'parentalbond',
		'protean', 'strongjaw', 'sweetveil', 'toughclaws','aerilate','normalize',
		'pixilate','refrigerate']
	if (intersection(mon.moves, offensive_abilities))
		stalliness -= 0.5;

	let toxic_abilities = ['toxicboost', 'guts', 'quickfeet']
	let burn_abilities = ['flareboost', 'guts', 'quickfeet']
	if (toxic_abilities.includes(mon.ability) && mon.item === 'toxicorb')
		stalliness -= 1;
	if (burn_abilities.includes(mon.ability) && mon.item === 'flameorb')
		stalliness -= 1;

	let boosting_abilities = ['moody', 'speedboost']
	if (boosting_abilities.includes(mon.ability))
		stalliness -= 1;

	let trapping_abilities = ['arenatrap','magnetpull','shadowtag']
	if (trapping_abilities.includes(mon.ability))
		stalliness -= 1;

	let trapping_moves = ['block','meanlook','spiderweb','pursuit']
	if (intersection(mon.moves, trapping_moves))
		stalliness -= 0.5;

	let defensive_abilities = ['dryskin', 'filter', 'hydration', 'icebody',
		'intimidate', 'ironbarbs', 'marvelscale', 'naturalcure', 'magicguard',
		'multiscale', 'raindish', 'roughskin', 'solidrock', 'thickfat', 'unaware',
		'aromaveil', 'bulletproof', 'cheekpouch', 'gooey']
	if (intersection(mon.moves, defensive_abilities))
		stalliness += 0.5;

	if (mon.ability === 'poisonheal' && mon.item === 'toxicorb')
		stalliness += 0.5; // Gliscor moment

	let hates_offense = ['slowstart','truant','furcoat']
	if (hates_offense.includes(mon.ability))
		stalliness += 1;

	let screens = ['reflect', 'lightscreen', 'auroraveil']
	if (intersection(mon.moves, screens).length != 0 && mon.item === 'lightclay')
		stalliness -= 1;

	let twostage_boosters = ['curse', 'dragondance', 'growth', 'shiftgear',
		'swordsdance', 'fierydance', 'nastyplot', 'tailglow', 'quiverdance',
		'geomancy']
	let onestage_boosters = ['acupressure', 'bulkup', 'coil', 'howl', 'workup',
		'meditate', 'sharpen', 'calmmind', 'chargebeam', 'agility', 'autotomize',
		'flamecharge', 'rockpolish', 'doubleteam', 'minimize', 'tailwind',
		'poweruppunch', 'rototiller']
	if (mon.moves.includes('bellydrum'))
		stalliness -= 2;
	else if (mon.moves.includes('shellsmash'))
		stalliness -= 1.5;
	else if (intersection(mon.moves, twostage_boosters).length != 0)
		stalliness -= 1;
	else if (intersection(mon.moves, onestage_boosters).length != 0)
		stalliness -= 0.5;
	if (mon.moves.includes('substitute'))
		stalliness -= 0.5;

	let protection_moves = ['protect','detect','kingsshield','matblock','spikyshield'] // Include banefulbunker and obstruct
	if (intersection(mon.moves, protection_moves).length != 0)
		stalliness += 1;
	if (mon.moves.includes('endeavor'))
		stalliness -= 1;
	
	let halving_moves = ['superfang'] // Will want to include nature'smadness
	if (intersection(mon.moves, halving_moves).length != 0)
		stalliness -= 0.5;

	if (mon.moves.includes('trick'))
		stalliness -= 0.5;

	if (mon.moves.includes('psychoshift'))
		stalliness += 0.5;

	let phazing_moves = ['whirlwind', 'roar', 'circlethrow', 'dragontail']
	if (intersection(mon.moves, phazing_moves).length != 0)
		stalliness += 0.5;

	if (mon.item === 'redcard')
		stalliness += 0.5;

	let clearing_moves = ['haze', 'clearsmog']
	if (intersection(mon.moves, clearing_moves).length != 0)
		stalliness += 0.5;

	let paralysis_moves = ['thunderwave', 'stunspore', 'glare', 'nuzzle']
	if (intersection(mon.moves, paralysis_moves).length != 0)
		stalliness += 0.5;

	let confusion_moves = ['supersonic', 'confuseray', 'swagger', 'flatter',
		'teeterdance', 'yawn']
	if (intersection(mon.moves, confusion_moves).length != 0)
		stalliness += 0.5;
	
	let sleep_moves = ['darkvoid', 'grasswhistle', 'hypnosis', 'lovelykiss',
		'sing', 'sleeppowder', 'spore']
	if (intersection(mon.moves, sleep_moves).length != 0)
		stalliness -= 0.5;

	if (mon.item === 'rockyhelmet')
		stalliness += 0.5;

	if (mon.item === 'weaknesspolicy')
		stalliness -= 1;

	// Should figure out Z moves and other items like Adrenaline Orb
	let offensive_items = ['firegem', 'watergem', 'electricgem', 'grassgem',
		'icegem', 'fightinggem', 'posiongem', 'groundgem', 'groundgem',
		'flyinggem', 'psychicgem', 'buggem', 'rockgem', 'ghostgem', 'darkgem',
		'steelgem', 'normalgem', 'focussash', 'mentalherb', 'powerherb',
		'whiteherb', 'absorbbulb', 'berserkgene', 'cellbattery', 'redcard',
		'focussash', 'airballoon', 'ejectbutton', 'shedshell', 'aguavberry',
		'apicotberry', 'aspearberry', 'babiriberry', 'chartiberry', 'cheriberry',
		'chestoberry', 'chilanberry', 'chopleberry', 'cobaberry', 'custapberry',
		'enigmaberry', 'figyberry', 'ganlonberry', 'habanberry', 'iapapaberry',
		'jabocaberry', 'kasibberry', 'kebiaberry', 'lansatberry', 'leppaberry',
		'liechiberry', 'lumberry', 'magoberry', 'micleberry', 'occaberry',
		'oranberry', 'passhoberry', 'payapaberry', 'pechaberry', 'persimberry',
		'petayaberry', 'rawstberry', 'rindoberry', 'rowapberry', 'salacberry',
		'shucaberry', 'sitrusberry', 'starfberry', 'tangaberry', 'wacanberry',
		'wikiberry', 'yacheberry','keeberry','marangaberry','roseliberry','snowball']
	if (offensive_items.includes(mon.item))
		stalliness -= 0.5;

	if (mon.ability === 'harvest' || mon.moves.includes('recycle'))
		stalliness += 1;

	let recoil_moves = ['jumpkick', 'doubleedge', 'submission', 'petaldance',
		'hijumpkick', 'outrage', 'volttackle', 'closecombat', 'flareblitz',
		'bravebird', 'woodhammer', 'headsmash', 'headcharge', 'wildcharge',
		'takedown', 'dragonascent']
	if (intersection(mon.moves, recoil_moves).length != 0)
		stalliness -= 0.5;

	let sacrifice_moves = ['selfdestruct', 'explosion', 'destinybond',
		'perishsong', 'memento', 'healingwish', 'lunardance', 'finalgambit']
	if (intersection(mon.moves, sacrifice_moves).length != 0)
		stalliness -= 1;

	let ohko_moves = ['guillotine', 'fissure', 'sheercold', 'horndrill']
	if (intersection(mon.moves, ohko_moves))
		stalliness -= 1; // You must be insane or playing AG

	if (mon.ability === 'snowwarning' || mon.ability === 'sandstream' ||
			mon.moves.includes('hail') || mon.moves.includes('sandstorm'))
		stalliness -= 0.5;

	if ((mon.species === 'latias' || mon.species === 'latios') &&
			mon.item === 'souldew') {
		if (gen >= 7)
			stalliness -= 0.25; // Adamant/Lustrous Orb
		else
			stalliness -= 0.5; // Free CM boost
	}
		
	if (mon.species === 'pikachu' && mon.item === 'lightball')
		stalliness -= 1;

	if ((mon.species === 'cubone' || mon.species === 'marowak') &&
			mon.item === 'thickclub')
		stalliness -= 1;

	if (mon.species === 'clamperl') {
		if (mon.item === 'deepseatooth')
			stalliness -= 1;
		else if (mon.item === 'deepseascale')
			stalliness += 1;
	}

	let weak_offensive_items = ['expertbelt', 'wiseglasses', 'muscleband',
		'dracoplate', 'dreadplate', 'earthplate', 'fistplate', 'flameplate',
		'icicleplate', 'insectplate', 'ironplate', 'meadowplate', 'mindplate',
		'skyplate', 'splashplate', 'spookyplate', 'stoneplate', 'toxicplate',
		'zapplate', 'blackglasses', 'charcoal', 'dragonfang', 'hardstone', 'magnet',
		'metalcoat', 'miracleseed', 'mysticwater', 'nevermeltice', 'poisonbarb',
		'sharpbeak', 'silkscarf', 'silverpowder', 'softsand', 'spelltag',
		'twistedspoon', 'pixieplate']
	if (weak_offensive_items.includes(mon.item))
		stalliness -= 0.25;

	if (mon.species === 'dialga' && mon.item === 'adamantorb')
		stalliness -= 0.25;

	if (mon.species === 'palkia' && mon.item === 'lustrousorb')
		stalliness -= 0.25;

	if (mon.species === 'giratinaorigin' && mon.item === 'griseousorb')
		stalliness -= 0.25; // I hope you have a Tina-O with a Griseous Orb

	let mon_stall: Stalliness = {
		bias: bias,
		stalliness: stalliness
	}

	return mon_stall 
}

export interface Stalliness {
	bias: number
	stalliness: number
}

/*
 * Returns the intersection of the two arrays, with no duplicate
 * elements.
 */
function intersection(arr1: string[], arr2: string[]): string[] {
	let arr2_s = new Set(arr2)
	let intersection_s = new Set(arr1.filter(value => arr2_s.has(value)))
	return Array.from(intersection_s)
}
