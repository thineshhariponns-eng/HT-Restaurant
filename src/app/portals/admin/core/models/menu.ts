export interface MenuCategory {
  id: string;
  name: string;
  /** Hidden categories stay in the admin but are not shown to customers. */
  visible: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  description: string;
  veg: boolean;
  /** Sold out tonight when false. */
  available: boolean;
}
