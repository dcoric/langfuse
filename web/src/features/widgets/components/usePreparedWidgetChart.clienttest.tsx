import { renderHook } from "@testing-library/react";
import { usePreparedWidgetChart } from "./usePreparedWidgetChart";

describe("usePreparedWidgetChart", () => {
  const data = [
    { time_dimension: "2026-11-01T00:00:00Z", dimension: "First", metric: 2 },
    { time_dimension: "2026-11-02T00:00:00Z", dimension: "Second", metric: 3 },
  ];

  test("aggregates number values and preserves a custom formatter", () => {
    const metricFormatter = () => ({ main: "custom" });
    const { result } = renderHook(() =>
      usePreparedWidgetChart({
        chartType: "NUMBER",
        data,
        active: true,
        metricFormatter,
      }),
    );
    expect(result.current.visualization).toMatchObject({
      type: "number",
      value: 5,
      valueFormatter: metricFormatter,
    });
  });

  test("limits ranked rows and skips preparation while inactive", () => {
    const { result, rerender } = renderHook(
      ({ active }) =>
        usePreparedWidgetChart({
          chartType: "HORIZONTAL_BAR",
          data,
          active,
          rowLimit: 1,
        }),
      { initialProps: { active: true } },
    );
    expect(result.current.visualization).toMatchObject({
      type: "horizontal-bar",
      data: [{ label: "First", value: 2 }],
    });
    rerender({ active: false });
    expect(result.current.visualization).toMatchObject({
      type: "horizontal-bar",
      data: [],
    });
  });
});
