import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '../services/socketService';
import { socketService } from '../services/socketService';

const STORAGE_KEY = 'collaboration-board-user';

export const useUserStore = defineStore('user', () => {
    const currentUser = ref<Omit<User, 'isOnline'> | null>(null);
    const onlineUsers = ref<User[]>([]);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const isAuthenticated = computed(() => currentUser.value !== null);
    const isConnected = computed(() => onlineUsers.value.length > 0);
    const otherUsers = computed(() => {
        if (!currentUser.value) return onlineUsers.value;
        return onlineUsers.value.filter(u => u.socketId !== currentUser.value!.socketId);
    });

    const userCount = computed(() => onlineUsers.value.length);

    const setCurrentUser = (user: Omit<User, 'isOnline'> | null) => {
        currentUser.value = user;
        if (user) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            error.value = null;
        } else {
            localStorage.removeItem(STORAGE_KEY);
            error.value = null;
        }
    };


    const setOnlineUsers = (users: User[]) => {
        onlineUsers.value = users;
    };

    const addOnlineUser = (user: User) => {
        const exists = onlineUsers.value.find(u => u.socketId === user.socketId);
        if (!exists) {
            onlineUsers.value.push(user);
        }
    };

    const removeOnlineUser = (socketId: string) => {
        onlineUsers.value = onlineUsers.value.filter(u => u.socketId !== socketId);
    };

    const setLoading = (loading: boolean) => {
        isLoading.value = loading;
    };

    const setError = (msg: string | null) => {
        error.value = msg;
    };

    const reset = () => {
        currentUser.value = null;
        onlineUsers.value = [];
        error.value = null;
        isLoading.value = false;
        localStorage.removeItem(STORAGE_KEY);
    };


    const loadFromStorage = () => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const user = JSON.parse(stored);
                currentUser.value = user;
            } catch (e) {
                console.error('Error loading user from storage:', e);
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    };

    const logout = async () => {
        socketService.disconnect();
        reset();
    };

    return {
        currentUser,
        onlineUsers,
        isLoading,
        error,

        isAuthenticated,
        isConnected,
        otherUsers,
        userCount,

        setCurrentUser,
        setOnlineUsers,
        addOnlineUser,
        removeOnlineUser,
        setLoading,
        setError,
        reset,
        loadFromStorage,
        logout
    };
});
