import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";

import { useApplications } from "../../src/context/applications";
import { useUser } from "../../src/context/user";

function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR");
}

export default function Settings() {
  const { applications } = useApplications();
  const totalApps = applications.length;

  const { user, isLoading, signOut, changePassword, updateProfile } = useUser();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // sempre sincroniza o draft quando o user muda
  useEffect(() => {
    setNameDraft(user?.name ?? "");
  }, [user?.name]);

  const createdAtText = useMemo(() => formatDate(user?.createdAt), [user?.createdAt]);

  async function saveName() {
    const name = nameDraft.trim();
    if (!name) {
      Alert.alert("Nome inválido", "O nome não pode ficar vazio.");
      return;
    }

    try {
      await updateProfile({ name });
      setIsEditingName(false);
      Alert.alert("Atualizado", "Nome atualizado com sucesso.");
    } catch (e: any) {
      Alert.alert("Não foi possível atualizar", e?.message ?? "Erro");
    }
  }

  async function handleChangePassword() {
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      Alert.alert("Senha atualizada", "Sua senha foi alterada com sucesso.");
    } catch (e: any) {
      Alert.alert("Não foi possível alterar a senha", e?.message ?? "Erro");
    }
  }

  // loading state
  if (isLoading) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-zinc-950">
        <View className="flex-1 px-5 pt-8 justify-center items-center">
          <Text className="text-zinc-400">Carregando…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // not logged
  if (!user) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-zinc-950">
        <View className="flex-1 px-5 pt-8 justify-center items-center gap-3">
          <Text className="text-white text-xl font-bold">Você não está logado</Text>
          <Text className="text-zinc-400 text-center">
            Faça login para ver suas configurações.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-zinc-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-5 pt-8 gap-4">
          <Text className="text-white text-3xl font-bold">Configurações</Text>
          <Text className="text-zinc-400">Dados do usuário (logado)</Text>

          {/* Card: User info */}
          <View className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 gap-4">
            <View className="gap-1">
              <Text className="text-zinc-400 text-xs">ID</Text>
              <Text className="text-white font-semibold">{user.id}</Text>
            </View>

            <View className="gap-1">
              <Text className="text-zinc-400 text-xs">Email</Text>
              <Text className="text-white font-semibold">{user.email}</Text>
            </View>

            <View className="gap-2">
              <Text className="text-zinc-400 text-xs">Nome</Text>

              {isEditingName ? (
                <>
                  <TextInput
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                    placeholder="Seu nome"
                    placeholderTextColor="#71717a"
                    value={nameDraft}
                    onChangeText={setNameDraft}
                  />

                  <View className="flex-row gap-2">
                    <Pressable
                      className="flex-1 bg-emerald-500 rounded-2xl py-4 items-center active:opacity-90"
                      onPress={saveName}
                    >
                      <Text className="text-zinc-950 font-bold">Salvar</Text>
                    </Pressable>

                    <Pressable
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl py-4 items-center active:opacity-90"
                      onPress={() => {
                        setNameDraft(user.name);
                        setIsEditingName(false);
                      }}
                    >
                      <Text className="text-white font-bold">Cancelar</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <View className="flex-row items-center justify-between">
                  <Text className="text-white text-lg font-bold">{user.name}</Text>

                  <Pressable
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 active:opacity-90"
                    onPress={() => setIsEditingName(true)}
                  >
                    <Text className="text-white font-bold">Editar</Text>
                  </Pressable>
                </View>
              )}
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 gap-1">
                <Text className="text-zinc-400 text-xs">Criado em</Text>
                <Text className="text-zinc-200">{createdAtText}</Text>
              </View>
            </View>

            <View className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
              <Text className="text-zinc-200 font-semibold">
                Total de aplicações: <Text className="text-white">{totalApps}</Text>
              </Text>
            </View>

            <Pressable
              className="bg-zinc-900 border border-zinc-800 rounded-2xl py-4 items-center active:opacity-90"
              onPress={async () => {
                await signOut();
                Alert.alert("Saiu", "Você foi deslogado.");
              }}
            >
              <Text className="text-white font-bold">Sair</Text>
            </Pressable>
          </View>

          {/* Card: Change password */}
          <View className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 gap-4">
            <Text className="text-white text-xl font-bold">Alterar senha</Text>

            <View className="gap-2">
              <Text className="text-zinc-200 font-semibold">Senha atual</Text>
              <TextInput
                className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                placeholder="Digite a senha atual"
                placeholderTextColor="#71717a"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
              />
            </View>

            <View className="gap-2">
              <Text className="text-zinc-200 font-semibold">Nova senha</Text>
              <TextInput
                className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#71717a"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </View>

            <Pressable
              className={[
                "rounded-2xl py-4 items-center active:opacity-90",
                currentPassword.trim() && newPassword.trim().length >= 6
                  ? "bg-emerald-500"
                  : "bg-zinc-800",
              ].join(" ")}
              onPress={handleChangePassword}
              disabled={!currentPassword.trim() || newPassword.trim().length < 6}
            >
              <Text className="text-zinc-950 font-bold text-lg">Atualizar senha</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
