import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('google_pipelines', '0001_initial'),
        ('users', '0009_add_company_currency_code'),
    ]

    operations = [
        migrations.CreateModel(
            name='GSCSearchData',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('query', models.CharField(default='', max_length=500)),
                ('page', models.URLField(default='', max_length=2048)),
                ('clicks', models.IntegerField(default=0)),
                ('impressions', models.IntegerField(default=0)),
                ('ctr', models.FloatField(default=0)),
                ('position', models.FloatField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('account_configuration', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='gsc_search_rows',
                    to='users.accountconfiguration',
                )),
            ],
            options={
                'db_table': 'gsc_search_data',
                'ordering': ['-date'],
            },
        ),
        migrations.AddIndex(
            model_name='gscsearchdata',
            index=models.Index(fields=['account_configuration', 'date'], name='gsc_search_config_date'),
        ),
        migrations.AddIndex(
            model_name='gscsearchdata',
            index=models.Index(fields=['date'], name='gsc_search_date'),
        ),
        migrations.AddConstraint(
            model_name='gscsearchdata',
            constraint=models.UniqueConstraint(
                fields=('account_configuration', 'date', 'query', 'page'),
                name='gsc_search_unique_dims',
            ),
        ),
    ]
