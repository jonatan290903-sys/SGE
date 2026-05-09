from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User, Curso, Estudiante
from courses.models import Materia, Asistencia

class AsistenciaBatchTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testadmin',
            email='admin@test.com',
            password='password123',
            role='administrativo'
        )
        self.client.force_authenticate(user=self.user)

        self.curso = Curso.objects.create(nombre='1A', nivel='primaria')
        self.materia1 = Materia.objects.create(nombre='Matemática', codigo='MAT1', curso=self.curso, numero_horas=4)
        self.materia2 = Materia.objects.create(nombre='Lengua', codigo='LEN1', curso=self.curso, numero_horas=4)

        self.estudiante = Estudiante.objects.create(
            user=User.objects.create_user(username='est1', email='est1@test.com', password='password123', role='estudiante'),
            numero_expediente='EXP001',
            documento='DOC001',
            fecha_nacimiento='2010-01-01',
            curso=self.curso
        )

        self.fecha = '2023-10-27'
        Asistencia.objects.create(estudiante=self.estudiante, materia=self.materia1, fecha=self.fecha, estado='P')
        Asistencia.objects.create(estudiante=self.estudiante, materia=self.materia2, fecha=self.fecha, estado='F')

    def test_asistencia_curso_dia(self):
        url = reverse('asistencia-curso-dia', kwargs={'curso_id': self.curso.id})
        response = self.client.get(url, {'fecha': self.fecha})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        # Verify both materias are present
        materia_ids = [item['materia'] for item in response.data]
        self.assertIn(self.materia1.id, materia_ids)
        self.assertIn(self.materia2.id, materia_ids)

        # Verify specific data
        mat1_asis = next(item for item in response.data if item['materia'] == self.materia1.id)
        self.assertEqual(mat1_asis['estado'], 'P')

        mat2_asis = next(item for item in response.data if item['materia'] == self.materia2.id)
        self.assertEqual(mat2_asis['estado'], 'F')

    def test_asistencia_curso_dia_missing_date(self):
        url = reverse('asistencia-curso-dia', kwargs={'curso_id': self.curso.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
