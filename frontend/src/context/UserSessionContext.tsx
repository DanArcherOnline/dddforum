import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "../registration/types";

type UserSessionContextValue = {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
};

const UserSessionContext = createContext<UserSessionContextValue | null>(null);

export function UserSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);

  const setUser = useCallback((next: User) => {
    setUserState(next);
  }, []);

  const clearUser = useCallback(() => {
    setUserState(null);
  }, []);

  const value = useMemo(
    () => ({ user, setUser, clearUser }),
    [user, setUser, clearUser],
  );

  return (
    <UserSessionContext.Provider value={value}>
      {children}
    </UserSessionContext.Provider>
  );
}

export function useUserSession(): UserSessionContextValue {
  const ctx = useContext(UserSessionContext);
  if (ctx === null) {
    throw new Error("useUserSession must be used within UserSessionProvider.");
  }
  return ctx;
}
