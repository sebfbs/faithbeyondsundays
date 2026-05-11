import { useSearchParams } from "react-router-dom";
import Index from "./Index";
import FindChurchScreen from "@/components/fbs/FindChurchScreen";

export default function ChurchGateway() {
  const [searchParams] = useSearchParams();
  return searchParams.get("church") ? <Index /> : <FindChurchScreen />;
}
