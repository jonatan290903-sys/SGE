from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

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

    def test_mass_assignment_role_update(self):
        # Attempt to escalate privilege via profile update
        response = self.client.patch('/api/v1/auth/profile/update/', {'role': 'directivo'}, format='json')
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, 'estudiante', "User was able to change their role via profile update!")

    def test_mass_assignment_must_change_password_update(self):
        # Attempt to change must_change_password via profile update
        self.user.must_change_password = True
        self.user.save()

        response = self.client.patch('/api/v1/auth/profile/update/', {'must_change_password': False}, format='json')
        self.user.refresh_from_db()
        self.assertTrue(self.user.must_change_password, "User was able to change must_change_password via profile update!")

    def test_registration_role_assignment(self):
        # Attempt to register as a directivo
        registration_data = {
            'email': 'newadmin@example.com',
            'username': 'newadmin',
            'first_name': 'New',
            'last_name': 'Admin',
            'role': 'directivo',
            'password': 'password123',
            'password2': 'password123'
        }
        self.client.force_authenticate(user=None)
        response = self.client.post('/api/v1/auth/register/', registration_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        new_user = User.objects.get(email='newadmin@example.com')
        self.assertEqual(new_user.role, 'estudiante', "New user was able to assign themselves a sensitive role during registration!")
