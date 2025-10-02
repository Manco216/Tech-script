# models.py
from flask_login import UserMixin

class Usuario(UserMixin):
    def __init__(self, id, nombre, correo, contrasena=None, documento=None, direccion=None, telefono=None, fk_rol=1):
        self.id = id
        self.nombre = nombre
        self.correo = correo
        self.contrasena = contrasena
        self.documento = documento
        self.direccion = direccion
        self.telefono = telefono
        self.fk_rol = fk_rol

    def __repr__(self):
        return f"<Usuario {self.id} - {self.nombre} ({self.correo})>"

    @staticmethod
    def from_dict(data):
        return Usuario(
            id=data.get("id"),
            nombre=data.get("nombre"),
            correo=data.get("correo"),
            contrasena=data.get("contrasena"),
            documento=data.get("documento"),
            direccion=data.get("direccion"),
            telefono=data.get("telefono"),
            fk_rol=data.get("fk_rol", 1)
        )
