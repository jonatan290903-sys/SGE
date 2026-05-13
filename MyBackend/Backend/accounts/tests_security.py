from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import User

class SecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='password123',
            role='estudiante'
        )
        self.client.force_authenticate(user=self.user)

    def test_mass_assignment_role_update(self):
        """Verify that a user cannot change their own role via profile update."""
        url = reverse('auth-profile-update')
        data = {'role': 'administrativo'}

        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        # This SHOULD fail if the vulnerability exists (i.e., it will be 'administrativo')
        # Sentinel wants to fix this so it remains 'estudiante'
        self.assertEqual(self.user.role, 'estudiante', "User was able to change their role!")

    def test_mass_assignment_must_change_password_update(self):
        """Verify that a user cannot change must_change_password status."""
        self.user.must_change_password = True
        self.user.save()

        url = reverse('auth-profile-update')
        data = {'must_change_password': False}

        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertTrue(self.user.must_change_password, "User was able to change must_change_password!")

    def test_mass_assignment_registration_role(self):
        """Verify that a user cannot choose their role during registration."""
        self.client.logout()
        url = reverse('auth-register')
        data = {
            'email': 'newuser@example.com',
            'username': 'newuser',
            'password': 'password123',
            'password2': 'password123',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'directivo'
        }

        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        new_user = User.objects.get(email='newuser@example.com')
        self.assertEqual(new_user.role, 'estudiante', "User was able to register with a custom role!")
