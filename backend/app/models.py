import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class UserRole(str, enum.Enum):
    noivo = "noivo"
    fornecedor = "fornecedor"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(SAEnum(UserRole, name="user_role"), nullable=False)
    full_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    couple_profile = relationship(
        "CoupleProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    vendor_profile = relationship(
        "VendorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class CoupleProfile(Base):
    """Perfil de noivos. Campos adicionais (data do casamento, cidade etc.) entram aqui conforme as funções forem detalhadas."""

    __tablename__ = "couple_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    city = Column(String, nullable=True)

    user = relationship("User", back_populates="couple_profile")


class VendorProfile(Base):
    """Perfil de fornecedores. Serviços oferecidos e demais campos entram aqui conforme as funções forem detalhadas."""

    __tablename__ = "vendor_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    business_name = Column(String, nullable=False)
    city = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    user = relationship("User", back_populates="vendor_profile")
