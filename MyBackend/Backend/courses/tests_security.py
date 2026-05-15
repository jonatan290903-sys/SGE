from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User, Estudiante, Docente, Curso
from courses.models import Materia, Actividad, Calificacion, Asistencia
from datetime import date

class CoursesSecurityTests(APITestCase):
    def setUp(self):
        # Create a course
        self.curso = Curso.objects.create(nombre="1A", nivel="primaria")

        # Create a student
        self.user_estudiante = User.objects.create_user(
            username="estudiante@test.com",
            email="estudiante@test.com",
            password="password123",
            role="estudiante"
        )
        self.estudiante = Estudiante.objects.create(
            user=self.user_estudiante,
            numero_expediente="EST001",
            documento="12345678",
            fecha_nacimiento=date(2010, 1, 1),
            curso=self.curso
        )

        # Create a teacher
        self.user_docente = User.objects.create_user(
            username="docente@test.com",
            email="docente@test.com",
            password="password123",
            role="docente"
        )
        self.docente = Docente.objects.create(
            user=self.user_docente,
            documento="87654321",
            especialidad="Matematica",
            titulo_profesional="Licenciado",
            fecha_contratacion=date(2020, 1, 1)
        )

        # Create another teacher
        self.user_docente_2 = User.objects.create_user(
            username="docente2@test.com",
            email="docente2@test.com",
            password="password123",
            role="docente"
        )
        self.docente_2 = Docente.objects.create(
            user=self.user_docente_2,
            documento="11223344",
            especialidad="Fisica",
            titulo_profesional="Licenciado",
            fecha_contratacion=date(2020, 1, 1)
        )

        # Create a subject assigned to the first teacher
        self.materia = Materia.objects.create(
            nombre="Matematicas",
            codigo="MAT101",
            curso=self.curso,
            docente=self.docente,
            numero_horas=4
        )

        # Create an activity for the subject
        self.actividad = Actividad.objects.create(
            materia=self.materia,
            nombre="Examen 1",
            tipo="examen",
            trimestre="T1",
            creada_por=self.user_docente
        )

    def test_student_cannot_guardar_nota(self):
        """
        SECURITY: A student should be blocked from saving/updating grades.
        """
        self.client.force_authenticate(user=self.user_estudiante)
        url = reverse('guardar-nota')
        data = {
            'estudiante': self.estudiante.id,
            'actividad': self.actividad.id,
            'nota': 100
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Calificacion.objects.count(), 0)

    def test_student_cannot_registrar_asistencia_bulk(self):
        """
        SECURITY: A student should be blocked from registering bulk attendance.
        """
        self.client.force_authenticate(user=self.user_estudiante)
        url = reverse('asistencia-bulk', kwargs={'pk': self.materia.pk})
        data = {
            'fecha': str(date.today()),
            'registros': [
                {'estudiante': self.estudiante.id, 'estado': 'P'}
            ]
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Asistencia.objects.count(), 0)

    def test_unassigned_teacher_cannot_guardar_nota(self):
        """
        SECURITY: A teacher not assigned to the subject should be blocked from saving grades.
        """
        self.client.force_authenticate(user=self.user_docente_2)
        url = reverse('guardar-nota')
        data = {
            'estudiante': self.estudiante.id,
            'actividad': self.actividad.id,
            'nota': 100
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_assigned_teacher_can_guardar_nota(self):
        """
        Assigned teacher should still be able to save grades.
        """
        self.client.force_authenticate(user=self.user_docente)
        url = reverse('guardar-nota')
        data = {
            'estudiante': self.estudiante.id,
            'actividad': self.actividad.id,
            'nota': 100
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Calificacion.objects.count(), 1)
