export type Gender = "homme" | "femme" | "unisexe";
export type UserRole = "customer" | "staff" | "manager" | "admin";
export type OrderStatus = "en_attente" | "confirmee" | "en_preparation" | "expediee" | "livree" | "annulee";
export type PaymentStatus = "en_attente" | "initie" | "reussi" | "echoue" | "annule" | "rembourse";
export type PaymentMethod = "wave" | "orange_money" | "carte" | "livraison";

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  gender: Gender | null;
  is_accessory: boolean;
  description: string | null;
  image_url: string | null;
  position: number;
  is_active: boolean;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  image_url: string | null;
  is_featured: boolean;
  is_exclusive: boolean;
  is_active: boolean;
  position: number;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface CategoryNode extends Category {
  children: Category[];
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  position: number;
  storage_path?: string | null;
}

export interface ProductVariant {
  id: string;
  size: string | null;
  color: string | null;
  color_hex: string | null;
  sku: string;
  price_override: number | null;
  position: number;
  is_active: boolean;
  inventory: { quantity: number } | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  reference: string;
  description: string | null;
  details: string | null;
  gender: Gender;
  price: number;
  compare_at_price: number | null;
  is_featured: boolean;
  is_new: boolean;
  is_active: boolean;
  created_at: string;
  category_id: string | null;
  collection_id: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  tags?: string[];
  /** Marque (Apple, Samsung…) — saisie dans l'admin. */
  brand?: string | null;
  /** Caractéristiques techniques réelles saisies dans l'admin. */
  specs?: ProductSpec[];
  category: (Pick<Category, "id" | "name" | "slug" | "gender"> & { parent_id?: string | null }) | null;
  collection?: Pick<Collection, "id" | "name" | "slug"> | null;
  product_images: ProductImage[];
  product_variants: ProductVariant[];
}

export interface DeliveryZone {
  id: string;
  name: string;
  slug: string;
  fee: number;
  free_above: number | null;
  delay: string | null;
  position: number;
  is_active: boolean;
  fee_mode: "fixed" | "distance" | "quote";
  per_km_fee: number;
  max_km: number | null;
}

export interface OrderItem {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  reference: string | null;
  sku: string | null;
  size: string | null;
  color: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Order {
  id: string;
  order_number: string;
  access_token?: string;
  user_id: string | null;
  status: OrderStatus;
  customer_name: string;
  email: string | null;
  phone: string;
  whatsapp: string | null;
  address_line: string;
  city: string;
  region: string | null;
  zone_name: string | null;
  notes: string | null;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  coupon_code: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  delivery_km?: number | null;
  delivery_fee_pending?: boolean;
  order_items?: OrderItem[];
  order_status_history?: { id: string; status: OrderStatus; note: string | null; created_at: string }[];
  deliveries?: { status: string; carrier: string | null; tracking_number: string | null; shipped_at: string | null; delivered_at: string | null } | null;
}

export interface StoreSettings {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  opening_hours: string;
}

export interface HomeSettings {
  hero_image: string;
  men_image: string;
  women_image: string;
  accessories_image: string;
  editorial_image: string;
  announcement: string;
  logo_url: string;
}

export interface DeliverySettings {
  origin_lat: string;
  origin_lng: string;
  road_factor: string;
}

export interface PaymentSettings {
  wave_link: string;
  orange_money_link: string;
}
