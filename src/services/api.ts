import axios, { AxiosResponse } from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface Message {
  _id: string;
  sender: User;
  recipient: User;
  content: string;
  messageType: "text" | "image" | "file";
  isRead: boolean;
  readAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  user: User;
  lastMessage: {
    content: string;
    createdAt: string;
    sender: string;
    messageType: string;
  };
  unreadCount: number;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface MessageData {
  recipient: string;
  content: string;
  messageType?: "text" | "image" | "file";
}

// Auth API calls
export const authAPI = {
  login: (data: LoginData): Promise<AxiosResponse<AuthResponse>> =>
    api.post("/auth/login", data),

  register: (data: RegisterData): Promise<AxiosResponse<AuthResponse>> =>
    api.post("/auth/register", data),

  logout: (): Promise<AxiosResponse<{ message: string }>> =>
    api.post("/auth/logout"),

  getCurrentUser: (): Promise<AxiosResponse<User>> => api.get("/auth/me"),

  getUsers: (): Promise<AxiosResponse<User[]>> => api.get("/auth/users"),
};

// Message API calls
export const messageAPI = {
  sendMessage: (data: MessageData): Promise<AxiosResponse<Message>> =>
    api.post("/messages", data),

  getConversation: (
    userId: string,
    page = 1,
    limit = 50
  ): Promise<
    AxiosResponse<{
      messages: Message[];
      page: number;
      hasMore: boolean;
    }>
  > => api.get(`/messages/conversation/${userId}?page=${page}&limit=${limit}`),

  getConversations: (): Promise<AxiosResponse<Conversation[]>> =>
    api.get("/messages/conversations"),

  markAsRead: (userId: string): Promise<AxiosResponse<{ message: string }>> =>
    api.put(`/messages/read/${userId}`),
};

export default api;
