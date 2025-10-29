export const STORES = {
  checkers: {
    name: 'Checkers',
    slug: 'checkers',
    logo: '/logos/checkers.png',
    dataAiHint: 'Checkers logo',
    description: 'Your one-stop shop for groceries and more.',
  },
  shoprite: {
    name: 'Shoprite',
    slug: 'shoprite',
    logo: '/logos/shoprite.png',
    dataAiHint: 'Shoprite logo',
    description: 'Low prices you can trust, always.',
  },
  spar: {
    name: 'Spar',
    slug: 'spar',
    logo: '/logos/spar.png',
    dataAiHint: 'Spar logo',
    description: 'Your local supermarket for convenience and value.',
  },
  woolworths: {
    name: 'Woolworths',
    slug: 'woolworths',
    logo: '/logos/woolworths.png',
    dataAiHint: 'Woolworths logo',
    description: 'Quality, style and value you can always depend on.',
  },
  'pick-n-pay': {
    name: 'Pick n Pay',
    slug: 'pick-n-pay',
    logo: '/logos/pick-n-pay.png',
    dataAiHint: 'Pick n Pay logo',
    description: 'Inspired by you. Fresh food and groceries.',
  },
  game: {
    name: 'Game',
    slug: 'game',
    logo: '/logos/game.png',
    dataAiHint: 'Game logo',
    description: "You've got Game.",
  },
  makro: {
    name: 'Makro',
    slug: 'makro',
    logo: '/logos/makro.png',
    dataAiHint: 'Makro logo',
    description: 'Big on life.',
  },
} as const;

export type StoreSlug = keyof typeof STORES;
