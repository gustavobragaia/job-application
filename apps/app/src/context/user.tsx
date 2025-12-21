import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react"

export type user = {
    id: string,
    email: string,
    name: string,
    passwordHash: string,
    createdAt: string,
    modifiedAt: string,
}

type updateProfileInput = {
    name?: string
}

type changePasswordInput ={
    currentPassword: string,
    newPassword: string
}
type UserContextValue = {
    user: user;
    updateProfile: (patch: updateProfileInput) => void;
    changePassword: (data: changePasswordInput) => void;
}

const UserContext = createContext<UserContextValue | null>(null)

function nowISO() {
  return new Date().toISOString();
}

// ⚠️ placeholder. Depois troca por hash real / API.
// Aqui só pra simular.
function fakeHash(s: string) {
  return `hash:${s}`;
}

function newId() {
  // simples, suficiente pro local-first
  return Math.random().toString(16).slice(2) + "-" + Math.random().toString(16).slice(2);
}

export function UserProvider({children}: PropsWithChildren){
    const [user, setUser] = useState<user>(()=>{
        const now = nowISO();
        return {
        id: newId(),
        email: "gustavo@email.com",
        name: "Gustavo",
        passwordHash: fakeHash("123456"),
        createdAt: now,
        modifiedAt: now,
        };
    })

    function updateProfile(patch: updateProfileInput) {
    setUser((prev) => {
        const name = patch.name?.trim();
        if (!name || name === prev.name) return prev;

        return {
            ...prev,
            name,
            modifiedAt: nowISO(),
        };
        });
    }

    function changePassword({ currentPassword, newPassword }: changePasswordInput) {
        const cur = currentPassword.trim();
        const next = newPassword.trim();

        if (fakeHash(cur) !== user.passwordHash) {
        throw new Error("Senha atual incorreta.");
        }
        if (next.length < 6) {
        throw new Error("A nova senha precisa ter pelo menos 6 caracteres.");
        }

          setUser((prev) => ({
            ...prev,
            passwordHash: fakeHash(next),
            modifiedAt: nowISO(),
        }));
    }

    const value = useMemo(()=>({
        user,
        changePassword,
        updateProfile
    }), [user])

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    )
}


export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}