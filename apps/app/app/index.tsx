import { router } from "expo-router";
import { View, Text, Pressable} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Home(){
    return(
        <SafeAreaView className="flex-1 bg-zinc-950">
            <View className="flex-1 px-5 justify-center gap-4">
                <Text className="text-white text-3xl font-bold">Home</Text>
                <Text className="text-zinc-400">
                    Navegação funcionando ✅ (Expo Router + NativeWind)
                </Text>

                <Pressable
                className="bg-emerald-500 rounded-2xl py-4 items-center"
                onPress={() => router.push("/create")}
                >
                <Text className="text-zinc-950 font-bold text-lg">Ir para Create</Text>
                </Pressable>

                <Pressable
                className="bg-zinc-900 border border-zinc-800 rounded-2xl py-4 items-center"
                onPress={() => router.push("/settings")}
                >
                <Text className="text-white font-bold text-lg">Ir para Settings</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    )
}