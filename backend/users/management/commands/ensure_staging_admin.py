from django.core.management.base import BaseCommand
from users.models import User


class Command(BaseCommand):
    help = 'Ensure a staging admin user exists'

    def add_arguments(self, parser):
        parser.add_argument('--username', default='staging_admin')
        parser.add_argument('--email', default='staging@veveve.dk')
        parser.add_argument('--password', default='StagingAdmin123!')

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']

        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.SUCCESS(f'Staging admin user already exists: {username}'))
            return

        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )
        user.role = 'super_admin'
        user.save()

        self.stdout.write(self.style.SUCCESS(f'Created staging admin user: {username}'))
