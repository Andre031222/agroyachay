import { LandingShell } from "./LandingShell";
import { LandingNav } from "./LandingNav";
import { Hero } from "./Hero";
import { Bento } from "./Bento";
import { HowItWorks } from "./HowItWorks";
import { CtaBand, Footer } from "./Closing";

export function Landing() {
  return (
    <LandingShell>
      <LandingNav />
      <main id="main" data-lang-fade>
        <Hero />
        <Bento />
        <HowItWorks />
        <CtaBand />
      </main>
      <Footer />
    </LandingShell>
  );
}
