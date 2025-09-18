import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { 
    LoginRequest, 
    RegisterRequest, 
    CreateMemberRequest, 
    UpdateMemberRequest,
    CreateMembershipRequest,
    CreatePaymentRequest,
    CreateClassRequest 
} from '../../types/api';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: BASE_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors(): void {
        // Request interceptor
        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('authToken');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor
        this.api.interceptors.response.use(
            (response: AxiosResponse) => response,
            (error) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('authToken');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    // Generic HTTP methods
    async get<T>(url: string): Promise<T> {
        const response = await this.api.get<T>(url);
        return response.data;
    }

    async post<T>(url: string, data?: unknown): Promise<T> {
        const response = await this.api.post<T>(url, data);
        return response.data;
    }

    async put<T>(url: string, data?: unknown): Promise<T> {
        const response = await this.api.put<T>(url, data);
        return response.data;
    }

    async delete<T>(url: string): Promise<T> {
        const response = await this.api.delete<T>(url);
        return response.data;
    }

    // Auth endpoints
    async login(credentials: LoginRequest) {
        return this.post('/auth/login', credentials);
    }

    async register(userData: RegisterRequest) {
        return this.post('/auth/register', userData);
    }

    async logout() {
        return this.post('/auth/logout');
    }

    // Member endpoints
    async getMembers() {
        return this.get('/members');
    }

    async getMember(id: string) {
        return this.get(`/members/${id}`);
    }

    async createMember(memberData: CreateMemberRequest) {
        return this.post('/members', memberData);
    }

    async updateMember(id: string, memberData: UpdateMemberRequest) {
        return this.put(`/members/${id}`, memberData);
    }

    async deleteMember(id: string) {
        return this.delete(`/members/${id}`);
    }

    // Membership endpoints
    async getMemberships() {
        return this.get('/memberships');
    }

    async createMembership(membershipData: CreateMembershipRequest) {
        return this.post('/memberships', membershipData);
    }

    // Payment endpoints
    async getPayments() {
        return this.get('/payments');
    }

    async createPayment(paymentData: CreatePaymentRequest) {
        return this.post('/payments', paymentData);
    }

    // Class/Training endpoints
    async getClasses() {
        return this.get('/classes');
    }

    async createClass(classData: CreateClassRequest) {
        return this.post('/classes', classData);
    }

    async bookClass(classId: string, memberId: string) {
        return this.post(`/classes/${classId}/book`, { memberId });
    }
}

export default new ApiService();