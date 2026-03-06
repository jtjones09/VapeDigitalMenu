import { createContext, useContext, type ReactNode } from "react";
import { useUser, useAuth as useClerkAuth, useClerk } from "@clerk/clerk-react";

interface AuthContextType {
  user: { id: string; email?: string } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { getToken, isLoaded: authLoaded } = useClerkAuth();
  const { signOut: clerkSignOut } = useClerk();

  const isLoading = !userLoaded || !authLoaded;

  const user = clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
      }
    : null;

  const signOut = async () => {
    await clerkSignOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!clerkUser,
        signOut,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
