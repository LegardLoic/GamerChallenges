import { createAsyncThunk, createReducer } from "@reduxjs/toolkit";

import { axiosInstance } from "@/api/axiosInstance";
import type { IloginFormData, IUser, IUserChangePassword, IUserResetPassword } from "@/@types/user";
import type { AxiosError } from "axios";

// **********************************************************************************
// ** Types & Initial State
// **********************************************************************************

interface UserState {
  userInfo: IUser | null;
  isAuth: boolean;
  loading: boolean;
  error: string | null;
}

export const initialState : UserState = {
  userInfo: null,
  isAuth: false,
  loading: false,
  error: null,
};

// **********************************************************************************
// ** Actions (Async & Sync)
// **********************************************************************************

// LOGIN
export const login = createAsyncThunk<IUser, IloginFormData, { rejectValue: string }>(
  "auth/login",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/auth/login", formData);
      console.log("data :LOGIN:", data);
      return data.user as IUser;
      
    } catch (error: any) {
      console.error("LOGIN ERROR CAUGHT:", error);
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        const responseData = axiosError.response.data as any;
        const errorMessage = responseData?.error;

        if (axiosError.response.status === 400) {
          return rejectWithValue("Email ou mot de passe incorrect");
        }
        return rejectWithValue(
          errorMessage || `Erreur serveur: ${axiosError.response.status}`
        );
      } else if (axiosError.request) {
        console.log(">Network< error - no response");
        return rejectWithValue(
          "Erreur réseau: Impossible de contacter le serveur"
        );
      }
      return rejectWithValue(
        "Une erreur est survenue. Veuillez réessayer plus tard."
      );
    }
  }
);

// getUserInfo
export const getUserInfo = createAsyncThunk<IUser, void, { rejectValue: string }>("auth/me", async (_, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.get("/auth/me");
    console.log(">>>>>>>>>>>><<data :ME:", data);
    return data;
  } catch {
    return rejectWithValue("Unauthenticated");
  }
});

// LOGOUT
export const logout = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logout",
  async () => {
    await axiosInstance.get("/auth/logout");
  }
);

// Resend Email Confirmation
export const resendEmailConfirmation = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>("auth/resend-email-confirmation", async (email, { rejectWithValue }) => {
  try {
    await axiosInstance.post("/auth/resend-email-confirmation", { email });
  } catch (error: any) {
    return rejectWithValue(error.message ?? "Network error occurred");
  }
});

// Forgot Password
export const forgotPassword = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>("auth/forgot-password", async (email, { rejectWithValue }) => {
  try {
    await axiosInstance.post("/auth/forgot-password", { email });
  } catch (error: any) {
    return rejectWithValue(error.message ?? "Network error occurred");
  }
});

// Reset Password
export const resetPassword = createAsyncThunk<
  { message: string }, // Type plus précis
  { token: string; formData: IUserResetPassword },
  { rejectValue: string }
>("auth/reset-password", async ({ token, formData }, { rejectWithValue }) => {
  try {
    await axiosInstance.patch(`/auth/reset-password?token=${token}`, formData);

    return { message: "Password reset successful" };
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      const responseData = axiosError.response.data as any;
      const errorMessage = responseData?.error || responseData?.message;

      if (axiosError.response.status === 400) {
        return rejectWithValue("Token invalide ou expiré");
      }
      if (axiosError.response.status === 404) {
        return rejectWithValue("Endpoint de réinitialisation non trouvé");
      }
      return rejectWithValue(
        errorMessage || `Erreur serveur: ${axiosError.response.status}`
      );
    }
    return rejectWithValue("Erreur réseau: Impossible de contacter le serveur");
  }
});

// changePassword
export const changePassword = createAsyncThunk<
void,
{ formData: IUserChangePassword },
{ rejectValue: string }
>("users/change-password", async ({ formData }, { rejectWithValue }) => {
  try {
    await axiosInstance.patch("/users/change-password", formData);
  } catch (error) {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      const responseData = axiosError.response.data as any;
      const errorMessage = responseData?.error || responseData?.message;

      if (axiosError.response.status === 400) {
        return rejectWithValue("Données invalides ou mot de passe incorrect");
      }
      if (axiosError.response.status === 401) {
        return rejectWithValue("Non authentifié");
      }
      return rejectWithValue(
        errorMessage || `Erreur serveur: ${axiosError.response.status}`
      );
    }
    return rejectWithValue("Erreur réseau: Impossible de contacter le serveur");
  }
});

// updateUserProfile
export const updateUserProfile = createAsyncThunk<
IUser,
FormData,
{ rejectValue: string }
>("users/update-profile", async (formData, { rejectWithValue }) => {
  try {
    const objData = Object.fromEntries(formData);
    console.log("objData ::>>>>", objData);

    const { data } = await axiosInstance.patch("/users", objData);
    console.log("data :UPDATE PROFILE:", data);

    return data.user;
  } catch (error) {
    console.error("UPDATE PROFILE ERROR CAUGHT:", error);
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      const responseData = axiosError.response.data as any;
      const errorMessage = responseData?.error;

      if (axiosError.response.status === 400) {
        return rejectWithValue("Données de profil invalides");
      }
      return rejectWithValue(
        errorMessage || `Erreur serveur: ${axiosError.response.status}`
      );
    }
    return rejectWithValue("Erreur réseau: Impossible de contacter le serveur");
  }
});

// Delete My Account
export const deleteMyAccount = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>("users/delete-account", async (_, { rejectWithValue }) => {
  try {
    await axiosInstance.delete("/users");
  } catch (error) {
    console.error("DELETE ACCOUNT ERROR CAUGHT:", error);
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      const responseData = axiosError.response.data as any;
      const errorMessage = responseData?.error;

      if (axiosError.response.status === 400) {
        return rejectWithValue("Impossible de supprimer le compte");
      }
      return rejectWithValue(
        errorMessage || `Erreur serveur: ${axiosError.response.status}`
      );
    }
    return rejectWithValue("Erreur réseau: Impossible de contacter le serveur");
  }
});

// Register
export const register = createAsyncThunk<
IUser,
FormData,
{ rejectValue: string }
>("auth/register", async (formData, { rejectWithValue }) => {
  try {
    const objData = Object.fromEntries(formData);
    console.log("objData ::>>>>", objData);

    const { data } = await axiosInstance.post("/auth/register", objData);
    console.log("data :REGISTER:", data);

    return data.user;
  } catch (error) {
    console.error("REGISTER ERROR CAUGHT:", error);
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      const responseData = axiosError.response.data as any;
      const errorMessage = responseData?.error;

      if (axiosError.response.status === 400) {
        return rejectWithValue("Données d'inscription invalides");
      }
      return rejectWithValue(
        errorMessage || `Erreur serveur: ${axiosError.response.status}`
      );
    } else if (axiosError.request) {
      console.log(">Network< error - no response");
      return rejectWithValue(
        "Erreur réseau: Impossible de contacter le serveur"
      );
    }
    return rejectWithValue(
      "Une erreur est survenue. Veuillez réessayer plus tard."
    );
  }
});

// **********************************************************************************
// ** Reducer & Associated Cases
// **********************************************************************************

const userReducer = createReducer(initialState, (builder) => {
  builder
    // Login
    .addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(login.fulfilled, (state, action) => {
      state.userInfo = action.payload;
      state.isAuth = true;
      state.loading = false;
      state.error = null;
      console.log("isAuth:", state.isAuth);
      console.log("UserInfo:", state.userInfo);
    })
    .addCase(login.rejected, (state, action) => {
      state.userInfo = null;
      state.isAuth = false;
      state.loading = false;
      state.error = action.payload || "Login failed";
      console.error("Login failed:", action.payload);
    })

    // Get User Info
    .addCase(getUserInfo.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(getUserInfo.fulfilled, (state, action) => {
      state.userInfo = action.payload;
      state.isAuth = true;
      state.loading = false;
    })
    .addCase(getUserInfo.rejected, (state) => {
      state.userInfo = null;
      state.isAuth = false;
      state.loading = false;
    })

    // logout
    .addCase(logout.fulfilled, (state) => {
      state.userInfo = null;
      state.isAuth = false;
    });
  // emailConfirmation
  builder
    .addCase(resendEmailConfirmation.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(resendEmailConfirmation.fulfilled, (state) => {
      state.loading = false;
    })
    .addCase(resendEmailConfirmation.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Email confirmation failed";
      console.error("Email confirmation failed:", action.payload);
    });
  // forgotPassword
  builder
    .addCase(forgotPassword.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(forgotPassword.fulfilled, (state) => {
      state.loading = false;
    })
    .addCase(forgotPassword.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Forgot password failed";
      console.error("Forgot password failed:", action.payload);
    });

  // resetPassword
  builder
    .addCase(resetPassword.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(resetPassword.fulfilled, (state) => {
      state.loading = false;
      state.error = null;
      console.log("Password reset successful");
    })
    .addCase(resetPassword.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Password reset failed";
      console.error("Password reset failed:", action.payload);
    });

  // changePassword
  builder
    .addCase(changePassword.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(changePassword.fulfilled, (state) => {
      state.loading = false;
      state.error = null;
      console.log("Password change successful");
    })
    .addCase(changePassword.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Password change failed";
      console.error("Password change failed:", action.payload);
    });

  // updateUserProfile
  builder
    .addCase(updateUserProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(updateUserProfile.fulfilled, (state, action) => {
      state.userInfo = action.payload;
      state.loading = false;
      state.error = null;
      console.log("Profile update successful");
    })
    .addCase(updateUserProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload) || "Profile update failed";
      console.error("Profile update failed:", action.payload);
    });

  // deleteMyAccount
  builder
    .addCase(deleteMyAccount.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(deleteMyAccount.fulfilled, (state) => {
      state.userInfo = null;
      state.isAuth = false;
      state.loading = false;
      state.error = null;
      console.log("Account deletion successful");
    })
    .addCase(deleteMyAccount.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload) || "Account deletion failed";
      console.error("Account deletion failed:", action.payload);
    });

  // register
  builder
    .addCase(register.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(register.fulfilled, (state, action) => {
      state.userInfo = action.payload;
      state.isAuth = false;
      state.loading = false;
      state.error = null;
      console.log("isAuth:", state.isAuth);
      console.log("UserInfo:", state.userInfo);
    })
    .addCase(register.rejected, (state, action) => {
      state.userInfo = null;
      state.isAuth = false;
      state.loading = false;
      state.error = action.payload || "Registration failed";
      console.error("Registration failed:", action.payload);
    });
});

export default userReducer;
