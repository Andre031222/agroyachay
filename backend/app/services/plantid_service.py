import requests
import os
import base64

class PlantIDService:
    BASE_URL = "https://api.plant.id/v2"
    API_KEY = os.getenv('PLANT_ID_API_KEY')

    @staticmethod
    def identify_disease(image_path):
        try:
            with open(image_path, 'rb') as image_file:
                image_data = base64.b64encode(image_file.read()).decode('utf-8')

            headers = {
                'Content-Type': 'application/json',
                'Api-Key': PlantIDService.API_KEY
            }

            payload = {
                'images': [f'data:image/jpeg;base64,{image_data}'],
                'modifiers': ['diseases', 'similar_images'],
                'disease_details': ['cause', 'common_names', 'classification', 'description', 'treatment']
            }

            response = requests.post(
                f'{PlantIDService.BASE_URL}/health_assessment',
                json=payload,
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()

            if data.get('health_assessment'):
                diseases = data['health_assessment'].get('diseases', [])

                if diseases:
                    top_disease = diseases[0]

                    return {
                        'nombre': top_disease['name'],
                        'confianza': top_disease['probability'] * 100,
                        'descripcion': top_disease.get('description', 'Sin descripción disponible'),
                        'causas': top_disease.get('cause', 'Causas no especificadas'),
                        'tratamiento': PlantIDService._format_treatment(top_disease.get('treatment', {})),
                        'prevencion': PlantIDService._format_prevention(top_disease.get('treatment', {})),
                        'is_healthy': False
                    }
                else:
                    return {
                        'nombre': 'Planta Saludable',
                        'confianza': 95.0,
                        'descripcion': 'No se detectaron enfermedades o plagas en la imagen',
                        'tratamiento': 'Continuar con prácticas de manejo actuales',
                        'is_healthy': True
                    }

            return None
        except Exception:
            return None

    @staticmethod
    def _format_treatment(treatment_data):
        if not treatment_data:
            return "Consultar con un agrónomo para tratamiento específico"

        chemical = treatment_data.get('chemical', [])
        biological = treatment_data.get('biological', [])

        treatment_text = []

        if chemical:
            treatment_text.append("Tratamiento químico:\n" + "\n".join([f"- {t}" for t in chemical]))

        if biological:
            treatment_text.append("Tratamiento biológico:\n" + "\n".join([f"- {t}" for t in biological]))

        return "\n\n".join(treatment_text) if treatment_text else "Consultar con especialista"

    @staticmethod
    def _format_prevention(treatment_data):
        if not treatment_data:
            return "Mantener buenas prácticas agrícolas"

        prevention = treatment_data.get('prevention', [])

        if prevention:
            return "\n".join([f"- {p}" for p in prevention])

        return "Mantener buenas prácticas de manejo integrado de plagas"
