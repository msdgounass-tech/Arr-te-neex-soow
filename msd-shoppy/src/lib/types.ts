export type SubscriptionStatus = "trial" | "active" | "pending_payment" | "expired" | "suspended";
export type ProductStatus = "draft" | "published" | "hidden";
export type Availability = "in_stock" | "out_of_stock" | "on_order";
export type OrderStatus = "pending" | "confirmed" | "refused" | "preparing" | "shipped" | "delivered" | "completed" | "cancelled";
export type DeliveryMethod = "delivery" | "pickup" | "shipping";
export type EventType = "shop_view" | "product_view" | "call_click" | "whatsapp_click" | "share_click" | "favorite_add";

export interface Domain { id: number; slug: string; name: string; icon: string; position: number }
export interface Category { id: number; domain_id: number; parent_id: number | null; slug: string; name: string; position: number }
export interface Region { id: number; country_code: string; name: string }

export interface Shop {
  id: string; owner_id: string; slug: string; name: string; logo_url: string | null; cover_url: string | null;
  description: string; domain_id: number; country_code: string; region: string; city: string; address_public: string | null;
  public_phone: string | null; public_whatsapp: string | null; public_email: string | null; return_policy: string | null;
  is_published: boolean; verified_at: string | null; created_at: string; is_demo?: boolean;
}

export interface ProductImage { id: string; product_id: string; url: string; width: number; height: number; position: number }
export interface ProductVariant {
  id: string; product_id: string; size: string | null; color: string | null; model: string | null; sku: string | null;
  price: number | null; stock: number | null; active: boolean; position: number;
}
export interface Product {
  id: string; shop_id: string; slug: string; title: string; description: string; price: number; compare_at_price: number | null;
  category_id: number | null; sku: string | null; status: ProductStatus; availability: Availability; stock: number | null;
  quality_score: number; published_at: string | null; created_at: string; updated_at: string;
}
export type ProductCardData = Pick<Product, "id" | "slug" | "title" | "price" | "compare_at_price" | "availability"> & {
  image: ProductImage | null;
  shop: Pick<Shop, "id" | "slug" | "name" | "city" | "is_demo">;
};

export interface DeliveryZone {
  id: string; shop_id: string; name: string; method: DeliveryMethod; regions: string[]; fee: number | null;
  min_days: number; max_days: number; active: boolean;
}

export interface Order {
  id: string; number: string; buyer_id: string; shop_id: string; status: OrderStatus; subtotal: number; delivery_fee: number | null;
  total: number; delivery_method: DeliveryMethod; delivery_label: string | null; recipient_name: string; phone: string; region: string;
  city: string; address_details: string; note: string; payment_method: string; created_at: string; responded_at: string | null;
  completed_at: string | null; cancelled_at: string | null; status_note: string | null;
}
export interface OrderItem {
  id: string; order_id: string; product_id: string | null; variant_id: string | null; title: string; variant_label: string | null;
  sku: string | null; image_url: string | null; unit_price: number; quantity: number; line_total: number;
}
export interface OrderEvent { id: number; order_id: string; status: OrderStatus; actor: "buyer" | "seller" | "system"; note: string | null; created_at: string }

export interface Subscription { shop_id: string; status: SubscriptionStatus; trial_ends_at: string; current_period_end: string | null; plan_code: string | null }
export interface SubscriptionPayment { id: string; method: string; reference: string; status: "pending" | "validated" | "rejected"; created_at: string; amount: number | null }
export interface SubscriptionPlan { code: string; name: string; price_xof: number | null; period_days: number; active: boolean }

export interface Trust {
  completed_orders: number; reviews_count: number; average_rating: number | null; member_since: string; days_active: number;
  verified: boolean; response_rate: number | null; avg_response_hours: number | null; badges: string[];
}
export interface Review { id: string; order_id: string; shop_id: string; rating: number; comment: string; created_at: string }
export interface Notification {
  id: string; kind: "order" | "subscription" | "shop" | "tip" | "announcement"; title: string; body: string; link: string | null;
  is_promotional: boolean; read_at: string | null; created_at: string;
}
export interface Profile { id: string; full_name: string; phone: string | null; avatar_url: string | null; notify_promotions: boolean }
export interface Address {
  id: string; user_id: string; label: string; recipient_name: string; phone: string; country_code: string; region: string;
  city: string; details: string; is_default: boolean;
}
export interface SellerStats {
  days: number; shop_views: number; product_views: number; calls: number; whatsapp: number; shares: number; favorites: number;
  orders: number; completed_orders: number; revenue_completed: number;
  series: { day: string; views: number; orders: number }[];
  top_products: { id: string; title: string; views: number }[];
}
