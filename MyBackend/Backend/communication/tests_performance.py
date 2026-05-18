import time
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from .models import Notificacion

User = get_user_model()

class NotificationPerformanceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='perf@test.com',
            username='perftest',
            password='password123',
            role='docente'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Create 100 notifications (50 read, 50 unread)
        notifs = []
        for i in range(100):
            notifs.append(Notificacion(
                usuario=self.user,
                mensaje=f"Notificacion {i}",
                leido=(i >= 50)
            ))
        Notificacion.objects.bulk_create(notifs)
        self.url = reverse('notificaciones-list')

    def test_performance_full_list(self):
        start_time = time.time()
        response = self.client.get(self.url)
        end_time = time.time()

        duration = (end_time - start_time) * 1000
        print(f"\n[BASELINE] Full list (100 items) took: {duration:.2f}ms")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 100)

    def test_performance_count_only(self):
        start_time = time.time()
        response = self.client.get(f"{self.url}?unread_only=true&count_only=true")
        end_time = time.time()

        duration = (end_time - start_time) * 1000
        print(f"[OPTIMIZED] Count only (100 items pool) took: {duration:.2f}ms")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 50)
