from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from users.models import User

User = get_user_model()

class Command(BaseCommand):
    help = 'Update a user\'s role to super_admin'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email of the user to update')
        parser.add_argument('--role', type=str, default='super_admin', help='Role to assign (default: super_admin)')

    def handle(self, *args, **options):
        email = options['email']
        role = options['role']
        
        try:
            user = User.objects.get(email=email)
            old_role = user.role
            user.role = role
            user.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully updated user {email} from role "{old_role}" to "{role}"'
                )
            )
        except User.DoesNotExist:
            raise CommandError(f'User with email "{email}" does not exist')
        except Exception as e:
            raise CommandError(f'Error updating user: {str(e)}') 