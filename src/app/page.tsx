import { listTerms } from "@/lib/terms";
import LandingPage from "@/components/home/LandingPage";

export default async function HomePage() {
  const terms = await listTerms();

  return <LandingPage terms={terms} />;
}
