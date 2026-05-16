from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from accounts.models import Estudiante
from payments.models import Pago
from datetime import date

User = get_user_model()

class PaymentSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create users
        self.admin_user = User.objects.create_user(
            email='admin@test.com', username='admin', password='password123', role='administrativo'
        )
        self.student1_user = User.objects.create_user(
            email='student1@test.com', username='student1', password='password123', role='estudiante'
        )
        self.student2_user = User.objects.create_user(
            email='student2@test.com', username='student2', password='password123', role='estudiante'
        )

        # Create student profiles
        self.student1 = Estudiante.objects.create(
            user=self.student1_user, numero_expediente='EXP001', documento='DOC001', fecha_nacimiento='2010-01-01'
        )
        self.student2 = Estudiante.objects.create(
            user=self.student2_user, numero_expediente='EXP002', documento='DOC002', fecha_nacimiento='2010-01-01'
        )

        # Create payments
        self.pago1 = Pago.objects.create(
            estudiante=self.student1, monto=100.00, concepto='pension', fecha_vencimiento='2023-12-01'
        )
        self.pago2 = Pago.objects.create(
            estudiante=self.student2, monto=200.00, concepto='pension', fecha_vencimiento='2023-12-01'
        )

    def test_student_cannot_see_others_payments_list(self):
        self.client.force_authenticate(user=self.student1_user)
        response = self.client.get('/api/v1/pagos/')
        # Currently, this likely returns both payments. It should only return student1's.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # If pagination is used, results are in 'results'
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.pago1.id)

    def test_student_cannot_access_others_pago_detail(self):
        self.client.force_authenticate(user=self.student1_user)
        response = self.client.get(f'/api/v1/pagos/{self.pago2.id}/')
        # This should be Forbidden or Not Found
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_access_resumen_pagos(self):
        self.client.force_authenticate(user=self.student1_user)
        response = self.client.get('/api/v1/pagos/resumen/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
