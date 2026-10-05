import { progress, today, type Project } from "./domain";
export function physicalCurve(
  project: Project,
  asOf = today(project.timezone)
) {
  const start = Date.parse(project.start + "T00:00:00Z");
  const end = Date.parse(
    (asOf > project.end ? asOf : project.end) + "T00:00:00Z"
  );
  const points = [];
  for (let day = start; day <= end; day += 86400000) {
    const date = new Date(day).toISOString().slice(0, 10);
    points.push({
      date,
      planned: progress(project, date, "planned"),
      actual: date <= asOf ? progress(project, date) : null,
    });
  }
  return points;
}
