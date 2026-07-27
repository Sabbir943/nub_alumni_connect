import Banner from "@/component/Banner";
import HighlightReviews from "@/component/HighlightReviews";
import ImpactSection from "@/component/ImpactSection";
import LatestJobOpenings from "@/component/LatestJobOpenings";
import FeaturedAlumni from "@/component/FeaturedAlumni";

export default function Home() {
  return (
    <div>
      <Banner />
      <LatestJobOpenings />
      <ImpactSection />
      <HighlightReviews />
      <FeaturedAlumni />
    </div>
  );
}
