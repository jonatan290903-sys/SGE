from django.test import TestCase
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from .models import Comunicado, Notificacion

User = get_user_model()

class CommunicationTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@test.com', username='testuser', password='password123', role='directivo')

    def test_create_comunicado(self):
        comunicado = Comunicado.objects.create(titulo='Test Title', contenido='Test Content', autor=self.user)
        self.assertEqual(comunicado.titulo, 'Test Title')
        self.assertEqual(comunicado.autor, self.user)

    def test_create_notificacion(self):
        notif = Notificacion.objects.create(usuario=self.user, mensaje='Test Message')
        self.assertEqual(notif.usuario, self.user)
        self.assertFalse(notif.leido)

    def test_notificaciones_optimization_params(self):
        Notificacion.objects.create(usuario=self.user, mensaje='M1', leido=False)
        Notificacion.objects.create(usuario=self.user, mensaje='M2', leido=True)

        self.client.force_authenticate(user=self.user)

        # Test unread_only
        response = self.client.get('/api/v1/communication/notificaciones/', {'unread_only': 'true'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

        # Test count_only
        response = self.client.get('/api/v1/communication/notificaciones/', {'count_only': 'true'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 2)

        # Test both
        response = self.client.get('/api/v1/communication/notificaciones/', {'unread_only': 'true', 'count_only': 'true'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
