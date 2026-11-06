import { type ComponentProps } from "react";
import { usePreparedWidgetChart } from "./usePreparedWidgetChart";
import { useLargeDatasetGuard } from "../chart-library/useLargeDatasetGuard";
import { isChartDataEmpty } from "@/src/features/widgets/chart-library/isChartDataEmpty";
import { DataCard } from "@/src/components/design-system/DataCard/DataCard";
import { type ChartProps } from "../chart-library/chart-props";
import { type DashboardWidgetChartType } from "@langfuse/shared/src/db";
import { type OrderByState } from "@langfuse/shared";

const EMPTY_DATA: ChartProps["data"] = [];

type WidgetChartCardProps = Pick<
  ComponentProps<typeof DataCard>,
  "title" | "description" | "badge" | "controls" | "tabs" | "actions"
> &
  Pick<
    ChartProps,
    | "config"
    | "legendPosition"
    | "legendSummary"
    | "legendInteraction"
    | "maxVisibleSeries"
    | "syncId"
    | "sync"
    | "metricFormatter"
    | "thresholds"
    | "missingValue"
    | "hideXAxisLabels"
    | "compactYAxis"
    | "colorBarsByCategory"
    | "zeroBaseline"
  > & {
    chartConfig?: Parameters<typeof usePreparedWidgetChart>[0]["chartConfig"];
    sortState?: OrderByState | null;
    onSortChange?: (sortState: OrderByState | null) => void;
    rowLimit?: number;
    overrideWarning?: boolean;
    label?: string;
    unit?: string;
    metric?: { value: string | number; description?: string };
  } & (
    | {
        chartType: DashboardWidgetChartType;
        data: ChartProps["data"];
        content?: Extract<
          ComponentProps<typeof DataCard>["content"],
          { type: "loading" | "empty" | "error" | "confirmation" }
        >;
      }
    | {
        chartType?: never;
        data?: never;
        content: Extract<
          ComponentProps<typeof DataCard>["content"],
          { type: "loading" | "empty" | "error" | "confirmation" }
        >;
      }
  );

export function WidgetChartCard(props: WidgetChartCardProps) {
  const {
    chartType,
    title,
    description,
    badge,
    controls,
    tabs,
    actions,
    content,
    metric,
    data = EMPTY_DATA,
    label,
    unit,
    config,
    chartConfig,
    rowLimit = 100,
    overrideWarning = false,
    ...chart
  } = props;
  const { shouldWarn, proceed } = useLargeDatasetGuard(
    data.length,
    overrideWarning,
  );
  const displayContent =
    content ??
    (isChartDataEmpty(data) ? { type: "empty" as const } : undefined);
  const prepared = usePreparedWidgetChart({
    ...chart,
    chartType,
    data,
    config,
    chartConfig,
    label,
    unit,
    rowLimit,
    active: !displayContent && !shouldWarn,
  });
  const card = {
    title,
    description,
    badge,
    controls,
    tabs,
    actions,
    metric,
  };
  if (props.chartType === undefined)
    return <DataCard {...card} content={props.content} />;
  if (displayContent) return <DataCard {...card} content={displayContent} />;
  if (shouldWarn) {
    return (
      <DataCard
        {...card}
        content={{
          type: "confirmation",
          title: "Large Dataset Warning",
          description:
            "This chart has more than 2,000 unique data points. Rendering it may be slow or may crash your browser. Try to reduce the number of dimensions by adding more selective filters or choosing a coarser breakdown dimension.",
          actionLabel: "I understand, proceed to render the chart",
          onConfirm: proceed,
        }}
      />
    );
  }
  if (
    (prepared.visualization.type === "histogram" &&
      !prepared.visualization.data.length) ||
    (prepared.visualization.type === "table" &&
      !prepared.visualization.rows.length)
  ) {
    return <DataCard {...card} content={{ type: "empty" }} />;
  }
  return <DataCard {...card} {...prepared} content={prepared.visualization} />;
}
