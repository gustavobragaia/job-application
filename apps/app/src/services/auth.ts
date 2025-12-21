import { apiRequest, setToken } from "../lib/api";

//create authuser, registerresponse, loginresponse
export type AuthUser = {
    id: string;
    email: string;
    name: string;
    createdAt?: string;
    modifiedAt?: string;
}

type RegisterResponse = {
    user: AuthUser;
    token: string;
}

type LoginResponse = {
    user: AuthUser;
    token: string
}

type currentUserDataResponse = {
    user: {
        id: string
        name: string
        email: string
        createdAt: string
    }  
}

//create functions os registeruser, loginuser, logout
export async function registerUser(input: {
    name: string;
    email: string;
    password: string
}) {
    const data = await apiRequest<RegisterResponse>("/auth/register", {
        method: "POST",
        auth: false,
        body: input
    })

    await setToken(data.token)
    return data.user
}

export async function loginUser(input: {
    email: string;
    password: string;
}){
    const data = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        auth: false,
        body: input
    })

    await setToken(data.token)
    return data.user
}

export async function logoutUser(){
    await setToken(null)
}

export async function currentUserData(){
    const data = await apiRequest<currentUserDataResponse>("/me",{
        method: "GET",
        auth: true,
    })
    return data.user
}
