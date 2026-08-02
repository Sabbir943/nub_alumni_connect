import dynamic from "next/dynamic";
import Banner from "@/component/Banner";

const HighlightReviews = dynamic(() => import("@/component/HighlightReviews"), {
  loading: () => <div className="h-96 bg-zinc-50 animate-pulse" />,
});
const ImpactSection = dynamic(() => import("@/component/ImpactSection"), {
  loading: () => <div className="h-96 bg-zinc-50 animate-pulse" />,
});
const LatestJobOpenings = dynamic(() => import("@/component/LatestJobOpenings"), {
  loading: () => <div className="h-96 bg-zinc-50 animate-pulse" />,
});
const FeaturedAlumni = dynamic(() => import("@/component/FeaturedAlumni"), {
  loading: () => <div className="h-96 bg-zinc-50 animate-pulse" />,
});
const ContactUs = dynamic(() => import("@/component/ContactUs"), {
  loading: () => <div className="h-96 bg-zinc-50 animate-pulse" />,
});

export default function Home() {
  return (
    <div>
      <Banner />
      <LatestJobOpenings />
      <ImpactSection />
      <HighlightReviews />
      <FeaturedAlumni />
      <ContactUs />
    </div>
  );
}
