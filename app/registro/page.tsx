import { AltLink, HomeNav } from "@/components/auth";
import { ActionLink, ActionList } from "@/components/kit/button";
import { FormHead } from "@/components/kit/form";
import { Slip } from "@/components/kit/layout";
import { Paper } from "@/components/kit/paper";
import { T } from "@/lib/i18n";

// Sign-up starts with one question: a shop or a distributor. Each answer is its own page
// (/registro/tienda, /registro/distribuidora), so the phone's Back button comes back here.
export default function SignUp() {
  return (
    <Slip>
      <HomeNav />
      <FormHead title={<T es="Crear cuenta" en="Create account" />}>
        <T es="Es gratis. Las tiendas nunca pagan comisiones." en="It's free. Shops never pay fees." />
      </FormHead>

      <section aria-labelledby="who" className="flex flex-col gap-2 pt-1">
        <h2 id="who" className="text-lead font-bold">
          <T es="¿Qué es usted?" en="What are you?" />
        </h2>
        <ActionList>
          <ActionLink size="lg" href="/registro/tienda" title={<T es="Tienda" en="Shop" />} hint={<T es="Compro a distribuidores" en="I buy from distributors" />} />
          <ActionLink
            size="lg"
            href="/registro/distribuidora"
            title={<T es="Distribuidora" en="Distributor" />}
            hint={<T es="Vendo y entrego a tiendas" en="I sell and deliver to shops" />}
          />
        </ActionList>
      </section>

      <Paper className="flex flex-col gap-1.5 px-4 py-4">
        <h2 className="text-label font-bold uppercase tracking-[0.12em]">
          <T es="Motorista" en="Driver" />
        </h2>
        <p>
          <T es="Los motoristas se registran con la invitación de su distribuidora." en="Drivers sign up with their distributor's invite." />
        </p>
        <p className="text-muted">
          <T es="Pídale el enlace a su distribuidora y ábralo en este teléfono." en="Ask your distributor for the link and open it on this phone." />
        </p>
      </Paper>

      <AltLink question={<T es="¿Ya tiene cuenta?" en="Already have an account?" />} href="/entrar">
        <T es="Entrar" en="Sign in" />
      </AltLink>
    </Slip>
  );
}
