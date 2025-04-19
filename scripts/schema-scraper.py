import requests
from bs4 import BeautifulSoup
import json
import csv
from urllib.parse import urljoin
import time

def get_urls_from_sitemap(sitemap_url):
    response = requests.get(sitemap_url)
    urls = []
    
    # Simple parsing since this is a text sitemap
    for line in response.text.split('\n'):
        if 'https://' in line:
            # Extract just the URL without the XML tags
            url = line.split()[0].replace('<loc>', '').replace('</loc>', '')
            urls.append(url)
    
    return urls

def extract_schema_org_data(url):
    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find all script tags with type "application/ld+json"
        schema_tags = soup.find_all('script', type='application/ld+json')
        
        schema_data = []
        for tag in schema_tags:
            try:
                data = json.loads(tag.string)
                schema_data.append(data)
            except json.JSONDecodeError:
                print(f"Failed to parse JSON from {url}")
                continue
        
        return {
            'url': url,
            'schema_data': json.dumps(schema_data) if schema_data else ''
        }
    
    except Exception as e:
        print(f"Error processing {url}: {str(e)}")
        return {
            'url': url,
            'schema_data': f'Error: {str(e)}'
        }

def main():
    sitemap_url = 'https://modeaudio.com/sitemap'
    output_file = 'schema_org_data.csv'
    
    # Get all URLs from sitemap
    print("Fetching URLs from sitemap...")
    urls = get_urls_from_sitemap(sitemap_url)
    print(f"Found {len(urls)} URLs")
    
    # Process each URL and save results
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['url', 'schema_data']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for i, url in enumerate(urls, 1):
            print(f"Processing {i}/{len(urls)}: {url}")
            data = extract_schema_org_data(url)
            writer.writerow(data)
            
            # Be nice to the server
            time.sleep(1)
    
    print(f"\nDone! Results saved to {output_file}")

if __name__ == "__main__":
    main()