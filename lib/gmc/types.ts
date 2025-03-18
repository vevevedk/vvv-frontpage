export interface GMCConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    merchantId: string;
}

export interface GMCProduct {
    id: string;
    title: string;
    brand?: string;
    productTypes: string[];
    googleProductCategory?: string;
    availability: 'in_stock' | 'out_of_stock' | 'preorder' | 'backorder';
    condition: 'new' | 'refurbished' | 'used';
    price: {
        value: string;
        currency: string;
    };
    targetCountry: string;
    channel: 'online' | 'local';
    identifiers?: {
        brand?: string;
        mpn?: string;
        gtin?: string;
    };
}

export interface GMCProductList {
    kind: string;
    nextPageToken?: string;
    resources: GMCProduct[];
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
}

export interface GMCAuthConfig {
    installed: {
        client_id: string;
        project_id: string;
        auth_uri: string;
        token_uri: string;
        auth_provider_x509_cert_url: string;
        client_secret: string;
        redirect_uris: string[];
    };
} 