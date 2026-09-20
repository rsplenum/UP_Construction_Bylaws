/**
 * The words this actually runs on, in the language they are spoken in.
 *
 * Every term of art here is a Hindi word that the interface has been printing only in
 * English. A reader in Lucknow does not ask for a "sanctioned building plan", they ask
 * about their *naksha*; the officer does not offer "compounding", he offers
 * *shamniyakaran*; and nobody at a property desk says "square yards".
 *
 * This is not a translation layer and does not pretend to be one — translating the whole
 * interface is a larger job, and a half-translated screen reads worse than an English one.
 * What it does is make sure that where a statutory term appears, the word the reader would
 * use appears with it, once, so they can tell that the screen is about their situation.
 */

export interface Term {
  readonly id: string;
  /** What the byelaws call it, in English. */
  readonly english: string;
  /** What a person in Uttar Pradesh calls it. */
  readonly hindi: string;
  /** The Hindi word in Latin script, as it is usually written in an English sentence. */
  readonly roman: string;
  readonly gloss: string;
}

export const TERMS: readonly Term[] = [
  {
    id: 'sanctioned_plan', english: 'Sanctioned building plan',
    hindi: 'नक्शा', roman: 'naksha',
    gloss: 'The approved map. "Naksha paas hona" is the whole approval question in one word.',
  },
  {
    id: 'compounding', english: 'Compounding',
    hindi: 'शमनीकरण', roman: 'shamniyakaran',
    gloss: 'Paying to have a deviation forgiven after it is built. Chapter 16.',
  },
  {
    id: 'far', english: 'Floor Area Ratio',
    hindi: 'फ्लोर एरिया रेशो', roman: 'FAR',
    gloss: 'Total floor area you may build, as a multiple of the plot area.',
  },
  {
    id: 'setback', english: 'Setback',
    hindi: 'सेटबैक', roman: 'setback',
    gloss: 'The open margin that must be left on each side of the plot.',
  },
  {
    id: 'gaj', english: 'Square yard',
    hindi: 'गज', roman: 'gaj',
    gloss: 'Nine square feet. How plots are bought and sold across northern India.',
  },
  {
    id: 'biswa', english: 'Biswa',
    hindi: 'बिस्वा', roman: 'biswa',
    gloss: '151.25 gaj, and the same figure everywhere in Uttar Pradesh — unlike the bigha.',
  },
  {
    id: 'bigha', english: 'Bigha',
    hindi: 'बीघा', roman: 'bigha',
    gloss: 'Between 5 and 20 biswa depending on the district. Ask which one before you agree a price.',
  },
];

export function term(id: string): Term | undefined {
  return TERMS.find((t) => t.id === id);
}
