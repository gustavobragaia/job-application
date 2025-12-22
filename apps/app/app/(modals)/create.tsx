import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View, Alert, ActivityIndicator, Platform } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ApplicationStatus, useApplications } from "../../src/context/applications";

const STATUSES: ApplicationStatus[] = ["APPLIED"];

function statusLabel(s: ApplicationStatus) {
  switch (s) {
    case "APPLIED":
      return "Applied";
  }
}

function toNullIfEmpty(v: string) {
  const t = v.trim();
  return t ? t : null;
}

function parseNullableInt(v: string) {
  const t = v.trim();
  if (!t) return null;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}

function isProbablyUrl(v: string) {
  const t = v.trim();
  if (!t) return true; // vazio ok
  return /^https?:\/\/.+/i.test(t);
}

export default function Create() {
  const { createApplication } = useApplications();
  const now = useMemo(() => new Date(), []);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  const [jobUrl, setJobUrl] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus>("APPLIED");
  const [includeDate, setIncludeDate] = useState(true);
  const [appliedDate, setAppliedDate] = useState<Date>(now);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [currency, setCurrency] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const currencyOptions = [
    { code: "BRL", label: "R$ Real", symbol: "R$" },
    { code: "USD", label: "$ Dollar", symbol: "$" },
    { code: "EUR", label: "€ Euro", symbol: "€" },
    { code: "GBP", label: "£ Pound", symbol: "£" },
    { code: "ARS", label: "$ Peso", symbol: "$" },
  ];
  const getCurrencySymbol = (code?: string) =>
    currencyOptions.find((c) => c.code === code)?.symbol ?? "";

  const [isSaving, setIsSaving] = useState(false);

  const canSave = useMemo(
    () => company.trim().length > 0 && role.trim().length > 0 && !isSaving,
    [company, role, isSaving]
  );

  async function save() {
    if (!canSave) return;

    if (!isProbablyUrl(jobUrl)) {
      Alert.alert("URL inválida", "Coloque um link começando com http:// ou https:// (ou deixe vazio).");
      return;
    }

    const appliedAtISO = includeDate
      ? new Date(Date.UTC(appliedDate.getFullYear(), appliedDate.getMonth(), appliedDate.getDate())).toISOString()
      : null;

    const min = parseNullableInt(salaryMin);
    const max = parseNullableInt(salaryMax);

    if (salaryMin.trim() && min === null) {
      Alert.alert("Salário mínimo inválido", "Digite um número inteiro (ex: 5000) ou deixe vazio.");
      return;
    }
    if (salaryMax.trim() && max === null) {
      Alert.alert("Salário máximo inválido", "Digite um número inteiro (ex: 8000) ou deixe vazio.");
      return;
    }
    if (min !== null && max !== null && min > max) {
      Alert.alert("Faixa inválida", "O salário mínimo não pode ser maior que o máximo.");
      return;
    }

    try {
      setIsSaving(true);

      await createApplication({
        company: company.trim(),
        role: role.trim(),
        jobUrl: toNullIfEmpty(jobUrl),
        location: toNullIfEmpty(location),
        notes: toNullIfEmpty(notes),
        appliedAt: appliedAtISO,
        currency: toNullIfEmpty(currency),
        salaryMin: min,
        salaryMax: max,
      });

      setBanner({ type: "success", message: "Application created." });
      setTimeout(() => {
        router.back(); // ✅ melhor pra modal
      }, 500);
    } catch (e: any) {
      setBanner({
        type: "error",
        message: e?.message
          ? String(e.message)
          : "Could not create the application. Try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <BlurView intensity={40} tint="dark" style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {/* Overlay – tocar fora fecha */}
        <Pressable
          style={{ flex: 1 }}
          onPress={() => {
            if (!isSaving) router.back();
          }}
        />

        {/* Bottom Sheet */}
        <SafeAreaView
          edges={["bottom"]}
          className="bg-zinc-950 rounded-t-3xl"
          style={{ height: "85%" }}
        >
          {/* Handle */}
          <View className="items-center py-3">
            <View className="w-12 h-1.5 bg-zinc-700 rounded-full" />
          </View>

          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
            <View className="px-5 pt-2 gap-4">
              <Text className="text-white text-3xl font-bold">New application</Text>
              <Text className="text-zinc-400">
                Fill what you have — only Company and Role are required.
              </Text>

              {banner ? (
                <View
                  className={[
                    "px-4 py-3 rounded-2xl border",
                    banner.type === "success"
                      ? "bg-emerald-500/15 border-emerald-500/40"
                      : "bg-red-500/15 border-red-500/40",
                  ].join(" ")}
                >
                  <Text
                    className={[
                      "font-semibold",
                      banner.type === "success" ? "text-emerald-200" : "text-red-200",
                    ].join(" ")}
                  >
                    {banner.message}
                  </Text>
                </View>
              ) : null}

              <View className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 gap-4">
                {/* Company */}
                <View className="gap-2">
                  <Text className="text-zinc-200 font-semibold">Company *</Text>
                  <TextInput
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                    placeholder="e.g. Nubank"
                    placeholderTextColor="#71717a"
                    value={company}
                    onChangeText={setCompany}
                    editable={!isSaving}
                  />
                </View>

                {/* Role */}
                <View className="gap-2">
                  <Text className="text-zinc-200 font-semibold">Role *</Text>
                  <TextInput
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                    placeholder="e.g. Frontend Dev"
                    placeholderTextColor="#71717a"
                    value={role}
                    onChangeText={setRole}
                    editable={!isSaving}
                  />
                </View>

                {/* Status */}
                <View className="gap-2">
                  <Text className="text-zinc-200 font-semibold">Status</Text>
                  <View className="gap-2">
                    {STATUSES.map((s) => {
                      const selected = s === currentStatus;
                      return (
                        <Pressable
                          key={s}
                          className={[
                            "rounded-2xl py-3 items-center border",
                            selected
                              ? "bg-emerald-500 border-emerald-400"
                              : "bg-zinc-900 border-zinc-800",
                          ].join(" ")}
                          onPress={() => setCurrentStatus(s)}
                          disabled={isSaving}
                        >
                          <Text
                            className={[
                              "font-bold text-base",
                              selected ? "text-zinc-950" : "text-white",
                            ].join(" ")}
                          >
                            {statusLabel(s)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* AppliedAt */}
                <View className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-zinc-200 font-semibold">Applied at</Text>
                    <Pressable
                      onPress={() => setIncludeDate((v) => !v)}
                      disabled={isSaving}
                      className={[
                        "px-3 py-1.5 rounded-full border",
                        includeDate ? "bg-emerald-500 border-emerald-400" : "bg-zinc-900 border-zinc-800",
                      ].join(" ")}
                    >
                      <Text className={includeDate ? "text-zinc-950 font-bold" : "text-white font-bold"}>
                        {includeDate ? "Include" : "Skip"}
                      </Text>
                    </Pressable>
                  </View>

                  {includeDate ? (
                    <View className="gap-3">
                      <Text className="text-zinc-400">
                        {appliedDate.toISOString().slice(0, 10)}
                      </Text>

                      <Pressable
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 items-center"
                        onPress={() => setShowDatePicker(true)}
                        disabled={isSaving}
                      >
                        <Text className="text-white font-semibold">Select date</Text>
                      </Pressable>

                      {showDatePicker ? (
                        <DateTimePicker
                          value={appliedDate}
                          mode="date"
                          display={Platform.OS === "ios" ? "spinner" : "calendar"}
                          onChange={(event, selectedDate) => {
                            if (Platform.OS === "android") {
                              setShowDatePicker(false);
                            }
                            if (selectedDate) setAppliedDate(selectedDate);
                          }}
                          maximumDate={new Date(2100, 11, 31)}
                          minimumDate={new Date(2000, 0, 1)}
                        />
                      ) : null}
                    </View>
                  ) : null}
                </View>

                {/* Job URL */}
                <View className="gap-2">
                  <Text className="text-zinc-200 font-semibold">Job URL</Text>
                  <TextInput
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                    placeholder="https://..."
                    placeholderTextColor="#71717a"
                    value={jobUrl}
                    onChangeText={setJobUrl}
                    autoCapitalize="none"
                    editable={!isSaving}
                  />
                </View>

                {/* Location */}
                <View className="gap-2">
                  <Text className="text-zinc-200 font-semibold">Location</Text>
                  <TextInput
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                    placeholder="Remote / São Paulo"
                    placeholderTextColor="#71717a"
                    value={location}
                    onChangeText={setLocation}
                    editable={!isSaving}
                  />
                </View>

                {/* Notes */}
                <View className="gap-2">
                  <Text className="text-zinc-200 font-semibold">Notes</Text>
                  <TextInput
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                    multiline
                    textAlignVertical="top"
                    style={{ minHeight: 110 }}
                    placeholder="What do you want to remember about this job?"
                    placeholderTextColor="#71717a"
                    value={notes}
                    onChangeText={setNotes}
                    editable={!isSaving}
                  />
                </View>

                {/* Salary */}
                <View className="gap-2">
                  <Text className="text-zinc-200 font-semibold">Salary</Text>
                  <View className="flex-row gap-3">
                    <View style={{ flex: 1, position: "relative" }}>
                      <Pressable
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4"
                        onPress={() => setShowCurrencyPicker((v) => !v)}
                        disabled={isSaving}
                      >
                        <Text className="text-white font-semibold text-center">
                          {getCurrencySymbol(currency) || "¤"}
                        </Text>
                      </Pressable>
                      {showCurrencyPicker ? (
                        <View
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            zIndex: 10,
                          }}
                          className="mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg"
                        >
                          {currencyOptions.map((opt, idx) => {
                            const last = idx === currencyOptions.length - 1;
                            const selected = opt.code === currency;
                            return (
                              <Pressable
                                key={opt.code}
                                className={[
                                  "px-4 py-3",
                                  !last ? "border-b border-zinc-800" : "",
                                  selected ? "bg-emerald-500/20" : "",
                                ].join(" ")}
                                onPress={() => {
                                  setCurrency(opt.code);
                                  setShowCurrencyPicker(false);
                                }}
                                disabled={isSaving}
                              >
                                <Text className={selected ? "text-emerald-400 font-bold" : "text-white"}>
                                  {opt.symbol} ({opt.code})
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      ) : null}
                    </View>
                    <TextInput
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                      placeholder="Mín"
                      keyboardType="number-pad"
                      placeholderTextColor="#71717a"
                      value={salaryMin}
                      onChangeText={setSalaryMin}
                      editable={!isSaving}
                    />
                    <TextInput
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                      placeholder="Máx"
                      keyboardType="number-pad"
                      placeholderTextColor="#71717a"
                      value={salaryMax}
                      onChangeText={setSalaryMax}
                      editable={!isSaving}
                    />
                  </View>
                </View>

                {/* Actions */}
                <Pressable
                  className={[
                    "rounded-2xl py-4 items-center",
                    canSave ? "bg-emerald-500" : "bg-zinc-800",
                  ].join(" ")}
                  onPress={save}
                  disabled={!canSave}
                >
                  <View className="flex-row items-center gap-2">
                    {isSaving ? <ActivityIndicator /> : null}
                    <Text
                      className={[
                        "font-bold text-lg",
                        canSave ? "text-zinc-950" : "text-zinc-400",
                      ].join(" ")}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl py-4 items-center"
                  onPress={() => {
                    if (!isSaving) router.back();
                  }}
                  disabled={isSaving}
                >
                  <Text className="text-white font-bold text-lg">Cancel</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </BlurView>
  );
}
