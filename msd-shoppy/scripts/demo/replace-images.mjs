// Remplace les photos des produits de démo par les versions sans inscription (chaque vendeur, avec sa propre session).
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const U = "https://anpmpveswepsfpdyewxv.supabase.co", K = "sb_publishable_s7b-VJdbIZrwZVwK6NiPMw_iqUcNzQq", IMG = process.argv[2];
const SELLERS = ["awa.couture", "moussa.tech", "fatou.beaute", "ibrahima.terroir"];
let n = 0;
for (const s of SELLERS) {
  const sb = createClient(U, K, { auth: { persistSession: false } });
  const { error } = await sb.auth.signInWithPassword({ email: `${s}@demo.msdshoppy.sn`, password: "DemoMSD2026" });
  if (error) throw error;
  const uid = (await sb.auth.getUser()).data.user.id;
  const shop = (await sb.from("shops").select("id").eq("owner_id", uid).single()).data;
  const { data: imgs } = await sb.from("product_images").select("id, url, product_id, products!inner(shop_id)").eq("products.shop_id", shop.id);
  for (const im of imgs) {
    const m = im.url.match(/products\/([a-z-]+)-(\d)-\d+\.webp$/); if (!m) continue;
    const path = `shops/${shop.id}/products/${m[1]}-${m[2]}-v2-${Date.now()}.webp`;
    const up = await sb.storage.from("media").upload(path, readFileSync(`${IMG}/${m[1]}-${m[2]}.webp`), { contentType: "image/webp", upsert: false });
    if (up.error) throw up.error;
    const r = await sb.from("product_images").update({ url: sb.storage.from("media").getPublicUrl(path).data.publicUrl }).eq("id", im.id);
    if (r.error) throw r.error; n++;
  }
}
console.log(`${n} photos remplacées`);
