from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User, Estudiante, Curso
from payments.models import Pago
import datetime

class PaymentsSecurityTests(APITestCase):
    def setUp(self):
        # Create users
        self.admin_user = User.objects.create_user(
            email='admin@test.com', username='admin', password='password123', role='administrativo'
        )
        self.student_user1 = User.objects.create_user(
            email='student1@test.com', username='student1', password='password123', role='estudiante'
        )
        self.student_user2 = User.objects.create_user(
            email='student2@test.com', username='student2', password='password123', role='estudiante'
        )
        self.teacher_user = User.objects.create_user(
            email='teacher@test.com', username='teacher', password='password123', role='docente'
        )

        # Create Estudiante objects
        self.estudiante1 = Estudiante.objects.create(
            user=self.student_user1, numero_expediente='EXP001', documento='DOC001',
            fecha_nacimiento=datetime.date(2010, 1, 1)
        )
        self.estudiante2 = Estudiante.objects.create(
            user=self.student_user2, numero_expediente='EXP002', documento='DOC002',
            fecha_nacimiento=datetime.date(2010, 2, 2)
        )

        # Create payments
        self.pago1 = Pago.objects.create(
            estudiante=self.estudiante1, monto=100.00, concepto='pension',
            fecha_vencimiento=datetime.date.today()
        )
        self.pago2 = Pago.objects.create(
            estudiante=self.estudiante2, monto=200.00, concepto='matricula',
            fecha_vencimiento=datetime.date.today()
        )

    def test_student_cannot_list_all_payments(self):
        self.client.force_authenticate(user=self.student_user1)
        url = reverse('pagos-list')
        response = self.client.get(url)
        # Currently this passes but it should ONLY return student1's payments
        # Or even better, if we want to be strict, maybe they shouldn't even use this endpoint for "all"
        # But for now, let's check if they see student2's payment
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # If it's a paginated response
        results = response.data.get('results', [])
        for item in results:
             self.assertEqual(item['estudiante_info']['id'], self.estudiante1.id)

        # In the current vulnerable state, this will likely fail because it returns both
        self.assertNotEqual(len(results), Pago.objects.count())

    def test_student_cannot_view_others_payment_detail(self):
        self.client.force_authenticate(user=self.student_user1)
        url = reverse('pago-detail', kwargs={'pk': self.pago2.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_create_payment(self):
        self.client.force_authenticate(user=self.student_user1)
        url = reverse('pagos-list')
        data = {
            'estudiante_id': self.estudiante1.id,
            'monto': 50.00,
            'concepto': 'otros',
            'fecha_vencimiento': str(datetime.date.today())
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_update_payment(self):
        self.client.force_authenticate(user=self.student_user1)
        url = reverse('pago-detail', kwargs={'pk': self.pago1.pk})
        data = {'monto': 150.00}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_delete_payment(self):
        self.client.force_authenticate(user=self.student_user1)
        url = reverse('pago-detail', kwargs={'pk': self.pago1.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_access_resumen_pagos(self):
        self.client.force_authenticate(user=self.student_user1)
        url = reverse('pagos-resumen')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_cannot_access_payments(self):
        self.client.force_authenticate(user=self.teacher_user)
        url = reverse('pagos-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_has_full_access(self):
        self.client.force_authenticate(user=self.admin_user)
        # List
        response = self.client.get(reverse('pagos-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Detail
        response = self.client.get(reverse('pago-detail', kwargs={'pk': self.pago1.pk}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Resumen
        response = self.client.get(reverse('pagos-resumen'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
