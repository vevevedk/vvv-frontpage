import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GMCConfig, GMCProduct, GMCProductList, TokenResponse } from './types';

export class GMCClient {
    private oauth2Client: OAuth2Client;
    private merchantId: string;
    private content: any; // Will be initialized with google.content

    constructor(config: GMCConfig) {
        this.oauth2Client = new google.auth.OAuth2(
            config.clientId,
            config.clientSecret,
            config.redirectUri
        );
        this.merchantId = config.merchantId;
        this.content = google.content('v2.1');
    }

    /**
     * Get the URL for OAuth2 authentication
     */
    getAuthUrl(): string {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/content']
        });
    }

    /**
     * Set credentials from stored tokens
     */
    setCredentials(tokens: TokenResponse): void {
        this.oauth2Client.setCredentials(tokens);
    }

    /**
     * Get tokens from authorization code
     */
    async getTokens(code: string): Promise<TokenResponse> {
        const { tokens } = await this.oauth2Client.getToken(code);
        this.oauth2Client.setCredentials(tokens);
        return tokens as TokenResponse;
    }

    /**
     * Fetch products with pagination
     */
    async listProducts(pageToken?: string): Promise<GMCProductList> {
        try {
            const response = await this.content.products.list({
                auth: this.oauth2Client,
                merchantId: this.merchantId,
                pageToken,
                maxResults: 250 // Maximum allowed by the API
            });

            return {
                kind: response.data.kind,
                nextPageToken: response.data.nextPageToken,
                resources: response.data.resources as GMCProduct[]
            };
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    }

    /**
     * Fetch all products (handles pagination automatically)
     */
    async getAllProducts(): Promise<GMCProduct[]> {
        let allProducts: GMCProduct[] = [];
        let pageToken: string | undefined;

        do {
            const response = await this.listProducts(pageToken);
            allProducts = allProducts.concat(response.resources);
            pageToken = response.nextPageToken;
        } while (pageToken);

        return allProducts;
    }

    /**
     * Get product series from all products
     */
    async getProductSeries(): Promise<GMCProduct[]> {
        const products = await this.getAllProducts();
        
        // Filter products that are part of a series
        // This is a basic implementation - you might need to adjust the logic
        // based on your specific product series identification criteria
        return products.filter(product => {
            // Example criteria - you should adjust these based on your needs:
            // 1. Has product types
            // 2. Brand is present
            // 3. Has series identifier in title or product types
            return (
                product.productTypes?.length > 0 &&
                product.brand &&
                (product.title.toLowerCase().includes('series') ||
                 product.productTypes.some(type => type.toLowerCase().includes('series')))
            );
        });
    }

    /**
     * Refresh access token if needed
     */
    async refreshAccessToken(): Promise<TokenResponse | null> {
        if (!this.oauth2Client.credentials.refresh_token) {
            return null;
        }

        try {
            const { credentials } = await this.oauth2Client.refreshAccessToken();
            return credentials as TokenResponse;
        } catch (error) {
            console.error('Error refreshing access token:', error);
            throw error;
        }
    }
} 