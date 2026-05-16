from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from .models import Notificacion

User = get_user_model()

class NotificationPerformanceTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@test.com', username='testuser', password='password123', role='estudiante')
        self.client.force_authenticate(user=self.user)
        # Create 100 notifications, 50 read, 50 unread
        for i in range(50):
            Notificacion.objects.create(usuario=self.user, mensaje=f'Read {i}', leido=True)
            Notificacion.objects.create(usuario=self.user, mensaje=f'Unread {i}', leido=False)

    def test_notificaciones_list_performance(self):
        # Test original behavior
        response = self.client.get('/api/v1/communication/notificaciones/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 100)

    def test_unread_only_filter(self):
        response = self.client.get('/api/v1/communication/notificaciones/?unread_only=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # This will fail before optimization
        self.assertEqual(len(response.data), 50)

    def test_count_only(self):
        response = self.client.get('/api/v1/communication/notificaciones/?count_only=true&unread_only=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # This will fail before optimization
        self.assertEqual(response.data['count'], 50)
