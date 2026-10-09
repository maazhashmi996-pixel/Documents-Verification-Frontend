export type RoleKey = 'student' | 'university' | 'admin';

export interface RoleConfig {
    key: RoleKey;
    title: string;
    blurb: string;
    signupNote: string;
    accent: string;      // main colour
    solid: string;       // button fill (white text stays readable)
    article: string;     // 'a' / 'an'
    accentDeep: string;  // text-safe on white
    soft: string;        // tinted background
    dashboard: string;
}

export const ROLES: Record<RoleKey, RoleConfig> = {
    student: {
        key: 'student',
        title: 'Student',
        blurb: 'Upload your academic documents and follow each one through verification.',
        signupNote: 'We will email you a 6-digit code to confirm your address.',
        accent: '#2c4a8c',
        solid: '#2c4a8c',
        article: 'a',
        accentDeep: '#223a70',
        soft: '#eaf0fb',
        dashboard: '/student-dashboard',
    },
    university: {
        key: 'university',
        title: 'University',
        blurb: 'Look up a student by passport number and confirm their verified records.',
        signupNote: 'New university accounts are approved by the admin before first sign in.',
        accent: '#1e6b5a',
        solid: '#1e6b5a',
        article: 'a',
        accentDeep: '#17554a',
        soft: '#e6f3ef',
        dashboard: '/university/dashboard',
    },
    admin: {
        key: 'admin',
        title: 'Admin',
        blurb: 'Review documents, manage users and approve university accounts.',
        signupNote: 'Only one admin account can exist. We will email you a 6-digit code.',
        accent: '#b8924a',
        solid: '#8f6d2e',
        article: 'an',
        accentDeep: '#7d5f24',
        soft: '#f8f1e2',
        dashboard: '/admin',
    },
};

export const isRole = (value: unknown): value is RoleKey =>
    typeof value === 'string' && value in ROLES;
