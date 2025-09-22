import { AddSection } from "../sections/add-section";
import { ChartSection } from "../sections/chart-section";
import { TodayProgress } from "../sections/today-progress-section";

export function Home() {
  return (
    <div>
      <h1 className="sr-only">TrainBook</h1>
      <AddSection />
      <TodayProgress />
      <ChartSection />
    </div>
  );
}
