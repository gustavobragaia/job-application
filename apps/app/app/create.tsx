import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Create() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  function save() {
    if (!company.trim() || !role.trim()) return;
    // depois a gente salva no SQLite
    router.back();
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <View className="flex-1 px-5 pt-8 gap-4">
        <Text className="text-white text-3xl font-bold">Nova aplicação</Text>

        <View className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 gap-4">
          <View className="gap-2">
            <Text className="text-zinc-200 font-semibold">Empresa</Text>
            <TextInput
              className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
              placeholder="Ex: Nubank"
              placeholderTextColor="#71717a"
              value={company}
              onChangeText={setCompany}
            />
          </View>

          <View className="gap-2">
            <Text className="text-zinc-200 font-semibold">Cargo</Text>
            <TextInput
              className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
              placeholder="Ex: Frontend Dev"
              placeholderTextColor="#71717a"
              value={role}
              onChangeText={setRole}
            />
          </View>

          <Pressable
            className="bg-emerald-500 rounded-2xl py-4 items-center active:opacity-90"
            onPress={save}
          >
            <Text className="text-zinc-950 font-bold text-lg">Salvar</Text>
          </Pressable>

          <Pressable
            className="bg-zinc-900 border border-zinc-800 rounded-2xl py-4 items-center active:opacity-90"
            onPress={() => router.back()}
          >
            <Text className="text-white font-bold text-lg">Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
