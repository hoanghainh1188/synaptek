// Route GV — báo cáo lớp: bảng HS × bài (điểm %) + trung bình + xuất CSV (web tải file).
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useClassReport, useMyClasses } from "@/lib/supabase/classes";
import { reportToCsv } from "@/lib/report-csv";
import { atRiskStudents, classTrend } from "@/lib/report-insights";
import { BackButton } from "@/components/BackButton";

const RISK_LABEL = {
  "low-score": "điểm thấp",
  missing: "bỏ nhiều bài",
  both: "điểm thấp + bỏ bài",
} as const;

function pct(v: number | null): string {
  return v === null ? "—" : `${Math.round(v * 100)}%`;
}

function downloadCsv(filename: string, csv: string) {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }); // BOM cho Excel tiếng Việt
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const COL = 64; // bề rộng cột điểm

export default function ClassReportScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const classId = String(id);
  const classes = useMyClasses();
  const report = useClassReport(classId);
  const cls = classes.data?.find((c) => c.id === classId);
  const data = report.data;

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 48,
        paddingHorizontal: 20,
      }}
    >
      <BackButton />
      <View className="flex-row items-center justify-between">
        <Text className="font-display text-2xl font-extrabold text-ink">Báo cáo lớp</Text>
        {Platform.OS === "web" && (data?.rows.length ?? 0) > 0 && (
          <Pressable
            accessibilityLabel="Xuất CSV"
            onPress={() => downloadCsv(`bao-cao-${cls?.name ?? "lop"}.csv`, reportToCsv(data!))}
            className="min-h-[40px] items-center justify-center rounded-md bg-brand px-3"
          >
            <Text className="font-display font-bold text-white">Xuất CSV</Text>
          </Pressable>
        )}
      </View>
      <Text className="mt-1 text-sm text-muted">{cls?.name ?? ""}</Text>

      {data && data.rows.length > 0 && data.assignments.length > 0 && (
        <>
          {/* Cảnh báo HS cần chú ý */}
          {(() => {
            const risk = atRiskStudents(data);
            return (
              <View className="mt-5 rounded-lg bg-no/5 p-4">
                <Text className="font-display text-base font-bold text-ink">
                  ⚠️ Cần chú ý ({risk.length})
                </Text>
                {risk.length === 0 ? (
                  <Text className="mt-1 text-sm text-muted">Cả lớp đang theo kịp 👏</Text>
                ) : (
                  <View className="mt-2 gap-1.5">
                    {risk.map((s) => (
                      <View
                        key={s.studentId}
                        className="flex-row items-center justify-between rounded-md bg-surface px-3 py-2 shadow-sm"
                      >
                        <Text className="flex-1 font-semibold text-ink">
                          {s.name ?? "(chưa đặt tên)"}
                        </Text>
                        <Text className="text-xs font-bold text-no">{RISK_LABEL[s.reason]}</Text>
                        <Text className="ml-3 w-12 text-right text-sm font-extrabold text-ink">
                          {pct(s.average)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })()}

          {/* Xu hướng điểm TB lớp theo bài (sparkline) */}
          {(() => {
            const trend = classTrend(data).filter((t) => t.avg != null);
            if (trend.length < 2) return null;
            const W = 280;
            const H = 56;
            const max = 1;
            const step = trend.length > 1 ? W / (trend.length - 1) : W;
            const pts = trend
              .map((t, i) => `${(i * step).toFixed(1)},${(H - (t.avg! / max) * H).toFixed(1)}`)
              .join(" ");
            return (
              <View className="mt-4 rounded-lg bg-surface p-4 shadow-sm">
                <Text className="font-display text-base font-bold text-ink">
                  📈 Xu hướng điểm TB lớp
                </Text>
                <Svg width={W} height={H} style={{ marginTop: 8 }}>
                  <Polyline points={pts} fill="none" stroke="#2563eb" strokeWidth={2.5} />
                </Svg>
                <Text className="mt-1 text-xs text-muted">
                  Bài đầu {pct(trend[0].avg)} → mới nhất {pct(trend[trend.length - 1].avg)} (
                  {trend.length} bài)
                </Text>
              </View>
            );
          })()}
        </>
      )}

      {(data?.rows.length ?? 0) === 0 ? (
        <Text className="mt-6 text-muted">Lớp chưa có học sinh hoặc bài tập.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator className="mt-5">
          <View>
            {/* Header */}
            <View className="flex-row border-b-2 border-line pb-2">
              <Text className="w-32 font-display text-xs font-extrabold text-muted">Học sinh</Text>
              {data!.assignments.map((a) => (
                <Text
                  key={a.id}
                  numberOfLines={1}
                  style={{ width: COL }}
                  className="text-center text-xs font-bold text-muted"
                >
                  {a.title}
                </Text>
              ))}
              <Text
                style={{ width: COL }}
                className="text-center text-xs font-extrabold text-brand"
              >
                TB
              </Text>
            </View>
            {/* Rows */}
            {data!.rows.map((r) => (
              <View key={r.studentId} className="flex-row items-center border-b border-line py-2">
                <Text numberOfLines={1} className="w-32 font-semibold text-ink">
                  {r.name ?? "(chưa đặt tên)"}
                </Text>
                {data!.assignments.map((a) => (
                  <Text
                    key={a.id}
                    style={{ width: COL }}
                    className={`text-center text-sm ${r.scores[a.id] === null ? "text-muted" : "font-semibold text-ink"}`}
                  >
                    {pct(r.scores[a.id] ?? null)}
                  </Text>
                ))}
                <Text
                  style={{ width: COL }}
                  className="text-center text-sm font-extrabold text-brand"
                >
                  {pct(r.average)}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </ScrollView>
  );
}
