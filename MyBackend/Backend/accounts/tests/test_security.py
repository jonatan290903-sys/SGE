from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User

class SecurityTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='password123',
            role='estudiante'
        )
        self.client.force_authenticate(user=self.user)

    def test_mass_assignment_role_update(self):
        """Test that a user cannot change their own role."""
        url = reverse('auth-profile-update')
        data = {'role': 'directivo'}
        response = self.client.patch(url, data)
        # It might return 200 but the role should NOT change
        self.user.refresh_from_db()
        self.assertNotEqual(self.user.role, 'directivo', "User should not be able to change their own role")

    def test_mass_assignment_register_role(self):
        """Test that a new user cannot register with a privileged role."""
        self.client.force_authenticate(user=None)
        url = reverse('auth-register')
        data = {
            'email': 'newadmin@example.com',
            'username': 'newadmin',
            'first_name': 'New',
            'last_name': 'Admin',
            'password': 'password123',
            'password2': 'password123',
            'role': 'directivo'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email='newadmin@example.com')
        self.assertNotEqual(user.role, 'directivo', "User should not be able to register as directivo")
