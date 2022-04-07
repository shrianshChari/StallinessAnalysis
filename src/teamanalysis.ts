import { PokemonSet } from "@pkmn/sets";
import { Dex, GenerationNum, StatsTable, TypeName } from "@pkmn/dex";
import { Generations } from "@pkmn/data";
import * as _ from "lodash";

// Copied from Antar1011's implementation in Python
// https://github.com/Antar1011/Smogon-Usage-Stats

// Default gen is SwSh
export function analyzePokemon(mon: PokemonSet, gen: number = 8, verbose_output: boolean = false): Stalliness | undefined { 
	const currentGen = new Generations(Dex).get(gen as GenerationNum);

	let pokemon_species = currentGen.species.get(mon.species);

	// Checking if the pokemon exists
	if (pokemon_species === undefined) {
		console.log(`Your Pokemon ${mon.species} doesn\'t seem to exist.`);
		return undefined;
	}

	// Calculates differential for offense investment vs defense investment 
	let bias = mon.evs.atk + mon.evs.spa - (mon.evs.hp + mon.evs.def + mon.evs.spd);

	// Calculates the Pokemon's in-game stats
	let stats: StatsTable = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};

	// Mons IVs aren't always defined
	if (mon.ivs == undefined) {
		mon.ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
	}
	
	// Nor is their level
	if (mon.level == undefined) {
		mon.level = 100;
	}

	stats.hp = currentGen.stats.calc('hp', pokemon_species.baseStats.hp,
																	 mon.ivs.hp, mon.evs.hp, mon.level,
																	 currentGen.natures.get(mon.nature));
	stats.atk = currentGen.stats.calc('atk', pokemon_species.baseStats.atk,
																		mon.ivs.atk, mon.evs.atk, mon.level,
																		currentGen.natures.get(mon.nature));
	stats.def = currentGen.stats.calc('def', pokemon_species.baseStats.def,
																		mon.ivs.def, mon.evs.def, mon.level,
																		currentGen.natures.get(mon.nature));
	stats.spa = currentGen.stats.calc('spa', pokemon_species.baseStats.spa,
																		mon.ivs.spa, mon.evs.spa, mon.level,
																		currentGen.natures.get(mon.nature));
	stats.spd = currentGen.stats.calc('spd', pokemon_species.baseStats.spd,
																		mon.ivs.spd, mon.evs.spd, mon.level,
																		currentGen.natures.get(mon.nature));
	stats.spe = currentGen.stats.calc('spe', pokemon_species.baseStats.spe,
																		mon.ivs.spe, mon.evs.spe, mon.level,
																		currentGen.natures.get(mon.nature));

	let stalliness = 0;
	// Calculates stalliness
	if (mon.species === "shedinja") {
		// https://pokemetrics.wordpress.com/2012/08/16/measuring-stall-2/#:~:text=Cup%20Mienfoo%3A%200.40-,shedinja,-breaks%20this%20metric
		stalliness = 0;
	} else if (mon.species === 'ditto') {
		// Not sure where this comes from, but it's probably in his thread
		stalliness = Math.log2(3);
	} else {

		// For some reason, this calculation becomes slightly off
		// All the stats get calculated perfectly fine, so I don't know why
		// my calculations differ from what I would receive from Antar's
		// script.
		
		let roll = 0.925;
		let base_power = 120;
		let off = Math.max(stats.atk, stats.spa);
		let def = Math.max(stats.def, stats.spd)

		let damage = ((2 * mon.level + 10) * (off / def) * base_power / 250 + 2) * roll;
		stalliness = -1 * Math.log2(damage / stats.hp);

		// In case you want to display statistics
		if (verbose_output) {
			console.log(`Analaysis for ${mon.species}:`)
			console.log(stats);
			let debug_damage =`Level: ${mon.level}\nOffense: ${off}\nDefense: ${def}\nBase Power: ${base_power}\nRoll: ${roll}\nRaw Damage: ${damage}\nHP: ${stats.hp}\nRaw Stalliness: ${stalliness}`; 
			console.log(debug_damage);
		}
	}


	// Moveset modifications
	if (mon.ability === 'hugepower' || mon.ability === 'purepower') {
		if (verbose_output)
			console.log(`${mon.species} doubles its power!`);

		stalliness -= 1;
	}
	let choice_items = ['choicescarf', 'choiceband', 'choicespecs'];
	if (choice_items.includes(mon.item)) {
		if (verbose_output)
			console.log(`${mon.species} wields a Choice Item!`);

		stalliness -= 0.5;
	} else if (mon.item === 'lifeorb') {
		if (verbose_output)
			console.log(`${mon.species} wields a Life Orb!`);

		stalliness -= 0.5;
	}
	if (mon.item === 'eviolite' && pokemon_species.prevo != undefined) {
		if (verbose_output) console.log(`${mon.species} abuses Eviolite!`);

		stalliness += 0.5;
	}
	if (mon.moves.includes('spikes')) {
		if (verbose_output)
			console.log(`${mon.species} spreads Spikes!`);

		stalliness += 0.5;
	}
	if (mon.moves.includes('toxicspikes')) {
		if (verbose_output)
			console.log(`${mon.species} spreads Toxic Spikes!`);

		stalliness += 0.5;
	}
	if (mon.moves.includes('toxic')) {
		if (verbose_output)
			console.log(`${mon.species} spreads Toxic!`);

		stalliness += 1;
	}
	if (mon.moves.includes('willowisp')) {
		if (verbose_output)
			console.log(`${mon.species} spreads burn!`);

		stalliness += 0.5;
	}

	let healing_moves = ['recover' ,'slackoff', 'healorder', 'milkdrink',
		'roost', 'moonlight', 'morningsun', 'synthesis', 'wish', 'aquaring',
		'rest', 'softboiled', 'swallow', 'leechseed'];
	if (_.intersection(mon.moves, healing_moves).length != 0) {
		if (verbose_output)
			console.log(`${mon.species} can heal!`);

		stalliness += 1;
	}

	if (mon.ability === 'regenerator') {
		if (verbose_output)
			console.log(`${mon.species} can regenerate!`);

		stalliness += 0.5;
	}
	
	let remove_status = ['healbell', 'aromatherapy'];
	if (_.intersection(mon.moves, remove_status).length != 0) {
		if (verbose_output)
			console.log(`${mon.species} removes status!`);

		stalliness += 0.5;
	}


	let offensive_abilities = ['chlorophyll', 'download', 'hustle', 'moxie',
		'reckless', 'sandrush', 'solarpower', 'swiftswim', 'technician',
		'tintedlens', 'darkaura', 'fairyaura', 'infiltrator', 'parentalbond',
		'protean', 'strongjaw', 'sweetveil', 'toughclaws','aerilate',
		'normalize','pixilate','refrigerate'];
	if (offensive_abilities.includes(mon.ability)) {
		if (verbose_output)
			console.log(`${mon.species} has an offensive ability!`);

		stalliness -= 0.5;
	}


	let toxic_abilities = ['toxicboost', 'guts', 'quickfeet'];
	let burn_abilities = ['flareboost', 'guts', 'quickfeet'];
	if (toxic_abilities.includes(mon.ability) && mon.item === 'toxicorb') {
		if (verbose_output)
			console.log(`${mon.species} abuses poison!`);

		stalliness -= 1;
	}
	if (burn_abilities.includes(mon.ability) && mon.item === 'flameorb') {
		if (verbose_output)
			console.log(`${mon.species} abuses burn!`);

		stalliness -= 1;
	}

	let boosting_abilities = ['moody', 'speedboost'];
	if (boosting_abilities.includes(mon.ability)) {
		if (verbose_output)
			console.log(`${mon.species} has a stat-boosting ability!`);

		stalliness -= 1;
	}

	let trapping_abilities = ['arenatrap','magnetpull','shadowtag'];
	if (trapping_abilities.includes(mon.ability)) {
		if (verbose_output)
			console.log(`${mon.species} has a trapping ability!`);

		stalliness -= 1;
	}

	let trapping_moves = ['block','meanlook','spiderweb','pursuit'];
	if (_.intersection(mon.moves, trapping_moves).length != 0) {
		if (verbose_output)
			console.log(`${mon.species} has a trapping move!`);

		stalliness -= 0.5;
	}

	let defensive_abilities = ['dryskin', 'filter', 'hydration', 'icebody',
		'intimidate', 'ironbarbs', 'marvelscale', 'naturalcure',
		'magicguard', 'multiscale', 'raindish', 'roughskin', 'solidrock',
		'thickfat', 'unaware', 'aromaveil', 'bulletproof', 'cheekpouch',
		'gooey'];
	if (defensive_abilities.includes(mon.ability)) {
		if (verbose_output)
			console.log(`${mon.species} has a defensive ability!`)
		stalliness += 0.5;
	}

	// console.log(`Partial Stalliness: ${stalliness}`)

	if (mon.ability === 'poisonheal' && mon.item === 'toxicorb') {
		if (verbose_output)
			console.log(`${mon.species} abuses Poison Heal!`);

		stalliness += 0.5; // Gliscor moment
	}

	let hates_offense = ['slowstart','truant','furcoat'];
	if (hates_offense.includes(mon.ability)) {
		if (verbose_output)
			console.log(`${mon.species} hates offense!`);

		stalliness += 1;
	}

	let screens = ['reflect', 'lightscreen', 'auroraveil'];
	if (_.intersection(mon.moves, screens).length != 0 && mon.item === 'lightclay') {
		if (verbose_output)
			console.log(`${mon.species} has screens!`);
		stalliness -= 1;
	}


	let twostage_boosters = ['curse', 'dragondance', 'growth', 'shiftgear',
		'swordsdance', 'fierydance', 'nastyplot', 'tailglow', 'quiverdance',
		'geomancy'];
	let onestage_boosters = ['acupressure', 'bulkup', 'coil', 'howl',
		'workup', 'meditate', 'sharpen', 'calmmind', 'chargebeam', 'agility',
		'autotomize', 'flamecharge', 'rockpolish', 'doubleteam', 'minimize',
		'tailwind', 'poweruppunch', 'rototiller'];
	if (mon.moves.includes('bellydrum')) {
		if (verbose_output)
			console.log(`${mon.species} has Belly Drum!`);

		stalliness -= 2;
	}
	else if (mon.moves.includes('shellsmash')) {
		if (verbose_output)
			console.log(`${mon.species} has Shell Smash!`);

		stalliness -= 1.5;
	}
	else if (_.intersection(mon.moves, twostage_boosters).length != 0) {
		if (verbose_output)
			console.log(`${mon.species} has a two-stage boosting move!`);

		stalliness -= 1;
	}
	else if (_.intersection(mon.moves, onestage_boosters).length != 0) {
		if (verbose_output)
			console.log(`${mon.species} has a single-stage boosting move!`);

		stalliness -= 0.5;
	}
	if (mon.moves.includes('substitute')) {
		if (verbose_output)
			console.log(`${mon.species} has Substitute!`);

		stalliness -= 0.5;
	}

	let protection_moves = ['protect','detect','kingsshield','matblock','spikyshield']; // Include banefulbunker and obstruct
	if (_.intersection(mon.moves, protection_moves).length != 0) {
		if (verbose_output)
			console.log(`${mon.species} has a protection move!`);

		stalliness += 1;
	}
	if (mon.moves.includes('endeavor')) {
		if (verbose_output)
			console.log(`${mon.species} has Endeavor!`);

		stalliness -= 1;
	}
	
	let halving_moves = ['superfang']; // Will want to include nature'smadness
	if (_.intersection(mon.moves, halving_moves).length != 0) {
		if (verbose_output)
			console.log(`${mon.species} can halve its opponent's HP!`);

		stalliness -= 0.5;
	}

	if (mon.moves.includes('trick') || mon.moves.includes('switcheroo')) {
		if (verbose_output)
			console.log(`${mon.species} can change its item with its opponent!`);

		stalliness -= 0.5;
	}

	if (mon.moves.includes('psychoshift')) {
		if (verbose_output)
			console.log(`${mon.species} can shift status to its opponent!`)
		stalliness += 0.5;
	}

	let phazing_moves = ['whirlwind', 'roar', 'circlethrow', 'dragontail'];
	if (_.intersection(mon.moves, phazing_moves).length != 0) {
		if (verbose_output)
			console.log(`${mon.species} can phaze!`)
		stalliness += 0.5;
	}

	if (mon.item === 'redcard') {
		if (verbose_output)
			console.log(`${mon.species} has a ${mon.item}!`);

		stalliness += 0.5;
	}

	let clearing_moves = ['haze', 'clearsmog'];
	if (_.intersection(mon.moves, clearing_moves).length != 0) {
		if (verbose_output)
			console.log(`${mon.species} has a stat clearing move!`);

		stalliness += 0.5;
	}

	let paralysis_moves = ['thunderwave', 'stunspore', 'glare', 'nuzzle'];
	if (_.intersection(mon.moves, paralysis_moves).length != 0) {
		if (verbose_output)
			console.log(`${mon.species} has a paralysis move!`);

		stalliness += 0.5;
	}

	let confusion_moves = ['supersonic', 'confuseray', 'swagger', 'flatter',
		'teeterdance', 'yawn'];
	if (_.intersection(mon.moves, confusion_moves).length != 0) {
		if (verbose_output)
			console.log(`${mon.species} has a confusion move!`);

		stalliness += 0.5;
	}
	
	let sleep_moves = ['darkvoid', 'grasswhistle', 'hypnosis', 'lovelykiss',
		'sing', 'sleeppowder', 'spore'];
	if (_.intersection(mon.moves, sleep_moves).length != 0) {
		if (verbose_output)
			console.log(`${mon.species} has a sleep move!`);

		stalliness -= 0.5;
	}

	if (mon.item === 'rockyhelmet') {
		if (verbose_output)
			console.log(`${mon.species} has a rocky helmet!`);

		stalliness += 0.5;
	}

	if (mon.item === 'weaknesspolicy') {
		if (verbose_output)
			console.log(`${mon.species} has a weakness policy!`);
		
		stalliness -= 1;
	}

	// Should figure out Z moves and other items like Adrenaline Orb
	let offensive_items = ['firegem', 'watergem', 'electricgem', 'grassgem',
		'icegem', 'fightinggem', 'posiongem', 'groundgem', 'groundgem',
		'flyinggem', 'psychicgem', 'buggem', 'rockgem', 'ghostgem', 'darkgem',
		'steelgem', 'normalgem', 'focussash', 'mentalherb', 'powerherb',
		'whiteherb', 'absorbbulb', 'berserkgene', 'cellbattery', 'redcard',
		'focussash', 'airballoon', 'ejectbutton', 'shedshell', 'aguavberry',
		'apicotberry', 'aspearberry', 'babiriberry', 'chartiberry',
		'cheriberry', 'chestoberry', 'chilanberry', 'chopleberry',
		'cobaberry', 'custapberry', 'enigmaberry', 'figyberry', 'ganlonberry',
		'habanberry', 'iapapaberry', 'jabocaberry', 'kasibberry',
		'kebiaberry', 'lansatberry', 'leppaberry', 'liechiberry', 'lumberry',
		'magoberry', 'micleberry', 'occaberry', 'oranberry', 'passhoberry',
		'payapaberry', 'pechaberry', 'persimberry', 'petayaberry',
		'rawstberry', 'rindoberry', 'rowapberry', 'salacberry', 'shucaberry',
		'sitrusberry', 'starfberry', 'tangaberry', 'wacanberry', 'wikiberry',
		'yacheberry','keeberry','marangaberry','roseliberry','snowball'];
	if (offensive_items.includes(mon.item)) {
		if (verbose_output)
			console.log(`${mon.species} has a ${mon.item}!`);

		stalliness -= 0.5;
	}

	if (mon.ability === 'harvest' || mon.moves.includes('recycle')) {
		console.log(`${mon.species} can recycle its item!`);

		stalliness += 1;
	}

	let recoil_moves = ['jumpkick', 'doubleedge', 'submission',
		'petaldance', 'hijumpkick', 'outrage', 'volttackle', 'closecombat',
		'flareblitz', 'bravebird', 'woodhammer', 'headsmash', 'headcharge',
		'wildcharge', 'takedown', 'dragonascent'];
	if (_.intersection(mon.moves, recoil_moves).length != 0) {
		if (verbose_output)
			console.log(`${mon.species} knows a recoil move!`)
		stalliness -= 0.5;
	}

	let sacrifice_moves = ['selfdestruct', 'explosion', 'destinybond',
		'perishsong', 'memento', 'healingwish', 'lunardance', 'finalgambit'];
	if (_.intersection(mon.moves, sacrifice_moves).length != 0) {
		if (verbose_output)
			console.log(`${mon.species} knows a sacrificial move!`)
		stalliness -= 1;
	}

	let ohko_moves = ['guillotine', 'fissure', 'sheercold', 'horndrill'];
	if (_.intersection(mon.moves, ohko_moves).length != 0) {
		if (verbose_output)
			console.log(`${mon.species} has an OHKO move!`);
		stalliness -= 1; // You must be insane or playing AG
	}

	if (mon.ability === 'snowwarning' || mon.ability === 'sandstream' ||
			mon.moves.includes('hail') || mon.moves.includes('sandstorm')) {
		if (verbose_output)
			console.log(`${mon.species} has a damaging weather move/ability!`);
		stalliness += 0.5;
	}

	if ((mon.species === 'latias' || mon.species === 'latios') &&
			mon.item === 'souldew') {
		if (verbose_output)
			console.log(`${mon.species} has a ${mon.item}!`);
		if (gen >= 7) {
			stalliness -= 0.25; // Adamant/Lustrous Orb
		}
		else {
			stalliness -= 0.5; // Free CM boost
		}
	}
		
	if (mon.species === 'pikachu' && mon.item === 'lightball') {
		if (verbose_output)
			console.log(`${mon.species} has a Light Ball!`);
		stalliness -= 1;
	}

	if ((mon.species === 'cubone' || mon.species === 'marowak') &&
			mon.item === 'thickclub') {
		if (verbose_output)
			console.log(`${mon.species} has a Thick Club!`);
		stalliness -= 1;
	}

	if (mon.species === 'clamperl') {
		if (mon.item === 'deepseatooth') {
			if (verbose_output)
				console.log(`${mon.species} has a ${mon.item}!`);
			stalliness -= 1;
		}
		else if (mon.item === 'deepseascale') {
			if (verbose_output)
				console.log(`${mon.species} has a ${mon.item}!`);
			stalliness += 1;
		}
	}

	let weak_offensive_items = ['expertbelt', 'wiseglasses', 'muscleband',
		'dracoplate', 'dreadplate', 'earthplate', 'fistplate', 'flameplate',
		'icicleplate', 'insectplate', 'ironplate', 'meadowplate', 'mindplate',
		'skyplate', 'splashplate', 'spookyplate', 'stoneplate', 'toxicplate',
		'zapplate', 'blackglasses', 'charcoal', 'dragonfang', 'hardstone',
		'magnet', 'metalcoat', 'miracleseed', 'mysticwater', 'nevermeltice',
		'poisonbarb', 'sharpbeak', 'silkscarf', 'silverpowder', 'softsand',
		'spelltag', 'twistedspoon', 'pixieplate'];
	if (weak_offensive_items.includes(mon.item)) {
		if (verbose_output)
			console.log(`${mon.species} has a ${mon.item}!`);

		stalliness -= 0.25;
	}

	if (mon.species === 'dialga' && mon.item === 'adamantorb') {
		if (verbose_output)
			console.log(`${mon.species} has a ${mon.item}!`);

		stalliness -= 0.25;
	}

	if (mon.species === 'palkia' && mon.item === 'lustrousorb') {
		if (verbose_output)
			console.log(`${mon.species} has a ${mon.item}!`);

		stalliness -= 0.25;
	}

	if (mon.species === 'giratinaorigin' && mon.item === 'griseousorb') {
		if (verbose_output)
			console.log(`${mon.species} has a ${mon.item}!`);

		stalliness -= 0.25; // I hope you have a Tina-O with a Griseous Orb
	}

	if (verbose_output)
		console.log(`Post Modification Stalliness: ${stalliness}`)
	// Adjusting so that 0 is the 3HKO mark
	stalliness -= Math.log2(3);

	let mon_stall: Stalliness = {
		bias: bias,
		stalliness: stalliness
	}

	console.log(`${mon.species}: ${bias}, ${stalliness}`);

	return mon_stall;
}

export function analyzeTeam(team: PokemonSet[], gen: number = 8,
														verbose_output: boolean = false): TeamStalliness | undefined {
	let total_bias = 0;
	let total_stalliness: number = 0;
	let num_mons = 0;
	let team_tags: string[] = [];
	for (let i = 0; i < team.length; i++) {
		let mon = team[i];

		// Will want to include Mega Pokemon at some point
		// This includes Megas, Primals, Darm-Zen, and Meloetta-Pirouette

		let mon_stall = analyzePokemon(mon, gen, verbose_output);
		if (mon_stall) { // If it isn't undefined
			total_bias += mon_stall.bias;
			total_stalliness += mon_stall.stalliness;
			num_mons++;
		}
	}
	if (num_mons == 0) {
		return undefined;
	}
	total_stalliness /= num_mons;


	// Tags


	// Weather
	let num_rain = 0;
	let rain_detected = false;

	let num_sun = 0;
	let sun_detected = false;

	let num_sand = 0;
	let sand_detected = false;

	let num_hail = 0;
	let hail_detected = false;

	for (let i = 0; i < team.length; i++) {
		let mon = team[i];

		// Rain
		if (mon.ability === 'drizzle' || mon.ability === 'primordialsea') {
			// Idk about Primordial Sea
			rain_detected = true;
		} else if (mon.item === 'damprock' &&
							 mon.moves.includes('raindance')) {
			rain_detected = true;
		} else if (mon.moves.includes('raindance')) {
			// Multiple rain setters
			num_rain++;
			if (num_rain > 1) {
				rain_detected = true;
			}
		}
		
		
		// Sun 
		if (mon.ability === 'drought' || mon.ability === 'desolateland') {
			// Idk about Desolate Land 
			sun_detected = true;
		} else if (mon.item === 'heatrock' &&
							 mon.moves.includes('sunnyday')) {
			sun_detected = true;
		} else if (mon.moves.includes('sunnyday')) {
			// Multiple sun setters
			num_sun++;
			if (num_sun > 1) {
				sun_detected = true;
			}
		}


		// Sand
		if (mon.ability === 'sandstream') {
			sand_detected = true;
		} else if (mon.item === 'smoothrock' &&
							 mon.moves.includes('sandstorm')) {
			sand_detected = true;
		} else if (mon.moves.includes('sandstorm')) {
			// Multiple sand setters
			num_sand++;
			if (num_sand > 1) {
				sand_detected = true;
			}
		}


		// Hail
		if (mon.ability === 'snowwarning') {
			hail_detected = true;
		} else if (mon.item === 'icyrock' &&
							 mon.moves.includes('hail')) {
			hail_detected = true;
		} else if (mon.moves.includes('hail')) {
			// Multiple hail setters
			num_hail++;
			if (num_hail > 1) {
				hail_detected = true;
			}
		}
	}

	if (rain_detected)
		team_tags.push('rain');
	
	if (sun_detected)
		team_tags.push('sun');
	
	if (sand_detected) {
		team_tags.push('sand');
	}
	
	if (hail_detected) {
		team_tags.push('hail');
	}
	
	if (team_tags.length == 4) {
		// Chad all weather user
		team_tags.push('allweather');
	} else if (team_tags.length > 1) {
		team_tags.push('multiweather');
	} else if (team_tags.length == 0) {
		team_tags.push('weatherless');
	}

	// Baton Pass
	let boosts =  ['acupressure', 'bellydrum', 'bulkup', 'coil', 'curse',
		'dragondance', 'growth', 'honeclaws', 'howl', 'meditate', 'sharpen',
		'shellsmash', 'shiftgear', 'swordsdance', 'workup', 'calmmind',
		'chargebeam', 'fierydance', 'nastyplot', 'tailglow', 'quiverdance',
		'agility', 'autotomize', 'flamecharge', 'rockpolish', 'doubleteam',
		'minimize', 'substitute', 'acidarmor', 'barrier', 'cosmicpower',
		'cottonguard', 'defendorder', 'defensecurl', 'harden', 'irondefense',
		'stockpile', 'withdraw', 'amnesia', 'charge', 'ingrain'] ;
	let num_pass = 0;
	for (let i = 0; i < team.length; i++) {
		let mon = team[i];
		if (mon.moves.includes('batonpass')) {
			// Does smashpass and geopass count as a baton pass team?
			// if so, this line will be more useful
			// if (mon.moves.includes('geomancy') || mon.moves.includes('shellsmash'))
			if(_.intersection(mon.moves, boosts).length > 0) {
				num_pass++;
			}
		}
	}

	if (num_pass > 1) {
		team_tags.push('batonpass');
	}

	// Tailwind(?)
	let num_wind = 0;
	for (let i = 0; i < team.length; i++) {
		let mon = team[i];
		if (mon.moves.includes('tailwind')) {
			num_wind++;
		}
	}

	if (num_wind) {
		team_tags.push('tailwind');
	}

	// Trick Room
	let num_setters = 0;
	let num_abusers = 0;
	let minus_speed = ['brave', 'relaxed', 'quiet', 'sassy'];
	for (let i = 0; i < team.length; i++) {
		let mon = team[i];
		if (mon.moves.includes('trickroom')) {
			num_setters++;
		} else if (minus_speed.includes(mon.ability) || mon.evs.spe < 5) {
			num_abusers++;
		} else {
			const currentGen = new Generations(Dex).get(gen as GenerationNum);

			let pokemon_species = currentGen.species.get(mon.species);
			if (pokemon_species && pokemon_species.baseStats.spe < 50) {
				// Arbitrary cutoff, but whatever
				num_abusers++;
			}
		}
	}

	if ((num_setters > 1 && num_abusers > 1) || num_setters > 2) {
		team_tags.push('trickroom');

		// TrickWeather(?)
		if (team_tags.includes('rain')) {
			team_tags.push('trickrain');
		}
		if (team_tags.includes('sun')) {
			team_tags.push('tricksun');
		}
		if (team_tags.includes('sand')) {
			team_tags.push('tricksand');
		}
		if (team_tags.includes('hail')) {
			team_tags.push('trickhail');
		}
	}

	// Gravity (?)
	// Will implement later 
	
	// VoltTurn
	let switch_moves = ['voltswitch', 'uturn', 'flipturn', 'batonpass'];
	let num_switchers = 0;
	for (let i = 0; i < team.length; i++) {
		let mon = team[i];
		if (_.intersection(mon.moves, switch_moves).length != 0) {
			num_switchers++;
		}
	}
	if (num_switchers > 2 && !(team_tags.includes('batonpass'))) {
		team_tags.push('voltturn');
	}

	// DragMag and Trapping
	let trapping_abilities = ['arenatrap','magnetpull','shadowtag'];
	let trapping_moves = ['block','meanlook','spiderweb',];
	let num_trappers = 0;
	let num_dragons = 0;
	for (let i = 0; i < team.length; i++) {
		let mon = team[i];
		if (trapping_abilities.includes(mon.ability) ||
				_.intersection(mon.moves, trapping_moves).length != 0) {
			num_trappers++;
		} else {
			const currentGen = new Generations(Dex).get(gen as GenerationNum);

			let pokemon_species = currentGen.species.get(mon.species);
			if (pokemon_species && pokemon_species.types.includes('Dragon')){
				num_dragons++;
			}
		}
	}
	if (num_trappers >= 1 && num_dragons >= 2) {
		team_tags.push('dragmag');
	} else if (num_trappers >= 2) {
		team_tags.push('trapper');
	}

	// F.E.A.R
	let num_anti_hazard = 0;
	let num_fear = 0;
	for (let i = 0; i < team.length; i++) {
		let mon = team[i];
		if ((mon.ability === 'sturdy' || mon.item === 'focussash')
				&& mon.moves.includes('endeavor')) {
			num_fear++;
		} else if (mon.ability === 'magicbounce' || mon.moves.includes('rapidspin')) {
			num_anti_hazard++;
		}
	}
	if (num_fear >= 3 && num_anti_hazard >= 2) {
		// Don't even know why this needs to be a thing but sure
		team_tags.push('fear');
	}

	// Choiced
	let choice_items = ['choicescarf', 'choiceband', 'choicespecs'];
	let num_choiced = 0;
	for (let i = 0; i < team.length; i++) {
		let mon = team[i];
		if (choice_items.includes(mon.item) && mon.ability != 'klutz') {
			num_choiced++;
		}
	}
	if (num_choiced >= 4) {
		// Arbitrary number, but whatever
		team_tags.push('choice');
	}

	// SwagPlay
	let num_swagplayers = 0;
	for (let i = 0; i < team.length; i++) {
		let mon = team[i];
		if (mon.moves.includes('swagger') && mon.moves.includes('foulplay')) {
			num_swagplayers++;
		}
	}
	if (num_swagplayers >= 2) {
		// Arbitrary number, but whatever
		team_tags.push('swagplay');
	}

	// Monotype
	let types = getTypes(team[0].species, gen);
	if (types != undefined) {
		// You can't have a monotype team if one of ur mons has no types

		for (let i = 1; i < team.length; i++) {
			let mon = team[i];
			types = _.intersection(types, getTypes(mon.species, gen));
		}

		if (types != undefined) {
			// One of the mons on the way might also have no types

			for (let type of types) {
				team_tags.push(`mono${type.toLowerCase()}`)
			}
		}
	}

	// Stalliness Tags
	
	// Note that the distinction between bulky offense and balanced teams
	// have not been fully understood. Generally, it comes down to how much
	// offensive investment you give to your bulky mons.
	
	// In addition, semi-stall teams have also been more loosely defined.
	// The idea is that you get down hazards and like to play it slow, but
	// also have revenge killers to deal with offensive threats, which
	// kind of sounds like a balanced team to me but whatever, maybe
	// balanced has wallbreakers.
	if (total_stalliness <= -1.0) {
		team_tags.push('hyperoffense');
		if (_.intersection(team_tags, ['multiweather', 'allweather',
										 'weatherless']).length == 0){
											if (team_tags.includes('rain')) {
												team_tags.push('rainoffense');
											} else if (team_tags.includes('sun')) {
												team_tags.push('sunoffense');
											} else if (team_tags.includes('sand')) {
												team_tags.push('sandoffense');
											} else if (team_tags.includes('hail')) {
												team_tags.push('hailoffense');
											}
		}
	} else if (total_stalliness <= 0) {
		team_tags.push('offense');
	} else if (total_stalliness <= 1.0) {
		team_tags.push('balanced');
	} else if (total_stalliness <= Math.log2(3)) {
		team_tags.push('semistall');
	} else {
		team_tags.push('stall');
		if (_.intersection(team_tags, ['multiweather', 'allweather',
										 'weatherless']).length == 0){
											if (team_tags.includes('rain')) {
												team_tags.push('rainstall');
											} else if (team_tags.includes('sun')) {
												team_tags.push('sunstall');
											} else if (team_tags.includes('sand')) {
												team_tags.push('sandstall');
											} else if (team_tags.includes('hail')) {
												team_tags.push('hailstall');
											}
		}
	} 

	let team_stalliness: TeamStalliness = {
		total_bias: total_bias,
		total_stalliness: total_stalliness,
		team_tags: team_tags
	};

	return team_stalliness;
}

function getTypes(mon: string, gen: number = 8) : undefined | TypeName[] {
	const currentGen = new Generations(Dex).get(gen as GenerationNum);

	let pokemon_species = currentGen.species.get(mon);
	if (pokemon_species === undefined) {
		return undefined;
	}

	return pokemon_species.types;
}

export interface Stalliness {
	bias: number
	stalliness: number
}

interface TeamStalliness {
	total_bias: number
	total_stalliness: number
	team_tags: string[]
}
