from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from .models import User

class SecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('auth-register')
        self.update_profile_url = reverse('auth-profile-update')

    def test_registration_mass_assignment_role(self):
        """Verify that a user cannot register with a privileged role."""
        data = {
            'email': 'attacker@example.com',
            'username': 'attacker',
            'first_name': 'Attacker',
            'last_name': 'User',
            'password': 'password123',
            'password2': 'password123',
            'role': 'administrativo'
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email='attacker@example.com')
        # If the vulnerability exists, the role will be 'administrativo'
        # If fixed, it should be the default 'estudiante' or 'role' should be ignored
        self.assertNotEqual(user.role, 'administrativo')

    def test_update_profile_mass_assignment_role(self):
        """Verify that a user cannot change their own role via profile update."""
        user = User.objects.create_user(
            email='user@example.com',
            username='user',
            password='password123',
            role='estudiante'
        )
        self.client.force_authenticate(user=user)

        data = {'role': 'directivo'}
        response = self.client.patch(self.update_profile_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        self.assertEqual(user.role, 'estudiante')
        self.assertNotEqual(user.role, 'directivo')
