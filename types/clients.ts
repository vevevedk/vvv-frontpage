import { Account } from "next-auth";

export enum AccountType {
    GoogleAds = 'Google Ads',
    GoogleAnalytics = 'Google Analytics'
}

// types/clients.ts
export interface Client {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface ClientAccount {
    id: number;
    client_id: number;
    account_name: string;
    account_type: AccountType;
    locations: number[];
    account_id: string;
    created_at: string;
    updated_at: string;
}

export interface ClientWithAccounts extends Client {
    accounts: ClientAccount[];
}