#!/bin/bash
# Script to restore paid search data on production
# Run this on the production server

set -e

echo "🔧 Restoring paid search data on production..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Seed channel classifications
echo -e "${YELLOW}📊 Step 1: Seeding channel classifications...${NC}"
docker-compose exec backend python manage.py seed_channel_classifications

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Channel classifications seeded${NC}"
else
    echo -e "${RED}❌ Failed to seed channel classifications${NC}"
    exit 1
fi

# Step 2: Update channel classifications
echo -e "${YELLOW}🔄 Step 2: Updating channel classification rules...${NC}"
docker-compose exec backend python manage.py update_channel_classifications

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Channel classification rules updated${NC}"
else
    echo -e "${RED}❌ Failed to update channel classifications${NC}"
    exit 1
fi

# Step 3: Verify channel classifications are present
echo -e "${YELLOW}🔍 Step 3: Verifying channel classifications...${NC}"
docker-compose exec backend python manage.py shell -c "
from woocommerce.models import ChannelClassification
ps_count = ChannelClassification.objects.filter(channel_type='Paid Search').count()
print(f'Paid Search rules in database: {ps_count}')
if ps_count > 0:
    print('✅ Channel classifications are properly configured')
else:
    print('❌ No Paid Search rules found')
"

echo ""
echo -e "${GREEN}🎉 Paid search restoration complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Check if there's existing WooCommerce data in the database"
echo "2. If data exists, the channel classifications will apply to it"
echo "3. For new data, ensure WooCommerce sync is configured"
echo ""












