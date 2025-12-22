import { Alert, Pressable, ScrollView, Text, TextInput, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";

import { useApplications } from "../../src/context/applications";
import { useUser } from "../../src/context/user";

function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US");
}

export default function Settings() {
  const { applications } = useApplications();
  const totalApps = applications.length;

  const { user, isLoading, signOut, changePassword, updateProfile } = useUser();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // always sync draft when user changes
  useEffect(() => {
    setNameDraft(user?.name ?? "");
  }, [user?.name]);

  const createdAtText = useMemo(() => formatDate(user?.createdAt), [user?.createdAt]);

  async function saveName() {
    const name = nameDraft.trim();
    if (!name) {
      Alert.alert("Invalid name", "Name cannot be empty.");
      return;
    }

    try {
      setIsSavingName(true);
      await updateProfile({ name });
      setIsEditingName(false);
      setBanner({ type: "success", message: "Name updated successfully." });
    } catch (e: any) {
      setBanner({ type: "error", message: e?.message ?? "Could not update name." });
    }
    setIsSavingName(false);
  }

  async function handleChangePassword() {
    try {
      setIsChangingPassword(true);
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setBanner({ type: "success", message: "Password updated." });
    } catch (e: any) {
      setBanner({ type: "error", message: e?.message ?? "Could not change password." });
    }
    setIsChangingPassword(false);
  }

  // loading state
  if (isLoading) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-zinc-950">
        <View className="flex-1 px-5 pt-8 justify-center items-center">
          <Text className="text-zinc-400">Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // not logged
  if (!user) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-zinc-950">
        <View className="flex-1 px-5 pt-8 justify-center items-center gap-3">
          <Text className="text-white text-xl font-bold">You are not logged in</Text>
          <Text className="text-zinc-400 text-center">
            Sign in to view your settings.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-zinc-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-5 pt-8 gap-4">
          <Text className="text-white text-3xl font-bold">Settings</Text>
          <Text className="text-zinc-400">User data (logged in)</Text>

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
              <Text className="text-zinc-400 text-xs">Name</Text>

              {isEditingName ? (
                <>
                  <TextInput
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                    placeholder="Your name"
                    placeholderTextColor="#71717a"
                    value={nameDraft}
                    onChangeText={setNameDraft}
                  />

                  <View className="flex-row gap-2">
                    <Pressable
                      className="flex-1 bg-emerald-500 rounded-2xl py-4 items-center active:opacity-90"
                      onPress={saveName}
                      disabled={isSavingName}
                    >
                      {isSavingName ? (
                        <ActivityIndicator color="#0b0b0f" />
                      ) : (
                        <Text className="text-zinc-950 font-bold">Save</Text>
                      )}
                    </Pressable>

                    <Pressable
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl py-4 items-center active:opacity-90"
                      onPress={() => {
                        setNameDraft(user.name);
                        setIsEditingName(false);
                      }}
                      disabled={isSavingName}
                    >
                      <Text className="text-white font-bold">Cancel</Text>
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
                    <Text className="text-white font-bold">Edit</Text>
                  </Pressable>
                </View>
              )}
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 gap-1">
                <Text className="text-zinc-400 text-xs">Created at</Text>
                <Text className="text-zinc-200">{createdAtText}</Text>
              </View>
            </View>

            <View className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
              <Text className="text-zinc-200 font-semibold">
                Total applications: <Text className="text-white">{totalApps}</Text>
              </Text>
            </View>

            <Pressable
              className="bg-zinc-900 border border-zinc-800 rounded-2xl py-4 items-center active:opacity-90"
              onPress={async () => {
                setIsSigningOut(true);
                try {
                  await signOut();
                  setBanner({ type: "success", message: "Signed out." });
                } catch (e: any) {
                  setBanner({ type: "error", message: e?.message ?? "Could not sign out." });
                } finally {
                  setIsSigningOut(false);
                }
              }}
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <ActivityIndicator />
              ) : (
                <Text className="text-white font-bold">Sign out</Text>
              )}
            </Pressable>
          </View>

          {/* Card: Change password */}
          <View className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 gap-4">
            <Text className="text-white text-xl font-bold">Change password</Text>

            <View className="gap-2">
              <Text className="text-zinc-200 font-semibold">Current password</Text>
              <TextInput
                className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                placeholder="Enter current password"
                placeholderTextColor="#71717a"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
              />
            </View>

            <View className="gap-2">
              <Text className="text-zinc-200 font-semibold">New password</Text>
              <TextInput
                className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
                placeholder="Minimum 6 characters"
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
              disabled={!currentPassword.trim() || newPassword.trim().length < 6 || isChangingPassword}
            >
              {isChangingPassword ? (
                <ActivityIndicator color="#0b0b0f" />
              ) : (
                <Text className="text-zinc-950 font-bold text-lg">Update password</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
