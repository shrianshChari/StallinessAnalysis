# StallinessAnalysis
### How to Use:
Copy your team's paste from Showdown/Pokepaste into a file on your computer. Then, navigate into the root directory of this folder in the terminal and run:
```bash
tsc
node out/index.js -i <path/to/filename>
```
and the code will analyse the stalliness of the team you have given (and the file contains your team copied from Pokemon Showdown).

##### Specifying arguments 

To adjust the generation which is getting analyzed, include the `-g` flag, followed by the generation number (1-8). The default gen is 8:
```bash
node out/index.js -i <path/to/filename> -g <gen \#>
```
if you're analyzing a team for Brilliant Diamond and Shining Pearl, you should analyze with respect to generation 7, not 8 (unless gen 1-4 mons got stat buffs after USUM).

Also, if you include the `-v` flag, then the program will tell you more info about the calculation process, including each Pokemon's calculated stats and the modifiers that change their scores.

### WIP
- [ ] Explanation of [Antar's work](https://pokemetrics.wordpress.com/)
- [ ] Update analysis with latest moves
- [x] Gettings [yargs](https://yargs.js.org/) working
