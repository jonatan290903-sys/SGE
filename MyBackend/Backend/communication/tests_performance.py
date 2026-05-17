from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from .models import Notificacion
import time

User = get_user_model()

class NotificationPerformanceTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='bolt@test.com',
            username='bolt',
            password='password123',
            role='directivo'
        )
        self.client.force_authenticate(user=self.user)

        # Create 100 notifications, 10 unread
        notifs = []
        for i in range(90):
            notifs.append(Notificacion(usuario=self.user, mensaje=f'Read {i}', leido=True))
        for i in range(10):
            notifs.append(Notificacion(usuario=self.user, mensaje=f'Unread {i}', leido=False))
        Notificacion.objects.bulk_create(notifs)

    def test_notification_list_performance(self):
        url = reverse('notificaciones-list')

        # Baseline
        start = time.time()
        response = self.client.get(url)
        end = time.time()
        baseline_duration = end - start
        self.assertEqual(len(response.data), 100)
        print(f"\nBaseline duration (100 notifs): {baseline_duration:.4f}s")

        # Test unread_only
        start = time.time()
        response = self.client.get(url, {'unread_only': 'true'})
        end = time.time()
        unread_duration = end - start
        self.assertEqual(len(response.data), 10)
        print(f"Unread only duration (10 notifs): {unread_duration:.4f}s")

        # Test count_only
        start = time.time()
        response = self.client.get(url, {'count_only': 'true', 'unread_only': 'true'})
        end = time.time()
        count_duration = end - start
        self.assertEqual(response.data['count'], 10)
        print(f"Count only duration (integer): {count_duration:.4f}s (data: {response.data})")
