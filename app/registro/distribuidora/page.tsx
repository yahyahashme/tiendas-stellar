import { HomeNav } from "@/components/auth";
import { Slip } from "@/components/kit/layout";
import { T } from "@/lib/i18n";
import { DistributorForm } from "../distributor-form";

// A distributor signs up (#130), then waits for approval at /distribuidor/espera.
export default function DistributorSignUpPage() {
  return (
    <Slip>
      <HomeNav />
      <DistributorForm intro={<T es="Es gratis. Las tiendas nunca pagan comisiones." en="It's free. Shops never pay fees." />} />
    </Slip>
  );
}
