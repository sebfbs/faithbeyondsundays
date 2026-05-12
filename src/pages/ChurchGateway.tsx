import { useSearchParams } from "react-router-dom";
import Index from "./Index";
import FindChurchScreen from "@/components/fbs/FindChurchScreen";
import ChurchLandingPage from "./ChurchLandingPage";

export default function ChurchGateway() {
  const [searchParams] = useSearchParams();
  if (searchParams.get("church")) return <ChurchLandingPage />;
  if (localStorage.getItem("fbs_church_id")) return <Index />;
  return <FindChurchScreen />;
}
