export type AuthContextValue = {
    user: User | null;
    isLoading: boolean;
    login: (username: string) => Promise<void>;
    logout: () => void;
};

export type User = {
    id: string;
    username: string;
};