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
    tokens?: IToken[] | null;
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