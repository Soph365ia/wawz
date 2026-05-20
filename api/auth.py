# Роутер авторизации: реализует полный цикл регистрации с email-верификацией, входа, выхода и заполнения профиля пользователя.
from fastapi import APIRouter, Depends, Response, status, HTTPException, Request, Form
from sqlalchemy.orm import Session
from schemas.users import (
    UserRegisterRequest,
    UserRegisterResponse,
    VerificationCodeInput,
    VerificationResponse,
    VerificationSuccessResponse,
    ProfileCompleteRequest,
    ProfileCompleteResponse,
    ResendCodeRequest,
    ResendCodeResponse,
    UserLogin,
    AccessToken,
    UserInfo
)
from services.users import UserService
from services.email import EmailService
from repositories import UserRepository
from database import get_db
from dependency import get_current_user
from models.users import User
from models.email_verification import EmailVerification
from models.user_hobbies import UserHobby, ExperienceLevel
from models.goals import Goal
from core.security import verify_password, create_access_token
from core.exceptions import UserAlreadyExistsException, InvalidCredentialsException

router = APIRouter(prefix="/auth", tags=["Auth"])

# ШАГ 1: РЕГИСТРАЦИЯ (отправка кода)

@router.post("/register", response_model=UserRegisterResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserRegisterRequest, db: Session = Depends(get_db)):
    """
    Шаг 1: Регистрация пользователя
    
    - Проверяет что email и login не заняты
    - НЕ создаёт пользователя в БД (только после подтверждения кода)
    - Сохраняет данные во временное хранилище email_verifications
    - Отправляет код подтверждения на email
    """
    repo = UserRepository(db)
    email_service = EmailService(db)
    
    # Проверяем что email и login не заняты
    if repo.get_by_login(user.login):
        raise HTTPException(status_code=400, detail="Login уже занят")
    if repo.get_by_email(user.email):
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
    
    # НОВОЕ: Сохраняем данные во временное хранилище (не создаём User ещё)
    from core.security import hash_password
    
    code = email_service.create_verification_record(
        email=user.email,
        user_id=None,  # Пока нет пользователя
        temp_login=user.login,
        temp_password_hash=hash_password(user.password),
        temp_role=user.role
    )
    
    # Отправляем код на email
    email_service.send_verification_email(user.email, code)
    
    return UserRegisterResponse(
        message="На вашу почту отправлен код подтверждения",
        email=user.email,
        expires_in_minutes=15
    )

# ШАГ 2: ПОДТВЕРЖДЕНИЕ КОДА

@router.post("/verify-code", response_model=VerificationSuccessResponse)
def verify_code(input: VerificationCodeInput, db: Session = Depends(get_db)):
    """
    Шаг 2: Подтверждение email кодом
    
    - Проверяет код из EmailVerification таблицы
    - СОЗДАЁМ пользователя в БД только после подтверждения
    - НЕ возвращает токен (пользователь должен войти отдельно)
    """
    email_service = EmailService(db)
    
    # Проверяем код
    if not email_service.verify_code(input.email, input.code):
        raise HTTPException(status_code=400, detail="Неверный или истёкший код")
    
    # Находим запись верификации с временными данными
    verification = db.query(EmailVerification).filter(
        EmailVerification.email == input.email,
        EmailVerification.code == input.code
    ).first()
    
    if not verification or not verification.temp_login:
        raise HTTPException(status_code=400, detail="Данные регистрации не найдены")
    
    # Проверяем не создан ли уже пользователь
    from models.users import User
    existing_user = db.query(User).filter(User.email == input.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Пользователь уже создан")
    
    # СОЗДАЁМ пользователя только сейчас (после подтверждения кода)
    import uuid
    
    db_user = User(
        id=str(uuid.uuid4()),
        login=verification.temp_login,
        email=input.email,
        password_hash=verification.temp_password_hash,
        role=verification.temp_role or "user",
        is_verified=True  # ✅ Сразу подтверждаем
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    #НОВОЕ: Не возвращаем токен, только сообщение
    return VerificationSuccessResponse(
        message="Email подтвержден! Теперь войдите в систему",
        is_verified=True,
        login=verification.temp_login
    )

# ШАГ 3: ЗАПОЛНЕНИЕ ПРОФИЛЯ

@router.post("/complete-profile", response_model=ProfileCompleteResponse, status_code=status.HTTP_201_CREATED)
def complete_profile(
    profile: ProfileCompleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Шаг 3: Заполнение профиля после верификации
    
    - Добавляет хобби (до 5)
    - Добавляет цели (до 4)
    - Сохраняет дополнительную информацию
    """
    # Проверяем что пользователь подтверждён
    if not current_user.is_verified:
        raise HTTPException(status_code=403, detail="Email не подтверждён")
    
    # Добавляем хобби (1-5)
    for hobby_data in profile.hobbies:
        user_hobby = UserHobby(
            user_id=current_user.id,
            hobby_id=hobby_data.hobby_id,
            experience_level=hobby_data.experience_level,
            frequency_per_week=hobby_data.frequency_per_week,
            frequency_per_month=hobby_data.frequency_per_month,
            experience_description=hobby_data.experience_description,
            why_this_hobby=hobby_data.why_this_hobby,
            looking_for_in_partner=hobby_data.looking_for_in_partner,
            is_public=hobby_data.is_public
        )
        db.add(user_hobby)
    
    # Добавляем цели (1-4)
    for goal_data in profile.goals:
        goal = Goal(
            user_id=current_user.id,
            type=goal_data.type,
            title=goal_data.title,
            description=goal_data.description,
            target_date=goal_data.target_date,
            why_goal=goal_data.why_goal,
            is_public=goal_data.is_public
        )
        db.add(goal)
    
    db.commit()
    
    return ProfileCompleteResponse(
        message="Профиль успешно заполнен",
        user_id=current_user.id,
        hobbies_count=len(profile.hobbies),
        goals_count=len(profile.goals)
    )

# ПОВТОРНАЯ ОТПРАВКА КОДА

@router.post("/resend-code", response_model=ResendCodeResponse)
def resend_code(request: ResendCodeRequest, db: Session = Depends(get_db)):
    """
    Повторная отправка кода подтверждения
    """
    email_service = EmailService(db)
    
    # Проверяем что пользователь существует
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Проверяем что ещё не подтверждён
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email уже подтверждён")
    
    # Отправляем новый код
    code = email_service.resend_code(request.email, user.id)
    email_service.send_verification_email(request.email, code)
    
    return ResendCodeResponse(
        message="Код отправлен повторно",
        expires_in_minutes=15
    )

# ВХОД (LOGIN)

@router.post("/login", response_model=AccessToken)
def login(
    response: Response,
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Вход в систему
    
    - Проверяет login и пароль
    - Проверяет что email подтверждён
    - Возвращает access token
    """
    repo = UserRepository(db)
    
    # Находим пользователя
    user = repo.get_by_login(credentials.login)
    if not user:
        raise HTTPException(status_code=401, detail="Неверный login или пароль")
    
    # Проверяем пароль
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный login или пароль")
    
    # Проверяем что email подтверждён
    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Email не подтверждён. Пожалуйста, подтвердите код из письма."
        )
    
    # Генерируем токен
    token = create_access_token({"sub": user.login})
    
    # Устанавливаем cookie
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax"
    )
    
    return AccessToken(access_token=token, token_type="bearer")

# TOKEN (OAuth2 compatible)

@router.post("/token", response_model=AccessToken)
def token(
    response: Response,
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token endpoint (form-urlencoded)
    """
    repo = UserRepository(db)
    
    # Находим пользователя по login (username)
    user = repo.get_by_login(username)
    if not user:
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    
    # Проверяем пароль
    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    
    # Проверяем что email подтверждён
    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Email не подтверждён. Пожалуйста, подтвердите код из письма."
        )
    
    # Генерируем токен
    token = create_access_token({"sub": user.login})
    
    # Устанавливаем cookie
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax"
    )
    
    return AccessToken(access_token=token, token_type="bearer")

# ВЫХОД (LOGOUT)

@router.post("/logout")
def logout(response: Response):
    """
    Выход из системы
    """
    response.delete_cookie("access_token")
    return {"message": "Вы успешно вышли"}

# ТЕСТОВЫЙ ЭНДПОИНТ

@router.get("/test")
def test_auth(current_user: User = Depends(get_current_user)):
    """
    Проверка авторизации
    """
    return {
        "username": current_user.login,
        "email": current_user.email,
        "is_verified": current_user.is_verified,
        "role": current_user.role
    }