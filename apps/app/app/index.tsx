import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { cssInterop } from "nativewind";

// Enable className on SafeAreaView
cssInterop(SafeAreaView, { className: "style" });

export default function Home() {
  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <View className="flex-1 px-5 pt-8 gap-4">
        <Text className="text-white text-3xl font-bold">Job Tracker</Text>
        <Text className="text-zinc-400">UI simples, sem componentes ✅</Text>

        <View className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 gap-3">
          <Pressable
            className="bg-emerald-500 rounded-2xl py-4 items-center active:opacity-90"
            onPress={() => router.push("/create")}
          >
            <Text className="text-zinc-950 font-bold text-lg">Criar aplicação</Text>
          </Pressable>

          <Pressable
            className="bg-zinc-900 border border-zinc-800 rounded-2xl py-4 items-center active:opacity-90"
            onPress={() => router.push("/settings")}
          >
            <Text className="text-white font-bold text-lg">Configurações</Text>
          </Pressable>

          <Pressable
            className="rounded-2xl py-4 items-center active:opacity-90"
            onPress={() => {}}
          >
            <Text className="text-white font-semibold">Botão ghost (exemplo)</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
