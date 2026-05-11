from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import User

class SecurityTests(APITestCase):
    def test_register_mass_assignment_role(self):
        """
        Test that a user cannot self-assign a sensitive role during registration.
        """
        url = reverse('auth-register')
        data = {
            'email': 'attacker@example.com',
            'username': 'attacker',
            'first_name': 'Attacker',
            'last_name': 'User',
            'password': 'Password123!',
            'password2': 'Password123!',
            'role': 'directivo'  # Attempting mass assignment
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email='attacker@example.com')
        # After fix, role should be default 'estudiante' even if 'directivo' was passed
        self.assertEqual(user.role, 'estudiante', "Security Failure: User was able to self-assign 'directivo' role during registration")

    def test_profile_update_mass_assignment_role(self):
        """
        Test that a user cannot change their role via profile update.
        """
        user = User.objects.create_user(
            email='user@example.com',
            username='user',
            password='Password123!',
            role='estudiante'
        )
        self.client.force_authenticate(user=user)

        url = reverse('auth-profile-update')
        data = {
            'role': 'directivo'
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        # After fix, role should remain 'estudiante'
        self.assertEqual(user.role, 'estudiante', "Security Failure: User was able to change their role to 'directivo' via profile update")

    def test_profile_update_mass_assignment_must_change_password(self):
        """
        Test that a user cannot bypass mandatory password change via profile update.
        """
        user = User.objects.create_user(
            email='user2@example.com',
            username='user2',
            password='Password123!',
            must_change_password=True
        )
        self.client.force_authenticate(user=user)

        url = reverse('auth-profile-update')
        data = {
            'must_change_password': False
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        # After fix, must_change_password should remain True
        self.assertTrue(user.must_change_password, "Security Failure: User was able to bypass must_change_password via profile update")
