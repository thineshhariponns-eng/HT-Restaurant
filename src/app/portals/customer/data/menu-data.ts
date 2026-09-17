export type CategoryName = 'Biryani' | 'Starters' | 'Main Course' | 'Beverages';

export interface MenuDish {
  slug: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  category: CategoryName;
}

export const CATEGORY_ORDER: CategoryName[] = ['Biryani', 'Starters', 'Main Course', 'Beverages'];

export function categorySlug(category: CategoryName): string {
  return category.toLowerCase().replace(/\s+/g, '-');
}

/** Mock menu data — no backend yet. Names, prices and availability are placeholders. */
export const MENU_DISHES: MenuDish[] = [
  {
    slug: 'erode-special-biryani',
    name: 'Erode Special Biryani',
    description: 'Slow-cooked basmati layered with a house masala and caramelized onions, finished over charcoal.',
    price: 260,
    isVeg: false,
    isAvailable: true,
    category: 'Biryani'
  },
  {
    slug: 'mutton-kondattam-biryani',
    name: 'Mutton Kondattam Biryani',
    description: 'Bone-in mutton, long-grain rice and a Kongu-style dry-chilli masala.',
    price: 320,
    isVeg: false,
    isAvailable: true,
    category: 'Biryani'
  },
  {
    slug: 'veg-dum-biryani',
    name: 'Veg Dum Biryani',
    description: 'Seasonal vegetables and paneer layered with saffron rice, sealed and slow-steamed.',
    price: 210,
    isVeg: true,
    isAvailable: true,
    category: 'Biryani'
  },
  {
    slug: 'chilli-baby-corn',
    name: 'Chilli Baby Corn',
    description: 'Batter-fried baby corn tossed in a sweet-spiced chilli glaze.',
    price: 180,
    isVeg: true,
    isAvailable: true,
    category: 'Starters'
  },
  {
    slug: 'pepper-chicken-dry',
    name: 'Pepper Chicken Dry',
    description: 'Diced chicken seared with crushed black pepper and curry leaf.',
    price: 240,
    isVeg: false,
    isAvailable: true,
    category: 'Starters'
  },
  {
    slug: 'gobi-65',
    name: 'Gobi 65',
    description: 'Crisp-fried cauliflower tossed with curry leaf, ginger and dry red chilli.',
    price: 170,
    isVeg: true,
    isAvailable: false,
    category: 'Starters'
  },
  {
    slug: 'butter-chicken',
    name: 'Butter Chicken',
    description: 'Tandoor-grilled chicken simmered in a mildly spiced tomato-butter gravy.',
    price: 280,
    isVeg: false,
    isAvailable: true,
    category: 'Main Course'
  },
  {
    slug: 'paneer-tikka-masala',
    name: 'Paneer Tikka Masala',
    description: 'Charred paneer cubes in a rich onion-tomato masala with fresh cream.',
    price: 220,
    isVeg: true,
    isAvailable: true,
    category: 'Main Course'
  },
  {
    slug: 'erode-karuveppilai-sadam',
    name: 'Erode Karuveppilai Sadam',
    description: 'Curry-leaf rice tempered with mustard, lentils and roasted cashew.',
    price: 160,
    isVeg: true,
    isAvailable: true,
    category: 'Main Course'
  },
  {
    slug: 'chettinad-chicken-curry',
    name: 'Chettinad Chicken Curry',
    description: 'Chicken simmered in a roasted Chettinad spice blend with coconut and shallots.',
    price: 270,
    isVeg: false,
    isAvailable: true,
    category: 'Main Course'
  },
  {
    slug: 'masala-chaas',
    name: 'Masala Chaas',
    description: 'Chilled spiced buttermilk with curry leaf and roasted cumin.',
    price: 60,
    isVeg: true,
    isAvailable: true,
    category: 'Beverages'
  },
  {
    slug: 'filter-coffee',
    name: 'Filter Coffee',
    description: 'South Indian filter coffee, brewed strong and served with hot milk.',
    price: 50,
    isVeg: true,
    isAvailable: true,
    category: 'Beverages'
  },
  {
    slug: 'fresh-lime-soda',
    name: 'Fresh Lime Soda',
    description: 'Fresh lime juice with soda, served sweet, salted or mixed.',
    price: 70,
    isVeg: true,
    isAvailable: false,
    category: 'Beverages'
  }
];
