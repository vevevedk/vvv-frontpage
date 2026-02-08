import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0009_add_company_currency_code'),
    ]

    operations = [
        migrations.CreateModel(
            name='GA4Daily',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('source', models.CharField(default='', max_length=255)),
                ('medium', models.CharField(default='', max_length=255)),
                ('campaign', models.CharField(default='', max_length=255)),
                ('device_category', models.CharField(default='', max_length=50)),
                ('country', models.CharField(default='', max_length=100)),
                ('sessions', models.IntegerField(default=0)),
                ('total_users', models.IntegerField(default=0)),
                ('new_users', models.IntegerField(default=0)),
                ('engaged_sessions', models.IntegerField(default=0)),
                ('conversions', models.IntegerField(default=0)),
                ('purchase_revenue', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('engagement_rate', models.FloatField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('account_configuration', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ga4_daily_rows', to='users.accountconfiguration')),
            ],
            options={
                'db_table': 'ga4_daily',
                'ordering': ['-date'],
            },
        ),
        migrations.AddIndex(
            model_name='ga4daily',
            index=models.Index(fields=['account_configuration', 'date'], name='ga4_daily_config_date'),
        ),
        migrations.AddIndex(
            model_name='ga4daily',
            index=models.Index(fields=['date'], name='ga4_daily_date'),
        ),
        migrations.AddConstraint(
            model_name='ga4daily',
            constraint=models.UniqueConstraint(fields=('account_configuration', 'date', 'source', 'medium', 'campaign', 'device_category', 'country'), name='ga4_daily_unique_dims'),
        ),
    ]
