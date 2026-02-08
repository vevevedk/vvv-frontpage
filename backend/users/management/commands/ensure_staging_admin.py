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

        user = User.objects.filter(username=username).first()
        if user:
            # Update existing user
            user.email = email
            user.set_password(password)
            user.role = 'super_admin'
            user.is_superuser = True
            user.is_staff = True
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Updated staging admin user: {username} ({email})'))
            return

        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )
        user.role = 'super_admin'
        user.save()

        self.stdout.write(self.style.SUCCESS(f'Created staging admin user: {username} ({email})'))
