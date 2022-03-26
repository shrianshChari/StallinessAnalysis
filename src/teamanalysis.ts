import { PokemonSet } from "@pkmn/sets";
import { Dex, GenerationNum, StatsTable } from "@pkmn/dex";
import { Generations } from "@pkmn/data";
import { intersection } from "lodash";

// Copied from Antar1011's implementation in Python
// https://github.com/Antar1011/Smogon-Usage-Stats

// Default gen is SwSh
export function analyzePokemon(mon: PokemonSet, gen: number = 8): Stalliness | undefined { 
	const currentGen = new Generations(Dex).get(gen as GenerationNum);

	let pokemon_species = currentGen.species.get(mon.species);

	// Checking if the pokemon exists
	if (pokemon_species === undefined) {
		console.log('Your Pokemon doesn\'t seem to exist.');
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

		console.log(stats);
		let debug_damage =`Level: ${mon.level}\nOffense: ${off}\nDefense: ${def}\nBase Power: ${base_power}\nRoll: ${roll}\nRaw Damage: ${damage}\nHP: ${stats.hp}\nRaw Stalliness: ${stalliness}`; 
		console.log(debug_damage);
	}


	// Moveset modifications
	if (mon.ability === 'hugepower' || mon.ability === 'purepower') {
		stalliness -= 1;
	}
	let choice_items = ['choicescarf', 'choiceband', 'choicespecs'];
	if (choice_items.includes(mon.item) || mon.item === 'lifeorb') {
		stalliness -= 0.5;
	}
	if (mon.item === 'eviolite' && pokemon_species.prevo != undefined) {
		stalliness += 0.5;
	}
	if (mon.moves.includes('spikes')) {
		stalliness += 0.5;
	}
	if (mon.moves.includes('toxicspikes')) {
		stalliness += 0.5;
	}
	if (mon.moves.includes('toxic')) {
		stalliness += 1;
	}
	if (mon.moves.includes('willowisp')) {
		stalliness += 0.5;
	}

	let healing_moves = ['recover' ,'slackoff', 'healorder', 'milkdrink',
		'roost', 'moonlight', 'morningsun', 'synthesis', 'wish', 'aquaring',
		'rest', 'softboiled', 'swallow', 'leechseed'];
	if (intersection(mon.moves, healing_moves).length != 0) {
		stalliness += 1;
	}

	if (mon.ability === 'regenerator') {
		stalliness += 0.5;
	}
	
	let remove_status = ['healbell', 'aromatherapy'];
	if (intersection(mon.moves, remove_status).length != 0) {
		stalliness += 0.5;
	}

	let offensive_abilities = ['chlorophyll', 'download', 'hustle', 'moxie',
		'reckless', 'sandrush', 'solarpower', 'swiftswim', 'technician',
		'tintedlens', 'darkaura', 'fairyaura', 'infiltrator', 'parentalbond',
		'protean', 'strongjaw', 'sweetveil', 'toughclaws','aerilate',
		'normalize','pixilate','refrigerate'];
	if (intersection(mon.moves, offensive_abilities)) {
		stalliness -= 0.5;
	}

	let toxic_abilities = ['toxicboost', 'guts', 'quickfeet'];
	let burn_abilities = ['flareboost', 'guts', 'quickfeet'];
	if (toxic_abilities.includes(mon.ability) && mon.item === 'toxicorb') {
		stalliness -= 1;
	}
	if (burn_abilities.includes(mon.ability) && mon.item === 'flameorb') {
		stalliness -= 1;
	}

	let boosting_abilities = ['moody', 'speedboost'];
	if (boosting_abilities.includes(mon.ability)) {
		stalliness -= 1;
	}

	let trapping_abilities = ['arenatrap','magnetpull','shadowtag'];
	if (trapping_abilities.includes(mon.ability)) {
		stalliness -= 1;
	}

	let trapping_moves = ['block','meanlook','spiderweb','pursuit'];
	if (intersection(mon.moves, trapping_moves)) {
		stalliness -= 0.5;
	}

	let defensive_abilities = ['dryskin', 'filter', 'hydration', 'icebody',
		'intimidate', 'ironbarbs', 'marvelscale', 'naturalcure',
		'magicguard', 'multiscale', 'raindish', 'roughskin', 'solidrock',
		'thickfat', 'unaware', 'aromaveil', 'bulletproof', 'cheekpouch',
		'gooey'];
	if (intersection(mon.moves, defensive_abilities)) {
		stalliness += 0.5;
	}

	if (mon.ability === 'poisonheal' && mon.item === 'toxicorb') {
		stalliness += 0.5; // Gliscor moment
	}

	let hates_offense = ['slowstart','truant','furcoat'];
	if (hates_offense.includes(mon.ability)) {
		stalliness += 1;
	}

	let screens = ['reflect', 'lightscreen', 'auroraveil'];
	if (intersection(mon.moves, screens).length != 0 && mon.item === 'lightclay') {
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
		stalliness -= 2;
	}
	else if (mon.moves.includes('shellsmash')) {
		stalliness -= 1.5;
	}
	else if (intersection(mon.moves, twostage_boosters).length != 0) {
		stalliness -= 1;
	}
	else if (intersection(mon.moves, onestage_boosters).length != 0) {
		stalliness -= 0.5;
	}
	if (mon.moves.includes('substitute')) {
		stalliness -= 0.5;
	}

	let protection_moves = ['protect','detect','kingsshield','matblock','spikyshield']; // Include banefulbunker and obstruct
	if (intersection(mon.moves, protection_moves).length != 0) {
		stalliness += 1;
	}
	if (mon.moves.includes('endeavor')) {
		stalliness -= 1;
	}
	
	let halving_moves = ['superfang']; // Will want to include nature'smadness
	if (intersection(mon.moves, halving_moves).length != 0) {
		stalliness -= 0.5;
	}

	if (mon.moves.includes('trick') || mon.moves.includes('switcheroo')) {
		stalliness -= 0.5;
	}

	if (mon.moves.includes('psychoshift')) {
		stalliness += 0.5;
	}

	let phazing_moves = ['whirlwind', 'roar', 'circlethrow', 'dragontail'];
	if (intersection(mon.moves, phazing_moves).length != 0) {
		stalliness += 0.5;
	}

	if (mon.item === 'redcard') {
		stalliness += 0.5;
	}

	let clearing_moves = ['haze', 'clearsmog'];
	if (intersection(mon.moves, clearing_moves).length != 0) {
		stalliness += 0.5;
	}

	let paralysis_moves = ['thunderwave', 'stunspore', 'glare', 'nuzzle'];
	if (intersection(mon.moves, paralysis_moves).length != 0) {
		stalliness += 0.5;
	}

	let confusion_moves = ['supersonic', 'confuseray', 'swagger', 'flatter',
		'teeterdance', 'yawn'];
	if (intersection(mon.moves, confusion_moves).length != 0) {
		stalliness += 0.5;
	}
	
	let sleep_moves = ['darkvoid', 'grasswhistle', 'hypnosis', 'lovelykiss',
		'sing', 'sleeppowder', 'spore'];
	if (intersection(mon.moves, sleep_moves).length != 0) {
		stalliness -= 0.5;
	}

	if (mon.item === 'rockyhelmet') {
		stalliness += 0.5;
	}

	if (mon.item === 'weaknesspolicy') {
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
		stalliness -= 0.5;
	}

	if (mon.ability === 'harvest' || mon.moves.includes('recycle')) {
		stalliness += 1;
	}

	let recoil_moves = ['jumpkick', 'doubleedge', 'submission',
		'petaldance', 'hijumpkick', 'outrage', 'volttackle', 'closecombat',
		'flareblitz', 'bravebird', 'woodhammer', 'headsmash', 'headcharge',
		'wildcharge', 'takedown', 'dragonascent'];
	if (intersection(mon.moves, recoil_moves).length != 0) {
		stalliness -= 0.5;
	}

	let sacrifice_moves = ['selfdestruct', 'explosion', 'destinybond',
		'perishsong', 'memento', 'healingwish', 'lunardance', 'finalgambit'];
	if (intersection(mon.moves, sacrifice_moves).length != 0) {
		stalliness -= 1;
	}

	let ohko_moves = ['guillotine', 'fissure', 'sheercold', 'horndrill'];
	if (intersection(mon.moves, ohko_moves)) {
		stalliness -= 1; // You must be insane or playing AG
	}

	if (mon.ability === 'snowwarning' || mon.ability === 'sandstream' ||
			mon.moves.includes('hail') || mon.moves.includes('sandstorm')) {
		stalliness += 0.5;
	}

	if ((mon.species === 'latias' || mon.species === 'latios') &&
			mon.item === 'souldew') {
		if (gen >= 7) {
			stalliness -= 0.25; // Adamant/Lustrous Orb
		}
		else {
			stalliness -= 0.5; // Free CM boost
		}
	}
		
	if (mon.species === 'pikachu' && mon.item === 'lightball') {
		stalliness -= 1;
	}

	if ((mon.species === 'cubone' || mon.species === 'marowak') &&
			mon.item === 'thickclub') {
		stalliness -= 1;
	}

	if (mon.species === 'clamperl') {
		if (mon.item === 'deepseatooth') {
			stalliness -= 1;
		}
		else if (mon.item === 'deepseascale') {
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

		stalliness -= 0.25;
	}

	if (mon.species === 'dialga' && mon.item === 'adamantorb') {
		stalliness -= 0.25;
	}

	if (mon.species === 'palkia' && mon.item === 'lustrousorb') {
		stalliness -= 0.25;
	}

	if (mon.species === 'giratinaorigin' && mon.item === 'griseousorb') {
		stalliness -= 0.25; // I hope you have a Tina-O with a Griseous Orb
	}

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

export function analyzeTeam(team: PokemonSet[], gen: number = 8): TeamStalliness | undefined {
	let total_bias = 0;
	let total_stalliness: number = 0;
	let num_mons = 0;
	let team_tags: string[] = [];
	for (let i = 0; i < team.length; i++) {
		let mon = team[i];

		// Will want to include Mega Pokemon at some point
		// This includes Megas, Primals, Darm-Zen, and Meloetta-Pirouette

		let mon_stall = analyzePokemon(mon, gen);
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
			if(intersection(mon.moves, boosts).length > 0) {
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
		if (intersection(mon.moves, switch_moves).length != 0) {
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
				intersection(mon.moves, trapping_moves).length != 0) {
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
	// Will implement later
	
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
	// Will implement later
	
	// Monotype
	// Will implement later
	
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
		if (intersection(team_tags, ['multiweather', 'allweather',
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
		if (intersection(team_tags, ['multiweather', 'allweather',
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

export interface Stalliness {
	bias: number
	stalliness: number
}

interface TeamStalliness {
	total_bias: number
	total_stalliness: number
	team_tags: string[]
}
