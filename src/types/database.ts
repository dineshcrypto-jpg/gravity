export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  is_hidden?: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  weight?: string | null;
  image_url: string | null;
  is_in_stock: boolean;
  offer?: string | null;
  created_at: string;
  varieties?: Variety[];
  categories?: { name: string; slug: string };
};

export type Variety = {
  id: string;
  product_id: string;
  name: string;
  label: string;
  price: number;
  weight?: string | null;
  image_url?: string | null;
  is_in_stock?: boolean;
  offer?: string | null;
};

export type OrderItem = {
  product_id?: string;
  product_name: string;
  variety_label: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  created_at: string;
  user_id?: string;
  items: OrderItem[];
  total: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_landmark: string | null;
  status: string;
};

export type Review = {
  id: string;
  product_id: string;
  user_id?: string | null;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

export type Offer = {
  id: string;
  title: string;
  description: string;
  badge?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  product_id?: string | null;
  variety_id?: string | null;
  is_active: boolean;
  created_at?: string;
};
