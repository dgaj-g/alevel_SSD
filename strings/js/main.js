// Topic 4 · String manipulation: arcade entry. The engine is shared with the Methods Arcade.
import { start } from '../../arcade/engine/shell.js';
import { ZONES, GAMES, findGame, nextGame } from './registry.js';
import { STRINGS } from './strings.js';

start({
  registry: { ZONES, GAMES, findGame, nextGame },
  storeKey: 'ssd-strings-arcade-v1',
  arcade: 'strings',
  titleA: 'Topic 4 · ',
  titleB: 'String manipulation',
  subtitle: STRINGS.subtitle,
  booklet: 'Topic 4 booklet',
  docTitle: 'Topic 4 · String manipulation',
  shortTitle: 'String manipulation',
  footer: 'AS Software Systems Development · Topic 4.',
  loadGame: (mod) => import(`./games/${mod}.js`),
});
