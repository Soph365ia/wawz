from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from models import User as UserModel
from core.security import decode_access_token
from core.exceptions import InvalidCredentialsException
from database import get_db
from datetime import datetime

async def get_current_user(request: Request, db: Session = Depends(get_db)):
    # Пробуем получить токен из заголовка Authorization
    auth_header = request.headers.get("Authorization")
    token = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]  # Убираем "Bearer "
    else:
        # Если нет заголовка, пробуем куки
        token = request.cookies.get("access_token")
    
    if not token:
        raise InvalidCredentialsException()
    
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise InvalidCredentialsException()
    
    user = db.query(UserModel).filter(UserModel.login == payload["sub"]).first()
    if not user:
        raise InvalidCredentialsException()
    
    user.last_seen = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    return user