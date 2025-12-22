import { Alert, Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";

import { ApplicationStatus, useApplications } from "../../src/context/applications";

const STATUSES: ApplicationStatus[] = ["APPLIED", "OA", "INTERVIEW", "OFFER", "REJECTED"];
const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  APPLIED: ["OA", "INTERVIEW", "REJECTED"],
  OA: ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["OFFER", "REJECTED"],
  OFFER: ["INTERVIEW"],
  REJECTED: [],
};

function statusLabel(s: ApplicationStatus) {
  switch (s) {
    case "APPLIED":
      return "Applied";
    case "OA":
      return "Online Assessment";
    case "INTERVIEW":
      return "Interview";
    case "OFFER":
      return "Offer";
    case "REJECTED":
      return "Rejected";
  }
}

function toYYYYMMDD(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

function parseNullableDateToISO(v: string) {
  const t = v.trim();
  if (!t) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const d = new Date(t + "T00:00:00.000Z");
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function parseNullableInt(v: string) {
  const t = v.trim();
  if (!t) return null;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}

function isProbablyUrl(v: string) {
  const t = v.trim();
  if (!t) return true;
  return /^https?:\/\/.+/i.test(t);
}

function formatSalary(
  currency?: string | null,
  min?: number | null,
  max?: number | null
) {
  const cur = (currency ?? "").trim();
  if (min == null && max == null) return null;

  const fmt = (n: number) => n.toLocaleString("pt-BR");
  if (min != null && max != null) return `${cur ? cur + " " : ""}${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `${cur ? cur + " " : ""}${fmt(min)}+`;
  return `${cur ? cur + " " : ""}até ${fmt(max as number)}`;
}

export default function ApplicationDetails() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;

  const { getApplicationById, changeStatus, deleteApplication, updateApplication } =
    useApplications();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // drafts (todos os campos editáveis)
  const [companyDraft, setCompanyDraft] = useState("");
  const [roleDraft, setRoleDraft] = useState("");
  const [jobUrlDraft, setJobUrlDraft] = useState("");
  const [locationDraft, setLocationDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [currencyDraft, setCurrencyDraft] = useState("");
  const [salaryMinDraft, setSalaryMinDraft] = useState("");
  const [salaryMaxDraft, setSalaryMaxDraft] = useState("");
  const [appliedAtDraft, setAppliedAtDraft] = useState(""); // YYYY-MM-DD

  if (!id || typeof id !== "string") {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950">
        <View className="flex-1 px-5 pt-8 gap-4">
          <Text className="text-white text-2xl font-bold">Error</Text>
          <Text className="text-zinc-400">Invalid ID.</Text>

          <Pressable
            className="bg-zinc-900 border border-zinc-800 rounded-2xl py-4 items-center active:opacity-90"
            onPress={() => router.replace("/")}
          >
            <Text className="text-white font-bold text-lg">Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const app = getApplicationById(id);

  // sync dos drafts com dados reais
  useEffect(() => {
    if (!app) return;
    setCompanyDraft(app.company ?? "");
    setRoleDraft(app.role ?? "");
    setJobUrlDraft(app.jobUrl ?? "");
    setLocationDraft(app.location ?? "");
    setNotesDraft(app.notes ?? "");
    setCurrencyDraft(app.currency ?? "");
    setSalaryMinDraft(app.salaryMin == null ? "" : String(app.salaryMin));
    setSalaryMaxDraft(app.salaryMax == null ? "" : String(app.salaryMax));
    setAppliedAtDraft(toYYYYMMDD(app.appliedAt));
  }, [
    app?.company,
    app?.role,
    app?.jobUrl,
    app?.location,
    app?.notes,
    app?.currency,
    app?.salaryMin,
    app?.salaryMax,
    app?.appliedAt,
  ]);

  const salaryText = useMemo(
    () => formatSalary(app?.currency, app?.salaryMin, app?.salaryMax),
    [app?.currency, app?.salaryMin, app?.salaryMax]
  );

  if (!app) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950">
        <View className="flex-1 px-5 pt-8 gap-4">
          <Text className="text-white text-2xl font-bold">Not found</Text>
          <Text className="text-zinc-400">
            This application does not exist (maybe you deleted it).
          </Text>

          <Pressable
            className="bg-zinc-900 border border-zinc-800 rounded-2xl py-4 items-center active:opacity-90"
            onPress={() => router.replace("/")}
          >
            <Text className="text-white font-bold text-lg">Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  function handleDelete() {
    Alert.alert("Delete application", `Delete "${app.company}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setIsDeleting(true);
            await deleteApplication(app.id);
            router.replace("/");
          } catch (e: any) {
            Alert.alert("Could not delete", e?.message ?? "Please try again.");
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  }

  function startEdit() {
    setIsEditing(true);
  }

  function cancelEdit() {
    // restore drafts from current data
    setCompanyDraft(app.company ?? "");
    setRoleDraft(app.role ?? "");
    setJobUrlDraft(app.jobUrl ?? "");
    setLocationDraft(app.location ?? "");
    setNotesDraft(app.notes ?? "");
    setCurrencyDraft(app.currency ?? "");
    setSalaryMinDraft(app.salaryMin == null ? "" : String(app.salaryMin));
    setSalaryMaxDraft(app.salaryMax == null ? "" : String(app.salaryMax));
    setAppliedAtDraft(toYYYYMMDD(app.appliedAt));
    setIsEditing(false);
  }

  function saveEdit() {
    const company = companyDraft.trim();
    const role = roleDraft.trim();

    if (!company || !role) {
      Alert.alert("Required fields", "Company and role cannot be empty.");
      return;
    }

    if (!isProbablyUrl(jobUrlDraft)) {
      Alert.alert("URL inválida", "Use http:// ou https:// (ou deixe vazio).");
      return;
    }

    const appliedAtISO = parseNullableDateToISO(appliedAtDraft);
    if (appliedAtDraft.trim() && !appliedAtISO) {
      Alert.alert("Invalid date", 'Use "YYYY-MM-DD" (e.g. 2025-12-21) or leave blank.');
      return;
    }

    const min = parseNullableInt(salaryMinDraft);
    const max = parseNullableInt(salaryMaxDraft);

    if (salaryMinDraft.trim() && min === null) {
      Alert.alert("Invalid min salary", "Enter an integer or leave blank.");
      return;
    }
    if (salaryMaxDraft.trim() && max === null) {
      Alert.alert("Invalid max salary", "Enter an integer or leave blank.");
      return;
    }
    if (min !== null && max !== null && min > max) {
      Alert.alert("Invalid range", "Minimum salary cannot be greater than maximum.");
      return;
    }

    updateApplication(app.id, {
      company,
      role,
      jobUrl: jobUrlDraft.trim() ? jobUrlDraft.trim() : null,
      location: locationDraft.trim() ? locationDraft.trim() : null,
      notes: notesDraft.trim() ? notesDraft.trim() : null,
      currency: currencyDraft.trim() ? currencyDraft.trim() : null,
      salaryMin: min,
      salaryMax: max,
      appliedAt: appliedAtISO,
    });

    setIsEditing(false);
  }

  async function openJobUrl() {
    const url = (app.jobUrl ?? "").trim();
    if (!url) return;

    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) {
        Alert.alert("Could not open link", url);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("Could not open link", url);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-5 pt-8 gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <Pressable
              className="border border-zinc-800 rounded-2xl px-4 py-2 active:opacity-90"
              onPress={() => router.back()}
            >
              <Text className="text-white font-semibold">Back</Text>
            </Pressable>

            <View className="flex-row gap-2">
              {isEditing ? (
                <>
                      <Pressable
                        className="bg-emerald-500 rounded-2xl px-4 py-2 active:opacity-90"
                        onPress={saveEdit}
                      >
                        <Text className="text-zinc-950 font-bold">Save</Text>
                      </Pressable>

                  <Pressable
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 active:opacity-90"
                        onPress={cancelEdit}
                      >
                        <Text className="text-white font-bold">Cancel</Text>
                      </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 active:opacity-90"
                        onPress={startEdit}
                      >
                        <Text className="text-white font-bold">Edit</Text>
                      </Pressable>

                  <Pressable
                    className="bg-red-600 rounded-2xl px-4 py-2 active:opacity-90"
                    onPress={handleDelete}
                    disabled={isDeleting}
                  >
                    <Text className="text-white font-bold">
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {/* Core info */}
          <View className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 gap-4">
            {/* Company */}
            <View className="gap-2">
            <Text className="text-zinc-200 font-semibold">Company</Text>
              {isEditing ? (
                <TextInput
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                  placeholder="e.g. Nubank"
                  placeholderTextColor="#71717a"
                  value={companyDraft}
                  onChangeText={setCompanyDraft}
                />
              ) : (
                <Text className="text-white text-2xl font-bold">{app.company}</Text>
              )}
            </View>

            {/* Role */}
            <View className="gap-2">
            <Text className="text-zinc-200 font-semibold">Role</Text>
              {isEditing ? (
                <TextInput
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                  placeholder="e.g. Frontend Dev"
                  placeholderTextColor="#71717a"
                  value={roleDraft}
                  onChangeText={setRoleDraft}
                />
              ) : (
                <Text className="text-zinc-300 text-base">{app.role}</Text>
              )}
            </View>

            {/* Status badge */}
            <View className="bg-zinc-800 rounded-full self-start px-3 py-1">
              <Text className="text-zinc-100 text-xs font-semibold">
                Status: {statusLabel(app.currentStatus)}
              </Text>
            </View>

            {/* Applied date */}
            <View className="gap-2">
              <Text className="text-zinc-200 font-semibold">Applied at</Text>
              {isEditing ? (
                <TextInput
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                  placeholder='YYYY-MM-DD (ex: 2025-12-21)'
                  placeholderTextColor="#71717a"
                  value={appliedAtDraft}
                  onChangeText={setAppliedAtDraft}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              ) : (
                <Text className="text-zinc-300">
                  {app.appliedAt ? toYYYYMMDD(app.appliedAt) : "—"}
                </Text>
              )}
            </View>

            {/* Location */}
            <View className="gap-2">
              <Text className="text-zinc-200 font-semibold">Location</Text>
              {isEditing ? (
                <TextInput
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                  placeholder="e.g. Remote / São Paulo"
                  placeholderTextColor="#71717a"
                  value={locationDraft}
                  onChangeText={setLocationDraft}
                />
              ) : (
                <Text className="text-zinc-300">{app.location ?? "—"}</Text>
              )}
            </View>

            {/* Job URL */}
            <View className="gap-2">
              <Text className="text-zinc-200 font-semibold">Job URL</Text>
              {isEditing ? (
                <TextInput
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                  placeholder="https://..."
                  placeholderTextColor="#71717a"
                  value={jobUrlDraft}
                  onChangeText={setJobUrlDraft}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              ) : app.jobUrl ? (
                <Pressable
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 active:opacity-90"
                  onPress={openJobUrl}
                >
                  <Text className="text-emerald-400 font-semibold">{app.jobUrl}</Text>
                </Pressable>
              ) : (
                <Text className="text-zinc-300">—</Text>
              )}
            </View>

            {/* Notes */}
            <View className="gap-2">
              <Text className="text-zinc-200 font-semibold">Notes</Text>
              {isEditing ? (
                <TextInput
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                  placeholder="What do you want to remember?"
                  placeholderTextColor="#71717a"
                  value={notesDraft}
                  onChangeText={setNotesDraft}
                  multiline
                  textAlignVertical="top"
                  style={{ minHeight: 120 }}
                />
              ) : (
                <Text className="text-zinc-300">{app.notes ?? "—"}</Text>
              )}
            </View>

            {/* Salary */}
            <View className="gap-2">
              <Text className="text-zinc-200 font-semibold">Salary</Text>

              {isEditing ? (
                <View className="flex-row gap-3">
                  <View className="flex-1 gap-2">
                    <Text className="text-zinc-400 text-xs">Currency</Text>
                    <TextInput
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                      placeholder="BRL"
                      placeholderTextColor="#71717a"
                      value={currencyDraft}
                      onChangeText={setCurrencyDraft}
                      autoCapitalize="characters"
                      maxLength={6}
                    />
                  </View>

                  <View className="flex-1 gap-2">
                    <Text className="text-zinc-400 text-xs">Min</Text>
                    <TextInput
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                      placeholder="5000"
                      placeholderTextColor="#71717a"
                      value={salaryMinDraft}
                      onChangeText={setSalaryMinDraft}
                      keyboardType="number-pad"
                    />
                  </View>

                  <View className="flex-1 gap-2">
                    <Text className="text-zinc-400 text-xs">Max</Text>
                    <TextInput
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                      placeholder="8000"
                      placeholderTextColor="#71717a"
                      value={salaryMaxDraft}
                      onChangeText={setSalaryMaxDraft}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              ) : (
                <Text className="text-zinc-300">{salaryText ?? "—"}</Text>
              )}
            </View>
          </View>

          {/* Status buttons */}
          <Text className="text-zinc-200 font-semibold mt-2">Change status</Text>

          <View className="gap-2">
            {STATUSES.map((s) => {
              const selected = s === app.currentStatus;
              const allowedNext = ALLOWED_TRANSITIONS[app.currentStatus] ?? [];

              return (
                <Pressable
                  key={s}
                  className={[
                    "rounded-2xl py-3 items-center active:opacity-90 border",
                    selected ? "bg-emerald-500 border-emerald-400" : "bg-zinc-900 border-zinc-800",
                  ].join(" ")}
                  onPress={() => {
                    if (isEditing) {
                      Alert.alert(
                        "Finalize a edição",
                        "Salve ou cancele a edição antes de trocar o status."
                      );
                      return;
                    }

                    if (app.currentStatus === s) {
                      Alert.alert("Same status", "This application is already in this status.");
                      return;
                    }

                    if (!allowedNext.includes(s)) {
                      const readable = allowedNext.length
                        ? allowedNext.map(statusLabel).join(", ")
                        : "no transitions allowed";
                      Alert.alert(
                        "Invalid transition",
                        `From ${statusLabel(app.currentStatus)} you can go to: ${readable}.`
                      );
                      return;
                    }

                    if (s === "REJECTED" || s === "OFFER") {
                      Alert.alert("Confirmar status", `Marcar como ${statusLabel(s)}?`, [
                        { text: "Cancelar", style: "cancel" },
                        { text: "Confirmar", onPress: () => changeStatus(app.id, s) },
                      ]);
                    } else {
                      changeStatus(app.id, s);
                    }
                  }}
                >
                  <Text className={["font-bold text-lg", selected ? "text-zinc-950" : "text-white"].join(" ")}>
                    {statusLabel(s)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
