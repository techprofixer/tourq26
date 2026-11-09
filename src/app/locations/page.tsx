import { makeHubPage } from "@/components/cms/EntityHubPage";

const hub = makeHubPage({
  kind: "LOCATION",
  title: "Locations",
  description:
    "Where Torq Studio delivers software development — headquartered in Mumbai, serving clients across India and worldwide.",
  eyebrow: "LOCATIONS",
});

export const generateMetadata = hub.generateMetadata;
export default hub.Page;
