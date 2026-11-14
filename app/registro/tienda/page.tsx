import { HomeNav } from "@/components/auth";
import { Slip } from "@/components/kit/layout";
import { ShopSignUp } from "@/components/shop-signup";
import { T } from "@/lib/i18n";

// A shop owner signs up on their own (#134). The steps are in components/shop-signup.tsx.
export default function ShopSignUpPage() {
  return (
    <Slip>
      <HomeNav />
      <ShopSignUp intro={<T es="Es gratis. Las tiendas nunca pagan comisiones." en="It's free. Shops never pay fees." />} />
    </Slip>
  );
}
