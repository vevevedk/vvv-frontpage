import { config } from 'dotenv';
import { GMCClient } from '@/lib/gmc/client';
import { GMCConfig, TokenResponse } from '@/lib/gmc/types';
import * as fs from 'fs/promises';
import * as path from 'path';

// Load environment variables
config();

const GMC_CONFIG: GMCConfig = {
    clientId: process.env.GMC_CLIENT_ID!,
    clientSecret: process.env.GMC_CLIENT_SECRET!,
    redirectUri: process.env.GMC_REDIRECT_URI!,
    merchantId: process.env.GMC_MERCHANT_ID!
};

// Token storage path
const TOKEN_PATH = path.join(__dirname, '../.gmc-token.json');

async function main() {
    const client = new GMCClient(GMC_CONFIG);

    try {
        // Try to load existing tokens
        let tokens: TokenResponse;
        try {
            const tokenData = await fs.readFile(TOKEN_PATH, 'utf-8');
            tokens = JSON.parse(tokenData);
            client.setCredentials(tokens);
        } catch (error) {
            // If no tokens exist, start OAuth flow
            console.log('No stored tokens found. Starting OAuth flow...');
            console.log('Please visit this URL to authorize the application:');
            console.log(client.getAuthUrl());
            
            // In a real application, you would handle the OAuth callback
            // For this test, you can paste the code manually
            const code = process.argv[2]; // Get authorization code from command line
            if (!code) {
                console.log('Please provide the authorization code as a command line argument');
                process.exit(1);
            }

            tokens = await client.getTokens(code);
            await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
        }

        // Test product fetching
        console.log('Fetching products...');
        const products = await client.getAllProducts();
        console.log(`Found ${products.length} products`);

        // Test product series filtering
        console.log('Filtering product series...');
        const series = await client.getProductSeries();
        console.log(`Found ${series.length} product series`);

        // Save sample data for analysis
        const sampleData = {
            totalProducts: products.length,
            totalSeries: series.length,
            sampleProducts: products.slice(0, 5),
            sampleSeries: series.slice(0, 5)
        };

        await fs.writeFile(
            path.join(__dirname, '../sample-gmc-data.json'),
            JSON.stringify(sampleData, null, 2)
        );

        console.log('Sample data saved to sample-gmc-data.json');

    } catch (error) {
        console.error('Error:', error);
    }
}

main(); 