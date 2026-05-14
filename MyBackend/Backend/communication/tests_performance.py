import time
import json
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from communication.models import Notificacion

User = get_user_model()

class NotificationPerformanceTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='bolt@test.com',
            username='bolt',
            password='password123',
            role='estudiante',
            first_name='Bolt',
            last_name='Performance'
        )
        self.client.force_authenticate(user=self.user)

        # Create 100 notifications (50 unread)
        notifs = []
        for i in range(100):
            notifs.append(Notificacion(
                usuario=self.user,
                mensaje=f'Notification {i}',
                leido=(i >= 50)
            ))
        Notificacion.objects.bulk_create(notifs)
        self.url = reverse('notificaciones-list')

    def test_performance_current_vs_optimized(self):
        # Measure current approach (fetching all and filtering)
        start_time = time.time()
        response = self.client.get(self.url)
        duration_current = time.time() - start_time

        data = response.data
        unread_count_client = len([n for n in data if not n['leido']])
        payload_size_current = len(json.dumps(data))

        print(f"\n[CURRENT] Duration: {duration_current:.4f}s, Payload: {payload_size_current} bytes, Unread: {unread_count_client}")

        # Measure optimized approach (fetching only count)
        # Note: This will only work AFTER implementation
        start_time = time.time()
        response_opt = self.client.get(self.url, {'count_only': 'true', 'unread_only': 'true'})
        duration_opt = time.time() - start_time

        data_opt = response_opt.data
        # If not implemented yet, it will return full list
        payload_size_opt = len(json.dumps(data_opt))

        print(f"[OPTIMIZED] Duration: {duration_opt:.4f}s, Payload: {payload_size_opt} bytes")

        if 'count' in data_opt:
            print(f"Optimized Count: {data_opt['count']}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
