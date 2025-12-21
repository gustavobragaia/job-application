import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react"
import { loginUser } from "../services/auth"
import { apiRequest, getToken, setToken } from "../lib/api"

export type User = {
    id: string,
    email: string,
    name: string,
    createdAt?: string,
}

type updateProfileInput = {
    name?: string
}

type changePasswordInput ={
    currentPassword: string,
    newPassword: string
}

type UserContextValue = {
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: ()=> Promise<void>;
    updateProfile: (patch: updateProfileInput) => Promise<void>;
    changePassword: (data: changePasswordInput) => Promise<void>
}

//context created
const UserContext = createContext<UserContextValue | null>(null)

//creating userprovider to englobe children
export function UserProvider({children}: PropsWithChildren){
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true)

    //bootstrap to get the current user
    useEffect(()=>{
        bootstrap()
    }, [])

    async function bootstrap(){
        try{
            const token = await getToken()
            if(!token){
                setUser(null)
                return
            }
            const data = await apiRequest<{user: User}>("/me")
            setUser(data.user)
        } catch {
            //invalid token or expired
            await setToken(null)
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }

    /* ---------- auth ---------- */    
    async function signIn(email: string, password: string){
        const loggedUser = await loginUser({email, password})
        setUser(loggedUser)
    }

    async function signOut(){
        await setToken(null)
        setUser(null)
    }


    /* ---------- profile ---------- */
    async function updateProfile(patch: updateProfileInput) {
        const data = await apiRequest<{ user: User}>("/me",{
            method: "PUT",
            body: patch
        })
        setUser(data.user)
    }

    async function changePassword(data: changePasswordInput) {
        await apiRequest("/me/password", {
            method: "PUT",
            body: data,
        });
    }

    const value = useMemo(()=>({
        user,
        isLoading,
        signIn,
        signOut,
        changePassword,
        updateProfile
    }), [user, isLoading])

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
