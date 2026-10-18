// Agent Kira's operating teams. Shared by the console UI and the server-side
// insights/chat code, so it must stay free of server-only imports.

export type TeamId =
  | 'social'
  | 'conversion'
  | 'recommendations'
  | 'trending'
  | 'research'
  | 'pricing'
  | 'stock'
  | 'web'
  | 'orders'
  | 'care'
  | 'engineering';

export type DepartmentId = 'growth' | 'merchandising' | 'operations';

export type TeamMember = { role: string; does: string };

export type TeamConfig = {
  id: TeamId;
  name: string;
  short: string;
  department: DepartmentId;
  mission: string;
  /** Short team code shown in the console, e.g. G-01 */
  code: string;
  /** lucide-react icon name, resolved in the UI */
  icon: string;
  members: TeamMember[];
  questions: string[];
  /** Words that route a question to this team (whole words, lower-case). */
  keywords: RegExp;
};

export const DEPARTMENTS: { id: DepartmentId; name: string; purpose: string }[] = [
  { id: 'growth', name: 'Growth', purpose: 'Bring shoppers in and turn them into orders' },
  { id: 'merchandising', name: 'Merchandising', purpose: 'The right products, at the right price, in stock' },
  { id: 'operations', name: 'Experience & operations', purpose: 'A smooth site, fast fulfilment, happy customers' },
];

export const TEAMS: TeamConfig[] = [
  {
    id: 'social',
    code: 'G-01',
    name: 'Social media marketing',
    short: 'Social',
    department: 'growth',
    mission: 'Find which channels and campaigns bring paying customers, and where to push next.',
    icon: 'Megaphone',
    members: [
      { role: 'Campaign lead', does: 'Plans what to promote and where' },
      { role: 'Channel analyst', does: 'Tracks orders by Facebook, Instagram, Google, TikTok…' },
      { role: 'Promo manager', does: 'Watches coupon codes and their redemptions' },
    ],
    questions: [
      'Which social channels brought the most orders this month?',
      'Which coupon is performing best, and what campaign should we run next?',
    ],
    keywords: /\b(social|facebook|instagram|tiktok|whatsapp|youtube|snapchat|marketing|campaign\w*|ads?|channel\w*|coupon\w*|promo\w*|influencer\w*|referral\w*)\b/,
  },
  {
    id: 'conversion',
    code: 'G-02',
    name: 'Conversion',
    short: 'Conversion',
    department: 'growth',
    mission: 'Turn visitors into buyers: watch the funnel and remove checkout friction.',
    icon: 'Target',
    members: [
      { role: 'Funnel lead', does: 'Follows view → cart → checkout → order' },
      { role: 'Checkout specialist', does: 'Finds where checkouts stall' },
      { role: 'Tracking analyst', does: 'Checks that conversion events fire correctly' },
    ],
    questions: [
      'Walk me through our conversion funnel for the last 30 days.',
      'Where are customers dropping off in checkout, and what should we fix first?',
    ],
    keywords: /\b(conversion\w*|convert\w*|funnel|checkout\w*|abandon\w*|drop[- ]?off|cart|carts|purchase\w*)\b/,
  },
  {
    id: 'recommendations',
    code: 'G-03',
    name: 'Recommendations',
    short: 'Recommendations',
    department: 'growth',
    mission: 'Grow basket size with “bought together” and smart cross-sells.',
    icon: 'Sparkles',
    members: [
      { role: 'Bundle lead', does: 'Finds products bought together' },
      { role: 'Basket analyst', does: 'Tracks items per order and multi-item orders' },
      { role: 'Cross-sell planner', does: 'Suggests pairings to show on product pages' },
    ],
    questions: [
      'Which products are most often bought together?',
      'How can we increase the number of items per order?',
    ],
    keywords: /\b(recommend\w*|bundle\w*|together|cross[- ]?sell\w*|upsell\w*|basket\w*|pair\w*)\b/,
  },
  {
    id: 'trending',
    code: 'G-04',
    name: 'Trending',
    short: 'Trending',
    department: 'growth',
    mission: 'Spot what is heating up week over week before it sells out.',
    icon: 'Flame',
    members: [
      { role: 'Trend lead', does: 'Compares this week’s sales with last week' },
      { role: 'Homepage curator', does: 'Keeps “Trending now” and hot deals fresh' },
      { role: 'Demand watcher', does: 'Flags risers that are running low' },
    ],
    questions: [
      'Which products are trending up this week?',
      'What should we feature in Trending now on the homepage?',
    ],
    keywords: /\b(trend\w*|rising|hot|viral|popular|this week|week over week)\b/,
  },
  {
    id: 'research',
    code: 'M-01',
    name: 'Product research',
    short: 'Research',
    department: 'merchandising',
    mission: 'Know what sells, what doesn’t, and what to add or drop.',
    icon: 'FlaskConical',
    members: [
      { role: 'Research lead', does: 'Ranks best and worst performers' },
      { role: 'Catalog analyst', does: 'Finds products with no sales' },
      { role: 'Launch tracker', does: 'Follows how new products perform' },
    ],
    questions: [
      'What are our best-selling products and which ones are not selling?',
      'How are the products we added recently performing?',
    ],
    keywords: /\b(research|best[- ]?sell\w*|top sell\w*|bestseller\w*|not selling|slow|catalog\w*|catalogue|new products?|launch\w*|products?)\b/,
  },
  {
    id: 'pricing',
    code: 'M-02',
    name: 'Best pricing',
    short: 'Pricing',
    department: 'merchandising',
    mission: 'Keep every product correctly priced in all six countries, with smart discounts.',
    icon: 'BadgeDollarSign',
    members: [
      { role: 'Pricing lead', does: 'Reviews prices and discounts' },
      { role: 'Country price auditor', does: 'Finds products missing a price in a GCC country' },
      { role: 'Margin watcher', does: 'Tracks average order value' },
    ],
    questions: [
      'Which products are missing a price in some countries?',
      'How many products are discounted and by how much on average?',
    ],
    keywords: /\b(pric\w*|discount\w*|sale price|margin\w*|aov|average order|cheap\w*|expensive|currency)\b/,
  },
  {
    id: 'stock',
    code: 'M-03',
    name: 'Stock management',
    short: 'Stock',
    department: 'merchandising',
    mission: 'Prevent stock-outs and plan restocks before sales are lost.',
    icon: 'Boxes',
    members: [
      { role: 'Inventory lead', does: 'Owns stock levels across stores' },
      { role: 'Stock-out watcher', does: 'Flags products at zero' },
      { role: 'Restock planner', does: 'Prioritises what to reorder first' },
    ],
    questions: [
      'Which products are out of stock or running low?',
      'What should we restock first?',
    ],
    keywords: /\b(stock\w*|inventory|restock\w*|reorder\w*|warehouse|out of stock|sku|skus|supply)\b/,
  },
  {
    id: 'web',
    code: 'O-01',
    name: 'Website UI & analytics',
    short: 'Web & UI',
    department: 'operations',
    mission: 'Make the storefront easy to shop, backed by how visitors actually use it.',
    icon: 'MonitorSmartphone',
    members: [
      { role: 'UX lead', does: 'Reviews how shoppers move through the site' },
      { role: 'Analytics engineer', does: 'Owns tracking: views, searches, add-to-cart' },
      { role: 'Search analyst', does: 'Finds searches that return nothing' },
    ],
    questions: [
      'How are visitors using the website this month?',
      'Which searches return no results, and what should we add?',
    ],
    keywords: /\b(website|site|ui|ux|design|page views?|analytics|traffic|visitor\w*|search\w*|mobile|seo|navigation)\b/,
  },
  {
    id: 'orders',
    code: 'O-02',
    name: 'Orders & fulfilment',
    short: 'Orders',
    department: 'operations',
    mission: 'Confirm, pack and deliver every order on time.',
    icon: 'Truck',
    members: [
      { role: 'Fulfilment lead', does: 'Owns the order pipeline' },
      { role: 'Confirmation desk', does: 'Clears orders waiting for confirmation' },
      { role: 'Delivery tracker', does: 'Follows shipments in transit' },
    ],
    questions: [
      'How many orders are waiting for confirmation right now?',
      'How is our delivery pipeline looking?',
    ],
    keywords: /\b(orders?|fulfil\w*|fulfill\w*|deliver\w*|ship\w*|courier\w*|transit|confirm\w*|dispatch\w*|cancel\w*)\b/,
  },
  {
    id: 'care',
    code: 'O-03',
    name: 'Customer care & reviews',
    short: 'Care',
    department: 'operations',
    mission: 'Keep customers happy, coming back, and leaving good reviews.',
    icon: 'HeartHandshake',
    members: [
      { role: 'Care lead', does: 'Owns customer satisfaction' },
      { role: 'Reviews analyst', does: 'Tracks ratings and what customers say' },
      { role: 'Retention specialist', does: 'Watches repeat customers and returns' },
    ],
    questions: [
      'How satisfied are our customers based on reviews?',
      'How many customers come back to order again?',
    ],
    keywords: /\b(customer\w*|review\w*|rating\w*|satisf\w*|happy|complain\w*|return\w*|refund\w*|repeat|loyal\w*|retention|care|support)\b/,
  },
  {
    id: 'engineering',
    code: 'O-04',
    name: 'Engineering & performance',
    short: 'Engineering',
    department: 'operations',
    mission: 'Keep the site fast and bug-free: watch real-user speed, catch errors, follow shoppers’ footprints.',
    icon: 'Wrench',
    members: [
      { role: 'Engineering lead', does: 'Owns site reliability and fixes priorities' },
      { role: 'Performance engineer', does: 'Tracks real-user page speed (LCP, INP, CLS, TTFB)' },
      { role: 'Bug hunter', does: 'Collects JavaScript errors from shoppers’ browsers' },
      { role: 'Journey analyst', does: 'Follows user footprints to find dead ends' },
    ],
    questions: [
      'Are there any bugs or errors on the website right now?',
      'How fast is the website for real shoppers, and which pages are slowest?',
    ],
    keywords: /\b(bugs?|errors?|crash\w*|broken|exceptions?|engineer\w*|developer\w*|speed|slow\w*|fast|performance|lcp|inp|cls|ttfb|vitals|load\w*|footprint\w*|journey\w*|sessions?|uptime|reliab\w*)\b/,
  },
];

export const TEAM_BY_ID: Record<TeamId, TeamConfig> = Object.fromEntries(TEAMS.map((t) => [t.id, t])) as Record<TeamId, TeamConfig>;

/** Pick the team best suited to a question (first match by priority order). */
export function routeQuestion(text: string): TeamId {
  const q = text.toLowerCase();
  const priority: TeamId[] = ['engineering', 'stock', 'pricing', 'social', 'recommendations', 'trending', 'conversion', 'care', 'orders', 'web', 'research'];
  for (const id of priority) if (TEAM_BY_ID[id].keywords.test(q)) return id;
  return 'research';
}
