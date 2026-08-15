import type { FaqGroup } from "@/components/pages/FaqAccordion";

export const FAQ_GROUPS: FaqGroup[] = [
  {
    category: "Shopping for a car",
    items: [
      {
        question: "How do I search for vehicles?",
        answer:
          "Use the search bar on the homepage or the Find Cars page to filter by make, model, year, and price. On the results page you can narrow further by mileage, body style, condition, state, and dealer rating.",
      },
      {
        question: "Is AutoSalesReviews free to use?",
        answer:
          "Yes. Searching vehicles, reading reviews, and comparing dealer ratings is completely free for car buyers, with no account required.",
      },
      {
        question: "How do I contact a dealer about a car?",
        answer:
          'Open any vehicle page and use "Book This Car" or "Book a Test Drive" under the photo gallery to reach the dealership. You can also call the dealer from their profile card.',
      },
      {
        question: "Can I save vehicles I'm interested in?",
        answer:
          "Yes. Tap Save on any listing to add it to your Saved Vehicles shortlist. Saves are stored on our servers for this browser (no account required). When you create an account later, we can merge them into your profile.",
      },
    ],
  },
  {
    category: "Dealer ratings & reviews",
    items: [
      {
        question: "How are dealer ratings calculated?",
        answer:
          "We combine Google ratings with our own verified customer reviews into a single average score, and show each dealer's Yelp rating alongside it, so you get the full picture at a glance.",
      },
      {
        question: "Can a dealership remove a negative review?",
        answer:
          "No. Dealers can respond publicly to reviews, but they cannot delete or suppress honest feedback from verified buyers.",
      },
      {
        question: "How do I write a review for a dealership?",
        answer:
          'Open any dealer profile and select "Write a Review," or use the Write a Review page to search for the dealership first.',
      },
    ],
  },
  {
    category: "Coverage & dealerships",
    items: [
      {
        question: "Which areas do you cover?",
        answer:
          "We cover dealerships nationwide, with coverage expanding regularly. Filter by state or city to find inventory near you, or search anywhere in the country.",
      },
      {
        question: "How do I list my dealership?",
        answer:
          'Visit the "List Your Dealership" page to get started. You can showcase your inventory, respond to reviews, and reach thousands of local buyers.',
      },
      {
        question: "Is the inventory up to date?",
        answer:
          "Dealers manage their own listings. We strive for accuracy but always recommend confirming availability and price directly with the dealership before visiting.",
      },
    ],
  },
];

/** Flat list of all FAQ items for schema markup. */
export function getAllFaqItems() {
  return FAQ_GROUPS.flatMap((group) => group.items);
}
