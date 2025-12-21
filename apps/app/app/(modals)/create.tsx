import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

import { ApplicationStatus, useApplications } from "../../src/context/applications";

const STATUSES: ApplicationStatus[] = ["APPLIED", "OA", "INTERVIEW", "OFFER", "REJECTED"];

function statusLabel(s: ApplicationStatus) {
  switch (s) {
    case "APPLIED":
      return "Aplicado";
    case "OA":
      return "Online Assessment";
    case "INTERVIEW":
      return "Entrevista";
    case "OFFER":
      return "Oferta";
    case "REJECTED":
      return "Rejeitado";
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

// Aceita "YYYY-MM-DD" ou ISO. Converte para ISO.
// Se inválido, retorna null.
function parseNullableDateToISO(v: string) {
  const t = v.trim();
  if (!t) return null;

  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const d = new Date(t + "T00:00:00.000Z");
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  // tenta ISO
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function Create() {
  const { createApplication } = useApplications();

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  const [jobUrl, setJobUrl] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus>("APPLIED");
  const [appliedAt, setAppliedAt] = useState(""); // usuário digita "YYYY-MM-DD" ou ISO

  const [currency, setCurrency] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

  const canSave = useMemo(() => company.trim().length > 0 && role.trim().length > 0, [company, role]);

  function save() {
    if (!canSave) return;

    if (!isProbablyUrl(jobUrl)) {
      Alert.alert("URL inválida", "Coloque um link começando com http:// ou https:// (ou deixe vazio).");
      return;
    }

    const appliedAtISO = parseNullableDateToISO(appliedAt);
    if (appliedAt.trim() && !appliedAtISO) {
      Alert.alert(
        "Data inválida",
        'Use "YYYY-MM-DD" (ex: 2025-12-21) ou uma data ISO válida.'
      );
      return;
    }

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

    createApplication({
      company: company.trim(),
      role: role.trim(),
      jobUrl: toNullIfEmpty(jobUrl),
      location: toNullIfEmpty(location),
      notes: toNullIfEmpty(notes),
      currentStatus,
      appliedAt: appliedAtISO,
      currency: toNullIfEmpty(currency),
      salaryMin: min,
      salaryMax: max,
    });

    router.replace("/");
  }

 return (
  <BlurView intensity={40} tint="dark" style={{ flex: 1 }}>
    {/* camada extra pra garantir layout */}
    <View style={{ flex: 1 }}>
      {/* Overlay – tocar fora fecha */}
      <Pressable style={{ flex: 1 }} onPress={() => router.back()} />

      {/* Bottom Sheet */}
      <SafeAreaView
        edges={["bottom"]}
        className="bg-zinc-950 rounded-t-3xl"
        style={{ height: "85%" }} // 👈 CONTROLE DA ALTURA AQUI
      >
        {/* Handle */}
        <View className="items-center py-3">
          <View className="w-12 h-1.5 bg-zinc-700 rounded-full" />
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="px-5 pt-2 gap-4">
            <Text className="text-white text-3xl font-bold">Nova aplicação</Text>
            <Text className="text-zinc-400">
              Preencha o que tiver — só Empresa e Cargo são obrigatórios.
            </Text>

            <View className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 gap-4">
              {/* Company */}
              <View className="gap-2">
                <Text className="text-zinc-200 font-semibold">Empresa *</Text>
                <TextInput
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                  placeholder="Ex: Nubank"
                  placeholderTextColor="#71717a"
                  value={company}
                  onChangeText={setCompany}
                />
              </View>

              {/* Role */}
              <View className="gap-2">
                <Text className="text-zinc-200 font-semibold">Cargo *</Text>
                <TextInput
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                  placeholder="Ex: Frontend Dev"
                  placeholderTextColor="#71717a"
                  value={role}
                  onChangeText={setRole}
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
                <Text className="text-zinc-200 font-semibold">Data da aplicação</Text>
                <TextInput
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#71717a"
                  value={appliedAt}
                  onChangeText={setAppliedAt}
                />
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
                />
              </View>

              {/* Location */}
              <View className="gap-2">
                <Text className="text-zinc-200 font-semibold">Localização</Text>
                <TextInput
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                  placeholder="Remoto / São Paulo"
                  placeholderTextColor="#71717a"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              {/* Notes */}
              <View className="gap-2">
                <Text className="text-zinc-200 font-semibold">Notas</Text>
                <TextInput
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                  multiline
                  textAlignVertical="top"
                  style={{ minHeight: 110 }}
                  placeholder="O que você quer lembrar dessa vaga?"
                  placeholderTextColor="#71717a"
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              {/* Salary */}
              <View className="gap-2">
                <Text className="text-zinc-200 font-semibold">Salário</Text>
                <View className="flex-row gap-3">
                  <TextInput
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                    placeholder="Moeda"
                    placeholderTextColor="#71717a"
                    value={currency}
                    onChangeText={setCurrency}
                  />
                  <TextInput
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                    placeholder="Mín"
                    keyboardType="number-pad"
                    placeholderTextColor="#71717a"
                    value={salaryMin}
                    onChangeText={setSalaryMin}
                  />
                  <TextInput
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                    placeholder="Máx"
                    keyboardType="number-pad"
                    placeholderTextColor="#71717a"
                    value={salaryMax}
                    onChangeText={setSalaryMax}
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
                <Text
                  className={[
                    "font-bold text-lg",
                    canSave ? "text-zinc-950" : "text-zinc-400",
                  ].join(" ")}
                >
                  Salvar
                </Text>
              </Pressable>

              <Pressable
                className="bg-zinc-900 border border-zinc-800 rounded-2xl py-4 items-center"
                onPress={() => router.back()}
              >
                <Text className="text-white font-bold text-lg">Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  </BlurView>
);


}
