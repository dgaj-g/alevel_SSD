// The Methods Arcade: its registry and wording; everything else is the shared engine in arcade/engine/.
import { start } from '../../arcade/engine/shell.js';
import { ZONES, GAMES, findGame, nextGame } from './registry.js';

start({
  registry: { ZONES, GAMES, findGame, nextGame },
  storeKey: 'ssd-methods-arcade-v1',
  arcade: 'methods',
  titleA: 'METHODS', titleB: 'ARCADE',
  subtitle: 'AS Software Systems Development · Topic 3 · Methods',
  booklet: 'Topic 3 booklet',
  docTitle: 'Methods Arcade · AS Software Systems Development',
  shortTitle: 'Methods Arcade',
  footer: 'Our Lady\'s Grammar School, Newry · CCEA AS Software Systems Development, Unit 1 · Topic 3 Methods. Every game is built on the Topic 3 booklet; every C# output and error message shown was checked with the real compiler.',
  loadGame: (mod) => import(`./games/${mod}.js`),
});
