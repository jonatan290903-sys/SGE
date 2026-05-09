from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from .models import User

class SecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='user@test.com',
            username='testuser',
            password='password123',
            role='estudiante'
        )
        self.client.force_authenticate(user=self.user)

    def test_user_cannot_change_role(self):
        """Verify that a user cannot change their own role."""
        url = reverse('auth-profile-update')
        data = {'role': 'directivo'}
        response = self.client.patch(url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        # Role should remain 'estudiante'
        self.assertEqual(self.user.role, 'estudiante')

    def test_register_cannot_specify_role(self):
        """Verify that a user cannot specify a role during registration."""
        url = reverse('auth-register')
        data = {
            'email': 'newuser@test.com',
            'username': 'newuser',
            'first_name': 'New',
            'last_name': 'User',
            'password': 'password123',
            'password2': 'password123',
            'role': 'directivo'
        }
        # Clear authentication for registration
        self.client.force_authenticate(user=None)
        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_user = User.objects.get(email='newuser@test.com')
        # Role should be the default 'estudiante', not 'directivo'
        self.assertEqual(new_user.role, 'estudiante')
