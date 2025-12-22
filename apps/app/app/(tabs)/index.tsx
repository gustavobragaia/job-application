import { FlatList, Pressable, Text, TextInput, View, RefreshControl, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { cssInterop } from "nativewind";
import { useEffect, useMemo, useCallback, useState } from "react";

import { ApplicationStatus, useApplications } from "../../src/context/applications";
import { useUser } from "../../src/context/user";
cssInterop(SafeAreaView, { className: "style" });

type StatusFilter = ApplicationStatus | "ALL";
type SortBy = "createdAt" | "updatedAt" | "appliedAt";
type Order = "asc" | "desc";

const STATUS_ORDER: ApplicationStatus[] = [
  "APPLIED",
  "OA",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
];

const LIMIT_OPTIONS = [10, 20, 50] as const;

function statusLabel(s: ApplicationStatus) {
  switch (s) {
    case "APPLIED":
      return "Applied";
    case "OA":
      return "OA";
    case "INTERVIEW":
      return "Interview";
    case "OFFER":
      return "Offer";
    case "REJECTED":
      return "Rejected";
  }
}

function chip(isSelected: boolean) {
  return isSelected
    ? "bg-emerald-500 border-emerald-400"
    : "bg-zinc-900 border-zinc-800";
}

function chipText(isSelected: boolean) {
  return isSelected ? "text-zinc-950" : "text-white";
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export default function Home() {
  const { applications, fetchApplications, isLoading } = useApplications();
  const { signOut } = useUser();

  // ✅ carregar ao entrar
  useEffect(() => {
    fetchApplications();
  }, []);

  const onRefresh = useCallback(() => {
    fetchApplications();
  }, [fetchApplications]);

  // === filtros da rota ===
  const [q, setQ] = useState(""); // q
  const [status, setStatus] = useState<StatusFilter>("ALL"); // status
  const [company, setCompany] = useState(""); // company
  const [role, setRole] = useState(""); // role

  const [sortBy, setSortBy] = useState<SortBy>("updatedAt"); // sortBy
  const [order, setOrder] = useState<Order>("desc"); // order

  const [limit, setLimit] = useState<(typeof LIMIT_OPTIONS)[number]>(20); // limit
  const [page, setPage] = useState(1); // page

  const [showFilters, setShowFilters] = useState(false);

  // sempre que filtros mudarem, volta pra primeira página
  function resetPagination() {
    setPage(1);
  }

  // summary (igual /applications/summary)
  const summary = useMemo(() => {
    const counts: Record<ApplicationStatus, number> = {
      APPLIED: 0,
      OA: 0,
      INTERVIEW: 0,
      OFFER: 0,
      REJECTED: 0,
    };
    for (const a of applications) counts[a.currentStatus] += 1;
    return counts;
  }, [applications]);

  // aplica todos os filtros localmente (espelhando GET /applications)
  const filteredAndSorted = useMemo(() => {
    const qq = normalize(q);
    const cc = normalize(company);
    const rr = normalize(role);

    const list = applications.filter((a) => {
      // status
      if (status !== "ALL" && a.currentStatus !== status) return false;

      // company filter (field específico)
      if (cc && !normalize(a.company).includes(cc)) return false;

      // role filter (field específico)
      if (rr && !normalize(a.role).includes(rr)) return false;

      // q (busca geral)
      if (qq) {
        const inCompany = normalize(a.company).includes(qq);
        const inRole = normalize(a.role).includes(qq);
        if (!inCompany && !inRole) return false;
      }

      return true;
    });

    // sort
    const getSortableValue = (a: any) => {
      if (sortBy === "appliedAt") {
        // appliedAt pode ser null -> manda pro fim no desc, pro começo no asc
        return a.appliedAt ?? "";
      }
      return a[sortBy] ?? "";
    };

    list.sort((a, b) => {
      const va = getSortableValue(a);
      const vb = getSortableValue(b);

      if (va === vb) return 0;

      if (order === "asc") return va > vb ? 1 : -1;
      return va < vb ? 1 : -1; // desc
    });

    return list;
  }, [applications, q, status, company, role, sortBy, order]);

  // paginação (page/limit)
  const total = filteredAndSorted.length;
  const paged = useMemo(() => {
    const end = page * limit;
    return filteredAndSorted.slice(0, end);
  }, [filteredAndSorted, page, limit]);

  const canLoadMore = paged.length < total;

  function clearAllFilters() {
    setQ("");
    setStatus("ALL");
    setCompany("");
    setRole("");
    setSortBy("updatedAt");
    setOrder("desc");
    setLimit(20);
    setPage(1);
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-zinc-950">
      <View className="flex-1 px-5 pt-8 gap-4">
        <Text className="text-white text-3xl font-bold">Jobly</Text>

        {/* Search (q) */}
        <TextInput
          className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white"
          placeholder="Search by company or role..."
          placeholderTextColor="#71717a"
          value={q}
          onChangeText={(t) => {
            setQ(t);
            resetPagination();
          }}
          autoCorrect={false}
          autoCapitalize="none"
        />

        {/* Summary + Status filter */}
        <View className="flex-row flex-wrap gap-2">
          <Pressable
            className={["border rounded-full px-4 py-2 active:opacity-90", chip(status === "ALL")].join(" ")}
            onPress={() => {
              setStatus("ALL");
              resetPagination();
            }}
          >
            <Text className={["font-bold", chipText(status === "ALL")].join(" ")}>
              All • {applications.length}
            </Text>
          </Pressable>

          {STATUS_ORDER.map((s) => (
            <Pressable
              key={s}
              className={["border rounded-full px-4 py-2 active:opacity-90", chip(status === s)].join(" ")}
              onPress={() => {
                setStatus(s);
                resetPagination();
              }}
            >
              <Text className={["font-bold", chipText(status === s)].join(" ")}>
                {statusLabel(s)} • {summary[s]}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Top actions */}
        <View className="flex-row gap-2">
          <Pressable
            className="flex-1 bg-emerald-500 rounded-2xl py-4 items-center active:opacity-90"
            onPress={() => router.push("/(modals)/create")}
          >
            <Text className="text-zinc-950 font-bold text-lg">Create Job Application</Text>
          </Pressable>

          <Pressable
            className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 items-center justify-center active:opacity-90"
            onPress={() => setShowFilters((v) => !v)}
          >
            <Text className="text-white font-bold">{showFilters ? "Fechar" : "Filtros"}</Text>
          </Pressable>
        </View>

        {/* Advanced filters panel */}
        {showFilters ? (
          <View className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 gap-4">
            <View className="flex-row gap-3">
              <View className="flex-1 gap-2">
                <Text className="text-zinc-200 font-semibold">Company (filter)</Text>
                <TextInput
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-white"
                  placeholder="e.g. Nubank"
                  placeholderTextColor="#71717a"
                  value={company}
                  onChangeText={(t) => {
                    setCompany(t);
                    resetPagination();
                  }}
                  autoCorrect={false}
                />
              </View>

              <View className="flex-1 gap-2">
                <Text className="text-zinc-200 font-semibold">Role (filter)</Text>
                <TextInput
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-white"
                  placeholder="e.g. Frontend"
                  placeholderTextColor="#71717a"
                  value={role}
                  onChangeText={(t) => {
                    setRole(t);
                    resetPagination();
                  }}
                  autoCorrect={false}
                />
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-zinc-200 font-semibold">Sort By</Text>
              <View className="flex-row flex-wrap gap-2">
                {(["createdAt", "updatedAt", "appliedAt"] as SortBy[]).map((k) => (
                  <Pressable
                    key={k}
                    className={["border rounded-full px-4 py-2 active:opacity-90", chip(sortBy === k)].join(" ")}
                    onPress={() => {
                      setSortBy(k);
                      resetPagination();
                    }}
                  >
                    <Text className={["font-bold", chipText(sortBy === k)].join(" ")}>
                      {k}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-zinc-200 font-semibold">Order</Text>
              <View className="flex-row gap-2">
                {(["desc", "asc"] as Order[]).map((o) => (
                  <Pressable
                    key={o}
                    className={["flex-1 border rounded-2xl py-3 items-center active:opacity-90", chip(order === o)].join(" ")}
                    onPress={() => {
                      setOrder(o);
                      resetPagination();
                    }}
                  >
                    <Text className={["font-bold", chipText(order === o)].join(" ")}>
                      {o.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-zinc-200 font-semibold">Limit</Text>
              <View className="flex-row gap-2">
                {LIMIT_OPTIONS.map((n) => (
                  <Pressable
                    key={n}
                    className={["flex-1 border rounded-2xl py-3 items-center active:opacity-90", chip(limit === n)].join(" ")}
                    onPress={() => {
                      setLimit(n);
                      setPage(1); // limit muda -> volta pro começo
                    }}
                  >
                    <Text className={["font-bold", chipText(limit === n)].join(" ")}>
                      {n}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              className="bg-zinc-900 border border-zinc-800 rounded-2xl py-4 items-center active:opacity-90"
              onPress={clearAllFilters}
            >
              <Text className="text-white font-bold">Clear filters</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Results header */}
        <Text className="text-zinc-400">
          Showing {paged.length} of {total}
        </Text>

        {/* ✅ Loading inicial (sem mexer em estilo) */}
        {isLoading && applications.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-3">
            <ActivityIndicator />
            <Text className="text-zinc-400 text-lg font-semibold">Carregando...</Text>
          </View>
        ) : total === 0 ? (
          <View className="flex-1 items-center justify-center gap-2">
            <Text className="text-zinc-400 text-lg font-semibold">Nothing found</Text>
            <Text className="text-zinc-500 text-sm text-center">
              Adjust filters or create a new application.
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={paged}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 12 }}
              refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
              }
              renderItem={({ item }) => (
                <Pressable
                  className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 mb-3 active:opacity-90"
                  onPress={() => router.push(`/applications/${item.id}`)}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white text-lg font-bold">
                      {item.company}
                    </Text>

                    <View className="bg-zinc-800 rounded-full px-3 py-1">
                      <Text className="text-zinc-200 text-xs font-semibold">
                        {statusLabel(item.currentStatus)}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-zinc-300 mt-1">{item.role}</Text>
                </Pressable>
              )}
            />

            {/* Load more (page) */}
            {canLoadMore ? (
              <Pressable
                className="bg-zinc-900 border border-zinc-800 rounded-2xl py-4 items-center active:opacity-90"
                onPress={() => setPage((p) => p + 1)}
              >
                <Text className="text-white font-bold">Load more</Text>
            </Pressable>
          ) : null}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
