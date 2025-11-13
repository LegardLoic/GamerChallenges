import type { IChallenge } from '@/@types/challenge';
import type { IParticipation } from '@/@types/participation';
export type RoleEnum = "member" | "author" | "admin";

export interface IToken {
    id: number;
    token: string;
    date_expiration: string;
  }

export interface IUser {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    role: RoleEnum;
    avatarUrl: string;
    tokens?: IToken[] | null;
    challenge: IChallenge[] | null;
    participation: IParticipation[] | null
}

export interface IUserResetPassword {
    newPassword: string;
    confirmation: string;
}

export interface IUserChangePassword {
    oldPassword: string;
    newPassword: string;
    confirmation: string;
}

export interface IloginFormData {
  email: string,
  password: string
}