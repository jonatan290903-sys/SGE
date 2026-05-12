from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import User

class SecurityTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='password123',
            role='estudiante'
        )
        self.client.force_authenticate(user=self.user)

    def test_mass_assignment_role_update_profile(self):
        """Test that a user cannot change their own role via profile update."""
        url = reverse('auth-profile-update')
        data = {'role': 'directivo'}
        response = self.client.patch(url, data)

        self.user.refresh_from_db()
        self.assertEqual(self.user.role, 'estudiante')

    def test_mass_assignment_must_change_password_update_profile(self):
        """Test that a user cannot change must_change_password via profile update."""
        self.user.must_change_password = True
        self.user.save()

        url = reverse('auth-profile-update')
        data = {'must_change_password': False}
        response = self.client.patch(url, data)

        self.user.refresh_from_db()
        self.assertTrue(self.user.must_change_password)

    def test_mass_assignment_role_registration(self):
        """Test that a user cannot register with a privileged role."""
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
        self.client.logout()
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email='newadmin@example.com')
        self.assertEqual(user.role, 'estudiante')
