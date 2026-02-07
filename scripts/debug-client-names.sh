#!/bin/bash
# Debug client names in WooCommerce orders
# Run: bash scripts/debug-client-names.sh

cd /var/www/vvv-frontpage

echo "=== Client names stored in orders ==="
docker-compose exec -T backend python manage.py shell << 'EOF'
from woocommerce.models import WooCommerceOrder
from django.db.models import Count

names = WooCommerceOrder.objects.values('client_name').annotate(count=Count('id')).order_by('-count')
for n in names:
    print(f"{n['client_name']}: {n['count']} orders")
EOF

echo ""
echo "=== Distinct client names (what API returns) ==="
docker-compose exec -T backend python manage.py shell << 'EOF'
from woocommerce.models import WooCommerceOrder
names = list(WooCommerceOrder.objects.exclude(client_name__isnull=True).exclude(client_name='').values_list('client_name', flat=True).distinct())
print(names)
EOF

echo ""
echo "=== Account configurations ==="
docker-compose exec -T backend python manage.py shell << 'EOF'
from users.models import Account, AccountConfiguration

for acc in Account.objects.all():
    configs = AccountConfiguration.objects.filter(account=acc)
    if configs.exists():
        print(f"Account: {acc.name} (id={acc.id})")
        for cfg in configs:
            print(f"  Config: {cfg.store_url}")
EOF
