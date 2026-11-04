// Every pupil line the shell adds in embed mode. Spec section 10.
export const S = {
  locked: 'Your teacher opens this part in class.',
  saved: 'Your stars are saved to your school account.',
  saving: 'Saving…',
  savedFirst: 'Saved. This is your first score for this game.',
  savedAgain: (first, best, max) => `Saved. First score ${first} of ${max}, best ${best} of ${max}.`,
  failed: 'Could not reach the school server. Your score is kept on this machine and will send when the connection returns.',
  tooFast: 'That run was too quick to count. Play it again to save a score.',
  lockedRun: 'Your teacher has locked this part, so this score was not saved.',
  allGames: 'All games',
  carry: 'Carry on',
  anyAgain: 'Play any game again',
  loading: 'Loading your saved stars…',
  hello: (name) => `Hello, ${name}.`,
  banner: 'Your stars are only saved on this device here. Open this topic from the AS SSD platform so they are saved to your account:',
  bannerUrl: 'https://dgaj-g.github.io/alevel_SSD/as/',
};
