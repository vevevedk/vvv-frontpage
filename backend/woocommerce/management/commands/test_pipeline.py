from django.core.management.base import BaseCommand
from django.db.models import Count, Sum, Avg
from woocommerce.models import WooCommerceOrder, WooCommerceJob, WooCommerceSyncLog
from users.models import AccountConfiguration

class Command(BaseCommand):
    help = 'Test WooCommerce pipeline status and data'

    def handle(self, *args, **options):
        self.stdout.write("🚀 WooCommerce Pipeline Test")
        self.stdout.write("=" * 40)

        # Check configurations
        configs = AccountConfiguration.objects.filter(config_type='woocommerce')
        self.stdout.write(f"📋 WooCommerce Configurations: {configs.count()}")
        
        for config in configs:
            self.stdout.write(f"  - {config.account.name}: {config.name}")

        # Check orders
        orders = WooCommerceOrder.objects.all()
        self.stdout.write(f"📦 Total Orders: {orders.count()}")

        if orders.exists():
            latest_order = orders.order_by('-date_created').first()
            self.stdout.write(f"  - Latest Order: {latest_order.date_created}")
            
            # Basic metrics
            total_revenue = orders.aggregate(Sum('total'))['total__sum'] or 0
            avg_order_value = orders.aggregate(Avg('total'))['total__avg'] or 0
            
            self.stdout.write(f"💰 Total Revenue: ${total_revenue:,.2f}")
            self.stdout.write(f"💵 Average Order Value: ${avg_order_value:.2f}")
            
            # Orders by client
            orders_by_client = orders.values('client_name').annotate(count=Count('id'))
            self.stdout.write("📊 Orders by Client:")
            for client in orders_by_client:
                self.stdout.write(f"  • {client['client_name']}: {client['count']} orders")
            
            # Orders by status
            status_breakdown = orders.values('status').annotate(count=Count('id'))
            self.stdout.write("📈 Orders by Status:")
            for status in status_breakdown:
                percentage = (status['count'] / orders.count()) * 100
                self.stdout.write(f"  • {status['status']}: {status['count']} ({percentage:.1f}%)")

        # Check jobs
        jobs = WooCommerceJob.objects.all()
        self.stdout.write(f"⚙️ Total Jobs: {jobs.count()}")

        if jobs.exists():
            recent_jobs = jobs.order_by('-created_at')[:5]
            self.stdout.write("Recent Jobs:")
            for job in recent_jobs:
                self.stdout.write(f"  • {job.client_name}: {job.job_type} - {job.status} ({job.created_at})")

        # Check logs
        logs = WooCommerceSyncLog.objects.all()
        self.stdout.write(f"📝 Total Sync Logs: {logs.count()}")

        if logs.exists():
            error_logs = logs.filter(level='ERROR')
            self.stdout.write(f"❌ Error Logs: {error_logs.count()}")
            
            recent_logs = logs.order_by('-created_at')[:3]
            self.stdout.write("Recent Log Messages:")
            for log in recent_logs:
                self.stdout.write(f"  • {log.level}: {log.message}")

        # Pipeline health assessment
        self.stdout.write("\n🏥 Pipeline Health:")
        if not configs.exists():
            self.stdout.write("❌ No WooCommerce configurations found")
        elif not orders.exists():
            self.stdout.write("⚠️ No order data - pipeline may need to sync")
        else:
            self.stdout.write("✅ Pipeline appears to be working with data")

        self.stdout.write("\n✅ Pipeline test completed!")