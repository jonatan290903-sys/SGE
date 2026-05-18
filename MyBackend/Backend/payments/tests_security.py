from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User, Estudiante, Curso
from payments.models import Pago
import datetime

class PaymentsSecurityTest(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create a course
        self.curso = Curso.objects.create(nombre="1A", nivel="primaria")

        # Create an admin user
        self.admin_user = User.objects.create_user(
            email='admin@test.com', username='admin', password='password123', role='administrativo'
        )

        # Create two students
        self.user1 = User.objects.create_user(
            email='student1@test.com', username='student1', password='password123', role='estudiante'
        )
        self.estudiante1 = Estudiante.objects.create(
            user=self.user1, numero_expediente='EXP001', documento='DOC001',
            fecha_nacimiento=datetime.date(2010, 1, 1), curso=self.curso
        )

        self.user2 = User.objects.create_user(
            email='student2@test.com', username='student2', password='password123', role='estudiante'
        )
        self.estudiante2 = Estudiante.objects.create(
            user=self.user2, numero_expediente='EXP002', documento='DOC002',
            fecha_nacimiento=datetime.date(2010, 1, 1), curso=self.curso
        )

        # Create a payment for student 1
        self.pago1 = Pago.objects.create(
            estudiante=self.estudiante1, monto=100, concepto='pension',
            fecha_vencimiento=datetime.date.today()
        )

        # Create a payment for student 2
        self.pago2 = Pago.objects.create(
            estudiante=self.estudiante2, monto=200, concepto='pension',
            fecha_vencimiento=datetime.date.today()
        )

    def test_student_cannot_see_others_payments(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/v1/pagos/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should only see their own payment
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.pago1.id)

    def test_student_cannot_access_others_payment_detail(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/v1/pagos/{self.pago2.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_see_resumen_pagos(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/v1/pagos/resumen/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_see_all_payments(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/pagos/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_admin_can_see_resumen_pagos(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/pagos/resumen/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
