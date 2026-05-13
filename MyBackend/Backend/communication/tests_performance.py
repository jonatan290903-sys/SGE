from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from .models import Notificacion

User = get_user_model()

class NotificacionPerformanceTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='password123',
            role='estudiante'
        )
        self.client.force_authenticate(user=self.user)

        # Create some notifications
        Notificacion.objects.create(usuario=self.user, mensaje='Unread 1', leido=False)
        Notificacion.objects.create(usuario=self.user, mensaje='Unread 2', leido=False)
        Notificacion.objects.create(usuario=self.user, mensaje='Read 1', leido=True)

    def test_get_all_notificaciones(self):
        url = reverse('notificaciones-list')
        response = self.client.get(url)
        self.assertEqual(len(response.data), 3)

    def test_get_unread_only(self):
        url = reverse('notificaciones-list')
        response = self.client.get(url, {'unread_only': 'true'})
        self.assertEqual(len(response.data), 2)
        for n in response.data:
            self.assertFalse(n['leido'])

    def test_get_count_only(self):
        url = reverse('notificaciones-list')
        response = self.client.get(url, {'count_only': 'true'})
        self.assertEqual(response.data['count'], 3)
        self.assertIn('count', response.data)
        self.assertNotIn('mensaje', str(response.data))

    def test_get_unread_count_only(self):
        url = reverse('notificaciones-list')
        response = self.client.get(url, {'unread_only': 'true', 'count_only': 'true'})
        self.assertEqual(response.data['count'], 2)
