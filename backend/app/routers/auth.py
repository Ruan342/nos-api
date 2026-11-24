from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup/noivo", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def signup_noivo(payload: schemas.SignupNoivo, db: Session = Depends(get_db)) -> models.User:
    user = models.User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=models.UserRole.noivo,
        full_name=payload.full_name,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Este e-mail já está cadastrado.")
    db.refresh(user)
    db.add(models.CoupleProfile(user_id=user.id))
    db.commit()
    return user


@router.post(
    "/signup/fornecedor", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED
)
def signup_fornecedor(payload: schemas.SignupFornecedor, db: Session = Depends(get_db)) -> models.User:
    user = models.User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=models.UserRole.fornecedor,
        full_name=payload.full_name,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Este e-mail já está cadastrado.")
    db.refresh(user)
    db.add(models.VendorProfile(user_id=user.id, business_name=payload.business_name))
    db.commit()
    return user


@router.post("/login", response_model=schemas.LoginResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)) -> schemas.LoginResponse:
    user = (
        db.query(models.User)
        .filter(models.User.email == payload.email.lower(), models.User.role == payload.role)
        .first()
    )
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")
    token = create_access_token(str(user.id), user.role.value)
    return schemas.LoginResponse(user=user, access_token=token)


@router.post("/forgot-password/check", response_model=schemas.ForgotPasswordCheckResponse)
def forgot_password_check(
    payload: schemas.ForgotPasswordCheckRequest, db: Session = Depends(get_db)
) -> schemas.ForgotPasswordCheckResponse:
    exists = (
        db.query(models.User).filter(models.User.email == payload.email.lower()).first()
        is not None
    )
    return schemas.ForgotPasswordCheckResponse(exists=exists)


@router.post("/forgot-password/reset", response_model=schemas.MessageResponse)
def forgot_password_reset(
    payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)
) -> schemas.MessageResponse:
    user = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="E-mail não encontrado.")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return schemas.MessageResponse(message="Senha atualizada com sucesso.")
