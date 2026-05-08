from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import User

class SecurityTests(APITestCase):
    def test_registration_role_spoofing(self):
        """Verify that a user cannot register with a privileged role."""
        url = reverse('auth-register')
        data = {
            'email': 'attacker@example.com',
            'username': 'attacker',
            'first_name': 'Attacker',
            'last_name': 'User',
            'password': 'password123',
            'password2': 'password123',
            'role': 'administrativo'  # Attempting to register as admin
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email='attacker@example.com')
        # Should be 'estudiante' regardless of the 'role' passed in the request
        self.assertEqual(user.role, 'estudiante')

    def test_profile_update_role_spoofing(self):
        """Verify that a user cannot update their own role."""
        user = User.objects.create_user(
            email='user@example.com',
            username='user',
            password='password123',
            role='estudiante'
        )
        self.client.force_authenticate(user=user)

        url = reverse('auth-profile-update')
        data = {
            'role': 'administrativo'  # Attempting to upgrade role
        }
        response = self.client.put(url, data)
        # Depending on serializer implementation, it might ignore the field or return success but not update it
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        self.assertEqual(user.role, 'estudiante')
